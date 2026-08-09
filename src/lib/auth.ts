import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "lj_admin";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

/**
 * Un secret volatile ferait sauter les sessions à chaque redémarrage, mais il
 * vaut mieux ça qu'un secret par défaut connu de tous en production.
 */
let fallbackSecret: string | undefined;

function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET doit être défini (32 caractères aléatoires minimum) en production.",
    );
  }
  fallbackSecret ??= randomBytes(32).toString("hex");
  return fallbackSecret;
}

function adminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD n'est pas défini : le back-office est inaccessible.",
    );
  }
  return password;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

/** Comparaison à temps constant, tolérante aux longueurs différentes. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(sign(a));
  const bufB = Buffer.from(sign(b));
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate: string): boolean {
  return safeEqual(candidate, adminPassword());
}

function createToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const separator = token.lastIndexOf(".");
  if (separator === -1) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, sign(expiresAt))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now();
}

export async function createSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

/**
 * À appeler en tête de chaque page et de chaque server action du back-office :
 * un layout protégé ne protège pas les actions qu'il rend.
 */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}
