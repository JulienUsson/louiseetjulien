/**
 * Définition des réglages de l'évènement, sans dépendance serveur : ce module
 * est importé par le formulaire client comme par les pages serveur.
 *
 * La journée compte trois lieux : la mairie (civile, plus intime), la
 * cérémonie laïque, puis la réception. Il n'y a pas de cérémonie religieuse.
 */

export const SETTING_DEFAULTS = {
  coupleNames: "Louise & Julien",
  weddingDate: "2027-07-10",

  mairieTime: "",
  mairiePlace: "",
  mairieAddress: "",
  mairieCoords: "",

  ceremonyTime: "",
  ceremonyPlace: "",
  ceremonyAddress: "",
  ceremonyCoords: "",

  cocktailTime: "",
  receptionPlace: "",
  receptionAddress: "",
  receptionCoords: "",

  rsvpDeadline: "",
  contactEmail: "",
  contactPhone: "",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

/** Les trois lieux de la journée, décrits une seule fois. */
export const VENUES = [
  {
    id: "mairie",
    label: "Mairie",
    timeKey: "mairieTime",
    placeKey: "mairiePlace",
    addressKey: "mairieAddress",
    coordsKey: "mairieCoords",
  },
  {
    id: "ceremony",
    label: "Cérémonie laïque",
    timeKey: "ceremonyTime",
    placeKey: "ceremonyPlace",
    addressKey: "ceremonyAddress",
    coordsKey: "ceremonyCoords",
  },
  {
    id: "reception",
    label: "Réception",
    timeKey: "cocktailTime",
    placeKey: "receptionPlace",
    addressKey: "receptionAddress",
    coordsKey: "receptionCoords",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  timeKey: SettingKey;
  placeKey: SettingKey;
  addressKey: SettingKey;
  coordsKey: SettingKey;
}[];

export type Venue = (typeof VENUES)[number];

export type SettingField = {
  key: SettingKey;
  label: string;
  help?: string;
  type?: "text" | "date" | "email";
};

export type SettingGroup = {
  title: string;
  description?: string;
  /** Identifiant du lieu, pour proposer le géocodage dans le formulaire. */
  venueId?: Venue["id"];
  fields: SettingField[];
};

export const SETTING_GROUPS: SettingGroup[] = [
  {
    title: "L'évènement",
    fields: [
      { key: "coupleNames", label: "Nom du couple", help: "Ex. Louise & Julien" },
      { key: "weddingDate", label: "Date du mariage", type: "date" },
      {
        key: "rsvpDeadline",
        label: "Date limite de réponse",
        type: "date",
        help: "Rappelée sur la page de chaque invité",
      },
    ],
  },
  {
    title: "Mairie",
    description:
      "Le passage en mairie, auquel chaque invité indique s'il souhaite assister.",
    venueId: "mairie",
    fields: [
      { key: "mairieTime", label: "Heure", help: "Ex. 11h00" },
      { key: "mairiePlace", label: "Lieu", help: "Ex. Mairie du 6e" },
      { key: "mairieAddress", label: "Adresse" },
    ],
  },
  {
    title: "Cérémonie laïque",
    venueId: "ceremony",
    fields: [
      { key: "ceremonyTime", label: "Heure", help: "Ex. 15h00" },
      { key: "ceremonyPlace", label: "Lieu" },
      { key: "ceremonyAddress", label: "Adresse" },
    ],
  },
  {
    title: "Réception",
    description:
      "Le vin d'honneur, puis le dîner et la soirée pour les invités à la journée complète.",
    venueId: "reception",
    fields: [
      {
        key: "cocktailTime",
        label: "Heure du vin d'honneur",
        help: "Affichée à tous les invités",
      },
      { key: "receptionPlace", label: "Lieu" },
      { key: "receptionAddress", label: "Adresse" },
    ],
  },
  {
    title: "Nous contacter",
    description: "Affiché en bas de la page de chaque invité.",
    fields: [
      { key: "contactEmail", label: "Email de contact", type: "email" },
      { key: "contactPhone", label: "Téléphone de contact" },
    ],
  },
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

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "2027-07-10" → "10/07/2027", ou "" si vide/invalide. */
export function isoToFrenchDate(iso: string): string {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

/** "10/07/2027" → "2027-07-10", "" si vide, null si la date est invalide. */
export function frenchDateToIso(value: string): string | null {
  const text = value.trim();
  if (!text) return "";

  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Les coordonnées sont stockées en "lat,lon" : une seule case en base, et un
 * format directement recopiable depuis OpenStreetMap ou Google Maps.
 */
export function parseCoords(
  value: string,
): { lat: number; lon: number } | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  return { lat, lon };
}

/** URL de la carte OpenStreetMap intégrable en iframe, centrée sur le point. */
export function osmEmbedUrl(
  { lat, lon }: { lat: number; lon: number },
  span = 0.008,
): string {
  const bbox = [lon - span, lat - span / 2, lon + span, lat + span / 2]
    .map((value) => value.toFixed(6))
    .join(",");

  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/** Lien vers la carte plein écran, pour lancer un itinéraire. */
export function osmLinkUrl({ lat, lon }: { lat: number; lon: number }): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`;
}
