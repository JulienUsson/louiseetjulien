import { SETTING_DEFAULTS, type Settings } from "@/lib/settings-fields";
import {
  guestTemplateValues,
  renderTemplate,
  type TemplateGuest,
} from "@/lib/templates";

/**
 * Message en texte brut, à coller dans un SMS ou une messagerie : l'invitation,
 * ou la relance de ceux qui n'ont pas encore répondu.
 *
 * C'est la seule façon d'atteindre les invités dont on ne connaît pas encore
 * l'email — et ils sont majoritaires au départ, puisque ce sont eux qui le
 * renseignent depuis leur lien.
 */
export function guestMessage(
  settings: Settings,
  key: "invitationMessage" | "reminderMessage",
  guest: TemplateGuest,
  url: string,
): string {
  const { values, plural } = guestTemplateValues(settings, guest, url);
  return renderTemplate(settings[key] || SETTING_DEFAULTS[key], values, plural);
}
