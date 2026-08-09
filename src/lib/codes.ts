import "server-only";

import { randomInt } from "node:crypto";

export { normalizeCode } from "@/lib/code-format";

/**
 * Alphabet sans caractères ambigus (0/O, 1/I/L) : les codes sont recopiés à la
 * main quand un invité reçoit son lien par SMS ou sur un carton papier.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;

export function generateCode(length = CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

/** URL absolue de la page d'un invité, à envoyer par mail ou par SMS. */
export function guestUrl(code: string, baseUrl = process.env.APP_URL): string {
  const base = (baseUrl ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}/i/${code}`;
}
