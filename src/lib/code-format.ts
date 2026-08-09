/**
 * Helpers de code sans dépendance Node : ce module est importé aussi bien
 * côté serveur que dans les composants client.
 */

/** Normalise une saisie manuelle (minuscules, espaces, tirets). */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Deux lieux désignent-ils le même endroit ? Comparaison tolérante aux
 * accents, à la casse et à la ponctuation, parce que « Parc de la Tête d'Or »
 * et « parc de la tete d or » sont saisis par la même personne un jour
 * différent.
 */
export function isSameVenue(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const left = normalize(a);
  const right = normalize(b);
  return left.length > 0 && left === right;
}
