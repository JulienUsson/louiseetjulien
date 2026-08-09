/**
 * Helpers de code sans dépendance Node : ce module est importé aussi bien
 * côté serveur que dans les composants client.
 */

/** Normalise une saisie manuelle (minuscules, espaces, tirets). */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
