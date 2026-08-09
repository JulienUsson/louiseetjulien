"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { generateCode, guestUrl } from "@/lib/codes";
import { AUDIENCES, GUEST_TYPES, audienceMatches } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { infoEmail, invitationEmail, testEmail } from "@/lib/email-templates";
import { sendMail } from "@/lib/mail";
import {
  SETTING_DEFAULTS,
  formatDate,
  getSettings,
  saveSettings,
  type SettingKey,
} from "@/lib/settings";

export type ActionResult = { ok: boolean; error?: string; message?: string };

function fail(error: string): ActionResult {
  return { ok: false, error };
}

/** Réserve un code non utilisé ; en pratique la première tentative suffit. */
async function uniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const existing = await prisma.guest.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Impossible de générer un code unique.");
}

// --------------------------------------------------------------------------
// Invités
// --------------------------------------------------------------------------

const guestSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est obligatoire.").max(80),
  lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
  email: z.string().trim().max(200).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  type: z.enum(GUEST_TYPES),
  maxCompanions: z.coerce.number().int().min(0).max(10),
  notes: z.string().trim().max(2000).optional().default(""),
});

export type GuestInput = z.input<typeof guestSchema>;

export async function createGuest(input: GuestInput): Promise<ActionResult> {
  await requireAdmin();

  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const data = parsed.data;
  await prisma.guest.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      type: data.type,
      maxCompanions: data.maxCompanions,
      notes: data.notes || null,
      code: await uniqueCode(),
    },
  });

  revalidatePath("/admin/invites");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateGuest(
  id: string,
  input: GuestInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const data = parsed.data;
  await prisma.guest.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      type: data.type,
      maxCompanions: data.maxCompanions,
      notes: data.notes || null,
    },
  });

  revalidatePath("/admin/invites");
  revalidatePath(`/admin/invites/${id}`);
  return { ok: true };
}

export async function deleteGuest(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.guest.delete({ where: { id } });
  revalidatePath("/admin/invites");
  revalidatePath("/admin");
  return { ok: true };
}

/** Invalide l'ancien lien : utile si un code a été partagé par erreur. */
export async function regenerateGuestCode(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.guest.update({
    where: { id },
    data: { code: await uniqueCode() },
  });
  revalidatePath(`/admin/invites/${id}`);
  revalidatePath("/admin/invites");
  return { ok: true, message: "Nouveau lien généré, l'ancien ne marche plus." };
}

/**
 * Import en masse, une ligne par invité :
 * `Prénom;Nom;FULL|COCKTAIL;accompagnants;email`
 * Seuls le prénom et le nom sont obligatoires.
 */
export async function importGuests(raw: string): Promise<ActionResult> {
  await requireAdmin();

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return fail("Rien à importer.");

  let created = 0;
  const errors: string[] = [];

  for (const [index, line] of lines.entries()) {
    const cells = line.split(/[;\t,]/).map((cell) => cell.trim());
    const [firstName, lastName, type, maxCompanions, email] = cells;

    const parsed = guestSchema.safeParse({
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      type: type ? type.toUpperCase() : "FULL",
      maxCompanions: maxCompanions ? Number(maxCompanions) : 0,
      email: email ?? "",
    });

    if (!parsed.success) {
      errors.push(`Ligne ${index + 1} : ${parsed.error.issues[0].message}`);
      continue;
    }

    const data = parsed.data;
    await prisma.guest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        type: data.type,
        maxCompanions: data.maxCompanions,
        code: await uniqueCode(),
      },
    });
    created++;
  }

  revalidatePath("/admin/invites");
  revalidatePath("/admin");

  if (created === 0) {
    return fail(errors[0] ?? "Aucun invité n'a pu être importé.");
  }

  return {
    ok: true,
    message: errors.length
      ? `${created} invité(s) importé(s), ${errors.length} ligne(s) ignorée(s) : ${errors[0]}`
      : `${created} invité(s) importé(s).`,
  };
}

// --------------------------------------------------------------------------
// Emails
// --------------------------------------------------------------------------

export async function sendInvitation(guestId: string): Promise<ActionResult> {
  await requireAdmin();

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest) return fail("Invité introuvable.");
  if (!guest.email) return fail("Cet invité n'a pas encore d'adresse email.");

  const settings = await getSettings();
  const email = invitationEmail({
    coupleNames: settings.coupleNames,
    firstName: guest.firstName,
    url: guestUrl(guest.code),
    weddingDateLabel: formatDate(settings.weddingDate),
  });

  const result = await sendMail({
    ...email,
    to: guest.email,
    kind: "INVITATION",
    guestId: guest.id,
  });

  revalidatePath("/admin/emails");
  revalidatePath(`/admin/invites/${guestId}`);

  return result.ok
    ? { ok: true, message: `Invitation envoyée à ${guest.email}.` }
    : fail(result.error);
}

/** Envoie son lien à chaque invité qui a un email et n'a jamais rien reçu. */
export async function sendPendingInvitations(): Promise<ActionResult> {
  await requireAdmin();

  const guests = await prisma.guest.findMany({
    where: {
      email: { not: null },
      emails: { none: { kind: "INVITATION", status: "SENT" } },
    },
  });

  if (guests.length === 0) {
    return { ok: true, message: "Tout le monde a déjà reçu son invitation." };
  }

  const settings = await getSettings();
  const weddingDateLabel = formatDate(settings.weddingDate);
  let sent = 0;
  let firstError: string | undefined;

  for (const guest of guests) {
    const email = invitationEmail({
      coupleNames: settings.coupleNames,
      firstName: guest.firstName,
      url: guestUrl(guest.code),
      weddingDateLabel,
    });

    const result = await sendMail({
      ...email,
      to: guest.email!,
      kind: "INVITATION",
      guestId: guest.id,
    });

    if (result.ok) sent++;
    else firstError ??= result.error;
  }

  revalidatePath("/admin/emails");
  revalidatePath("/admin/invites");

  if (sent === 0) return fail(firstError ?? "Aucun email n'a pu être envoyé.");

  return {
    ok: true,
    message: `${sent} invitation(s) envoyée(s)${
      firstError ? ` — ${guests.length - sent} en échec : ${firstError}` : ""
    }.`,
  };
}

/** Diffuse une info publiée à tous les invités concernés qui ont un email. */
export async function sendInfoToGuests(
  infoPostId: string,
): Promise<ActionResult> {
  await requireAdmin();

  const info = await prisma.infoPost.findUnique({ where: { id: infoPostId } });
  if (!info) return fail("Information introuvable.");
  if (!info.published) return fail("Publiez l'information avant de l'envoyer.");

  const guests = await prisma.guest.findMany({
    where: { email: { not: null } },
  });
  const recipients = guests.filter((guest) =>
    audienceMatches(info.audience, guest.type),
  );

  if (recipients.length === 0) {
    return fail("Aucun invité concerné n'a encore renseigné son email.");
  }

  const settings = await getSettings();
  let sent = 0;
  let firstError: string | undefined;

  for (const guest of recipients) {
    const email = infoEmail({
      coupleNames: settings.coupleNames,
      firstName: guest.firstName,
      title: info.title,
      body: info.body,
      url: guestUrl(guest.code),
    });

    const result = await sendMail({
      ...email,
      to: guest.email!,
      kind: "INFO",
      guestId: guest.id,
      infoPostId: info.id,
    });

    if (result.ok) sent++;
    else firstError ??= result.error;
  }

  revalidatePath("/admin/emails");

  if (sent === 0) return fail(firstError ?? "Aucun email n'a pu être envoyé.");

  return {
    ok: true,
    message: `Information envoyée à ${sent} invité(s)${
      firstError ? ` — ${recipients.length - sent} en échec` : ""
    }.`,
  };
}

export async function sendTestEmail(to: string): Promise<ActionResult> {
  await requireAdmin();

  const address = z.string().trim().email().safeParse(to);
  if (!address.success) return fail("Adresse email invalide.");

  const settings = await getSettings();
  const result = await sendMail({
    ...testEmail(settings.coupleNames),
    to: address.data,
    kind: "TEST",
  });

  revalidatePath("/admin/emails");

  return result.ok
    ? { ok: true, message: `Email de test envoyé à ${address.data}.` }
    : fail(result.error);
}

// --------------------------------------------------------------------------
// Informations
// --------------------------------------------------------------------------

const infoSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(160),
  body: z.string().trim().min(1, "Le contenu est obligatoire.").max(10000),
  audience: z.enum(AUDIENCES),
  published: z.boolean().optional().default(false),
  pinned: z.boolean().optional().default(false),
  position: z.coerce.number().int().min(0).max(999).optional().default(0),
});

export type InfoInput = z.input<typeof infoSchema>;

export async function saveInfo(
  id: string | null,
  input: InfoInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = infoSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const data = parsed.data;

  if (id) {
    const existing = await prisma.infoPost.findUnique({ where: { id } });
    await prisma.infoPost.update({
      where: { id },
      data: {
        ...data,
        // La date de publication marque la première mise en ligne.
        publishedAt: data.published
          ? (existing?.publishedAt ?? new Date())
          : null,
      },
    });
  } else {
    await prisma.infoPost.create({
      data: { ...data, publishedAt: data.published ? new Date() : null },
    });
  }

  revalidatePath("/admin/infos");
  return { ok: true };
}

export async function deleteInfo(id: string): Promise<ActionResult> {
  await requireAdmin();
  await prisma.infoPost.delete({ where: { id } });
  revalidatePath("/admin/infos");
  return { ok: true };
}

export async function toggleInfoPublished(
  id: string,
  published: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  const existing = await prisma.infoPost.findUnique({ where: { id } });
  if (!existing) return fail("Information introuvable.");

  await prisma.infoPost.update({
    where: { id },
    data: {
      published,
      publishedAt: published ? (existing.publishedAt ?? new Date()) : null,
    },
  });

  revalidatePath("/admin/infos");
  return { ok: true };
}

// --------------------------------------------------------------------------
// Réglages
// --------------------------------------------------------------------------

export async function updateSettings(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const values: Partial<Record<SettingKey, string>> = {};
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value.trim();
  }

  await saveSettings(values);

  revalidatePath("/admin/reglages");
  revalidatePath("/", "layout");
  return { ok: true, message: "Réglages enregistrés." };
}

// --------------------------------------------------------------------------
// Session
// --------------------------------------------------------------------------

export async function logout(): Promise<void> {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/admin/login");
}
