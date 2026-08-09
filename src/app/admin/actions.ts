"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { generateCode, guestUrl } from "@/lib/codes";
import { AUDIENCES, GUEST_TYPES, audienceMatches } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  customEmail,
  infoEmail,
  invitationEmail,
  testEmail,
} from "@/lib/email-templates";
import { geocodeAddress } from "@/lib/geocode";
import { sendMail } from "@/lib/mail";
import {
  SETTING_DEFAULTS,
  formatDate,
  getSettings,
  saveSettings,
  type SettingKey,
  type Settings,
} from "@/lib/settings";

export type ActionResult = {
  ok: boolean;
  error?: string;
  message?: string;
  /** Renseigné par `geocodeSetting` uniquement. */
  coords?: string;
};

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

export async function createGuest(
  input: GuestInput,
  sendInvitation = false,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = guestSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const data = parsed.data;
  const guest = await prisma.guest.create({
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

  if (!sendInvitation || !guest.email) return { ok: true };

  // L'invité est créé quoi qu'il arrive : un échec d'envoi se signale, mais
  // ne doit pas donner l'impression que la création a échoué.
  const result = await sendInvitationTo(guest);
  revalidatePath("/admin/emails");

  return result.ok
    ? { ok: true, message: `Invité créé, invitation envoyée à ${guest.email}.` }
    : {
        ok: true,
        message: `Invité créé, mais l'invitation n'est pas partie : ${result.error}`,
      };
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
export async function importGuests(
  raw: string,
  sendInvitations = false,
): Promise<ActionResult> {
  await requireAdmin();

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return fail("Rien à importer.");

  let created = 0;
  const errors: string[] = [];
  const invitable: InvitableGuest[] = [];

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
    const guest = await prisma.guest.create({
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
    if (guest.email) invitable.push(guest);
  }

  revalidatePath("/admin/invites");
  revalidatePath("/admin");

  if (created === 0) {
    return fail(errors[0] ?? "Aucun invité n'a pu être importé.");
  }

  const parts = [`${created} invité(s) importé(s)`];
  if (errors.length) {
    parts.push(`${errors.length} ligne(s) ignorée(s) : ${errors[0]}`);
  }

  // Les invités sont importés quoi qu'il arrive : l'envoi est un supplément
  // dont on rend compte à part.
  if (sendInvitations && invitable.length > 0) {
    let sent = 0;
    let firstError: string | undefined;

    for (const guest of invitable) {
      const result = await sendInvitationTo(guest);
      if (result.ok) sent++;
      else firstError ??= result.error;
    }

    revalidatePath("/admin/emails");
    parts.push(
      firstError
        ? `${sent} invitation(s) envoyée(s), ${invitable.length - sent} en échec : ${firstError}`
        : `${sent} invitation(s) envoyée(s)`,
    );
  }

  return { ok: true, message: `${parts.join(", ")}.` };
}

// --------------------------------------------------------------------------
// Emails
// --------------------------------------------------------------------------

type InvitableGuest = {
  id: string;
  firstName: string;
  code: string;
  email: string | null;
};

/** Envoi du lien d'invitation à un invité déjà chargé. */
async function sendInvitationTo(
  guest: InvitableGuest,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!guest.email) {
    return { ok: false, error: "Cet invité n'a pas encore d'adresse email." };
  }

  const settings = await getSettings();
  const email = invitationEmail({
    coupleNames: settings.coupleNames,
    firstName: guest.firstName,
    url: guestUrl(guest.code),
    weddingDateLabel: formatDate(settings.weddingDate),
  });

  return sendMail({
    ...email,
    to: guest.email,
    kind: "INVITATION",
    guestId: guest.id,
  });
}

export async function sendInvitation(guestId: string): Promise<ActionResult> {
  await requireAdmin();

  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest) return fail("Invité introuvable.");

  const result = await sendInvitationTo(guest);

  revalidatePath("/admin/emails");
  revalidatePath(`/admin/invites/${guestId}`);

  return result.ok
    ? { ok: true, message: `Invitation envoyée à ${guest.email}.` }
    : fail(result.error);
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

const RSVP_STATES = ["YES", "NO", "PENDING"] as const;

const customEmailSchema = z.object({
  subject: z.string().trim().min(1, "L'objet est obligatoire.").max(200),
  body: z.string().trim().min(1, "Le message est obligatoire.").max(10000),
  /** Vide = aucune restriction sur ce critère. */
  types: z.array(z.enum(GUEST_TYPES)).default([]),
  states: z.array(z.enum(RSVP_STATES)).default([]),
});

export type CustomEmailInput = z.input<typeof customEmailSchema>;

/** Traduit un état de réponse en filtre Prisma sur `attending`. */
function attendingFilter(state: (typeof RSVP_STATES)[number]) {
  if (state === "YES") return { attending: true };
  if (state === "NO") return { attending: false };
  return { attending: null };
}

/**
 * Écrit un message libre à une partie des invités, ciblée par formule et par
 * état de réponse — pour relancer les silencieux ou n'écrire qu'aux présents.
 */
export async function sendCustomEmail(
  input: CustomEmailInput,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = customEmailSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { subject, body, types, states } = parsed.data;

  const recipients = await prisma.guest.findMany({
    where: {
      email: { not: null },
      ...(types.length > 0 ? { type: { in: [...types] } } : {}),
      ...(states.length > 0
        ? { OR: states.map(attendingFilter) }
        : {}),
    },
  });

  if (recipients.length === 0) {
    return fail(
      "Aucun invité ne correspond à ces filtres, ou aucun n'a renseigné son email.",
    );
  }

  const settings = await getSettings();
  let sent = 0;
  let firstError: string | undefined;

  for (const guest of recipients) {
    const email = customEmail({
      coupleNames: settings.coupleNames,
      firstName: guest.firstName,
      subject,
      body,
      url: guestUrl(guest.code),
    });

    const result = await sendMail({
      ...email,
      to: guest.email!,
      kind: "INFO",
      guestId: guest.id,
    });

    if (result.ok) sent++;
    else firstError ??= result.error;
  }

  revalidatePath("/admin/emails");

  if (sent === 0) return fail(firstError ?? "Aucun email n'a pu être envoyé.");

  return {
    ok: true,
    message: `Message envoyé à ${sent} invité(s)${
      firstError ? ` — ${recipients.length - sent} en échec : ${firstError}` : ""
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
  input: Partial<Settings>,
): Promise<ActionResult> {
  await requireAdmin();

  const values: Partial<Record<SettingKey, string>> = {};
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    const value = input[key];
    if (typeof value === "string") values[key] = value.trim();
  }

  await saveSettings(values);

  revalidatePath("/admin/reglages");
  revalidatePath("/", "layout");
  return { ok: true, message: "Réglages enregistrés." };
}

/** Convertit une adresse en coordonnées, pour remplir le champ de la carte. */
export async function geocodeSetting(address: string): Promise<ActionResult> {
  await requireAdmin();

  const result = await geocodeAddress(address);
  if (!result.ok) return fail(result.error);

  return { ok: true, coords: result.coords, message: result.label };
}

// --------------------------------------------------------------------------
// Session
// --------------------------------------------------------------------------

export async function logout(): Promise<void> {
  const { destroySession } = await import("@/lib/auth");
  await destroySession();
  redirect("/admin/login");
}
