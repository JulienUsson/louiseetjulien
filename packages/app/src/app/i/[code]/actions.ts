"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { normalizeCode } from "@/lib/code-format";
import { prisma } from "@/lib/db";

const companionSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional().default(""),
  isChild: z.boolean().optional().default(false),
  dietary: z.string().trim().max(300).optional().default(""),
});

const rsvpSchema = z.object({
  code: z.string().min(1),
  email: z.string().trim().email("Adresse email invalide.").max(200),
  phone: z.string().trim().max(40).optional().default(""),
  attending: z.boolean(),
  dietary: z.string().trim().max(300).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
  companions: z.array(companionSchema).default([]),
});

export type RsvpInput = z.input<typeof rsvpSchema>;
export type RsvpState = { ok: boolean; error?: string };

/**
 * Enregistre la réponse d'un invité. Le code de l'URL fait office
 * d'autorisation : on le revalide ici, l'action étant appelable directement.
 */
export async function submitRsvp(input: RsvpInput): Promise<RsvpState> {
  const parsed = rsvpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Formulaire invalide.",
    };
  }

  const data = parsed.data;
  const code = normalizeCode(data.code);

  const guest = await prisma.guest.findUnique({ where: { code } });
  if (!guest) {
    return { ok: false, error: "Cette invitation n'existe pas ou plus." };
  }

  // On ne fait confiance qu'à la limite stockée en base, pas à celle du client.
  const companions = data.attending
    ? data.companions
        .filter((companion) => companion.firstName.length > 0)
        .slice(0, guest.maxCompanions)
    : [];

  await prisma.$transaction([
    prisma.companion.deleteMany({ where: { guestId: guest.id } }),
    prisma.guest.update({
      where: { id: guest.id },
      data: {
        email: data.email,
        phone: data.phone || null,
        attending: data.attending,
        respondedAt: new Date(),
        dietary: data.attending ? data.dietary || null : null,
        message: data.message || null,
        companions: {
          create: companions.map((companion) => ({
            firstName: companion.firstName,
            lastName: companion.lastName || null,
            isChild: companion.isChild,
            dietary: companion.dietary || null,
          })),
        },
      },
    }),
  ]);

  revalidatePath(`/i/${code}`);
  return { ok: true };
}
