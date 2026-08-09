/**
 * Définition des réglages de l'évènement, sans dépendance serveur : ce module
 * est importé par le formulaire client comme par les pages serveur.
 */

export const SETTING_DEFAULTS = {
  coupleNames: "Louise & Julien",
  weddingDate: "2027-07-10",
  ceremonyTime: "",
  ceremonyPlace: "",
  ceremonyAddress: "",
  cocktailTime: "",
  receptionPlace: "",
  receptionAddress: "",
  rsvpDeadline: "",
  contactEmail: "",
  contactPhone: "",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export const SETTING_FIELDS: {
  key: SettingKey;
  label: string;
  help?: string;
  type?: "text" | "date" | "email";
}[] = [
  { key: "coupleNames", label: "Nom du couple", help: "Ex. Louise & Julien" },
  { key: "weddingDate", label: "Date du mariage", type: "date" },
  { key: "ceremonyTime", label: "Heure de la cérémonie", help: "Ex. 15h00" },
  { key: "ceremonyPlace", label: "Lieu de la cérémonie" },
  { key: "ceremonyAddress", label: "Adresse de la cérémonie" },
  {
    key: "cocktailTime",
    label: "Heure du vin d'honneur",
    help: "Affichée aux invités « vin d'honneur »",
  },
  { key: "receptionPlace", label: "Lieu de la réception" },
  { key: "receptionAddress", label: "Adresse de la réception" },
  {
    key: "rsvpDeadline",
    label: "Date limite de réponse",
    type: "date",
    help: "Rappelée sur la page de chaque invité",
  },
  { key: "contactEmail", label: "Email de contact", type: "email" },
  { key: "contactPhone", label: "Téléphone de contact" },
];

/** Formate une date ISO (YYYY-MM-DD) en français, ou "" si vide/invalide. */
export function formatDate(iso: string, withWeekday = true): string {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("fr-FR", {
    weekday: withWeekday ? "long" : undefined,
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
