import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { prisma } from "@/lib/db";
import type { EmailKind } from "@/lib/constants";

export type SendResult = { ok: true } | { ok: false; error: string };

let cachedTransporter: Transporter | null = null;

/** L'envoi n'est actif que si un hôte SMTP est configuré. */
export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

export function mailFrom(): string {
  return (
    process.env.SMTP_FROM ?? "Louise & Julien <no-reply@louiseetjulien.local>"
  );
}

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 est le port TLS implicite ; les autres passent par STARTTLS.
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });

  return cachedTransporter;
}

type SendOptions = {
  to: string;
  subject: string;
  text: string;
  html: string;
  kind: EmailKind;
  guestId?: string | null;
  infoPostId?: string | null;
};

/**
 * Envoie un email et journalise systématiquement le résultat, succès comme
 * échec : la page /admin/emails sert d'accusé de réception.
 */
export async function sendMail(options: SendOptions): Promise<SendResult> {
  const { to, subject, text, html, kind, guestId, infoPostId } = options;

  let result: SendResult;

  try {
    if (!isMailConfigured()) {
      // Sans SMTP configuré, on n'échoue pas silencieusement : on trace.
      console.info(
        `[mail] SMTP non configuré — email non envoyé à ${to} (« ${subject} »)`,
      );
      result = {
        ok: false,
        error: "SMTP non configuré (SMTP_HOST manquant).",
      };
    } else {
      await getTransporter().sendMail({
        from: mailFrom(),
        to,
        subject,
        text,
        html,
      });
      result = { ok: true };
    }
  } catch (error) {
    result = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  await prisma.emailLog.create({
    data: {
      kind,
      to,
      subject,
      status: result.ok ? "SENT" : "FAILED",
      error: result.ok ? null : result.error,
      guestId: guestId ?? null,
      infoPostId: infoPostId ?? null,
    },
  });

  return result;
}

/** Vérifie la connexion SMTP sans envoyer de message. */
export async function verifyMailConnection(): Promise<SendResult> {
  if (!isMailConfigured()) {
    return { ok: false, error: "SMTP non configuré (SMTP_HOST manquant)." };
  }
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
