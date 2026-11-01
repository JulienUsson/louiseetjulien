/**
 * Gabarits de texte éditables depuis les réglages, sans dépendance serveur :
 * le formulaire des réglages s'en sert aussi pour l'aperçu.
 *
 * - `{prenoms}`, `{couple}`, `{date}`, `{lien}` sont remplacés par leur valeur ;
 * - `{singulier|pluriel}` choisit selon que l'invitation concerne une seule
 *   personne ou l'invité et ses accompagnants déjà connus.
 */

export type TemplateValues = {
  prenoms: string;
  couple: string;
  date: string;
  lien: string;
};

export const TEMPLATE_VARIABLES = ["prenoms", "couple", "date", "lien"] as const;

export function renderTemplate(
  template: string,
  values: TemplateValues,
  plural: boolean,
): string {
  return template
    .replace(/\{([^{}|]*)\|([^{}]*)\}/g, (_, singular: string, many: string) =>
      plural ? many : singular,
    )
    .replace(/\{(prenoms|couple|date|lien)\}/g, (_, key: keyof TemplateValues) =>
      values[key],
    );
}

/** « Antoine », « Antoine et Claire », « Antoine, Claire et Léo ». */
export function joinNames(names: string[]): string {
  const list = names.map((name) => name.trim()).filter(Boolean);
  if (list.length <= 1) return list[0] ?? "";
  return `${list.slice(0, -1).join(", ")} et ${list[list.length - 1]}`;
}
