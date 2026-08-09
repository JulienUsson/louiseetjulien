/**
 * Message d'invitation en texte brut, à coller dans un SMS ou une messagerie.
 *
 * C'est la seule façon d'atteindre les invités dont on ne connaît pas encore
 * l'email — et ils sont majoritaires au départ, puisque ce sont eux qui le
 * renseignent depuis leur lien.
 */
export function invitationMessage(params: {
  coupleNames: string;
  firstName: string;
  url: string;
  weddingDateLabel?: string;
}): string {
  const { coupleNames, firstName, url, weddingDateLabel } = params;
  const dateLine = weddingDateLabel ? ` le ${weddingDateLabel}` : "";

  return [
    `Bonjour ${firstName} !`,
    "",
    `Nous nous marions${dateLine} et on serait vraiment heureux de t'avoir avec nous.`,
    "",
    "Voici ton lien personnel : tu y retrouveras toutes les infos pratiques et tu pourras nous confirmer ta présence.",
    url,
    "",
    "Ce lien n'est qu'à toi, merci de ne pas le transmettre.",
    "",
    coupleNames,
  ].join("\n");
}
