/**
 * SQLite ne gère pas les enums Prisma : les valeurs « énumérées » sont
 * centralisées ici et validées par zod aux frontières (formulaires, actions).
 */

export const GUEST_TYPES = ["FULL", "COCKTAIL"] as const;
export type GuestType = (typeof GUEST_TYPES)[number];

export const GUEST_TYPE_LABELS: Record<GuestType, string> = {
  FULL: "Journée complète",
  COCKTAIL: "Vin d'honneur",
};

export const GUEST_TYPE_DESCRIPTIONS: Record<GuestType, string> = {
  FULL: "Cérémonie, vin d'honneur, dîner et soirée.",
  COCKTAIL: "Cérémonie et vin d'honneur.",
};

export const AUDIENCES = ["ALL", "FULL", "COCKTAIL"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const AUDIENCE_LABELS: Record<Audience, string> = {
  ALL: "Tous les invités",
  FULL: "Journée complète uniquement",
  COCKTAIL: "Vin d'honneur uniquement",
};

export const EMAIL_KINDS = ["INVITATION", "INFO", "TEST"] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

export const EMAIL_KIND_LABELS: Record<EmailKind, string> = {
  INVITATION: "Lien d'invitation",
  INFO: "Information",
  TEST: "Test",
};

/** Une info d'audience `audience` est-elle visible par un invité de type `type` ? */
export function audienceMatches(audience: string, type: string): boolean {
  return audience === "ALL" || audience === type;
}
