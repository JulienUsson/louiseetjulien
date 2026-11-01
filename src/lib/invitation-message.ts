import { SETTING_DEFAULTS } from "@/lib/settings-fields";
import { joinNames, renderTemplate } from "@/lib/templates";

/**
 * Message d'invitation en texte brut, à coller dans un SMS ou une messagerie.
 *
 * C'est la seule façon d'atteindre les invités dont on ne connaît pas encore
 * l'email — et ils sont majoritaires au départ, puisque ce sont eux qui le
 * renseignent depuis leur lien.
 */
export function invitationMessage(params: {
  template: string;
  coupleNames: string;
  names: string[];
  url: string;
  weddingDateLabel?: string;
}): string {
  const { template, coupleNames, names, url, weddingDateLabel } = params;

  return renderTemplate(
    template || SETTING_DEFAULTS.invitationMessage,
    {
      prenoms: joinNames(names),
      couple: coupleNames,
      date: weddingDateLabel ?? "",
      lien: url,
    },
    names.length > 1,
  );
}
