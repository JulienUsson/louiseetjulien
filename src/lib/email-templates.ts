import "server-only";

const ROSE = "#e11d48";
const ORANGE = "#f97316";
const INK = "#3f3034";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Convertit le texte saisi au back-office en paragraphes HTML. */
function toParagraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;line-height:1.6;color:${INK};font-size:15px;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

/**
 * Gabarit commun : styles en ligne uniquement, tables pour la mise en page —
 * les clients mail (Outlook en tête) ignorent flexbox et les feuilles externes.
 */
function layout({
  coupleNames,
  title,
  content,
}: {
  coupleNames: string;
  title: string;
  content: string;
}): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#fdf6f2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f2;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #f6dfd4;">
            <tr>
              <td style="height:6px;background:linear-gradient(90deg,${ROSE},${ORANGE});"></td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;text-align:center;">
                <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${ORANGE};">
                  ${escapeHtml(coupleNames)}
                </div>
                <h1 style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:24px;color:${INK};">
                  ${escapeHtml(title)}
                </h1>
                <div style="width:56px;height:1px;background:#f3c9b8;margin:20px auto 0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;text-align:center;font-size:12px;color:#a08d86;">
                Avec toute notre affection,<br />${escapeHtml(coupleNames)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px auto 20px;">
  <tr>
    <td style="border-radius:999px;background:${ROSE};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

export type RenderedEmail = { subject: string; text: string; html: string };

export function invitationEmail(params: {
  coupleNames: string;
  firstName: string;
  url: string;
  weddingDateLabel: string;
}): RenderedEmail {
  const { coupleNames, firstName, url, weddingDateLabel } = params;
  const dateLine = weddingDateLabel ? ` le ${weddingDateLabel}` : "";

  const text = [
    `Bonjour ${firstName},`,
    "",
    `Nous nous marions${dateLine} et nous serions très heureux de t'avoir avec nous.`,
    "",
    "Voici ton lien personnel. Tu y retrouveras toutes les informations pratiques et tu pourras nous confirmer ta présence :",
    url,
    "",
    "Ce lien n'est qu'à toi : merci de ne pas le transmettre.",
    "",
    `À très vite,`,
    coupleNames,
  ].join("\n");

  const html = layout({
    coupleNames,
    title: "Tu es invité·e !",
    content: `
      <p style="margin:0 0 16px;line-height:1.6;color:${INK};font-size:15px;">Bonjour ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 16px;line-height:1.6;color:${INK};font-size:15px;">
        Nous nous marions${escapeHtml(dateLine)} et nous serions très heureux de t'avoir avec nous.
      </p>
      <p style="margin:0 0 20px;line-height:1.6;color:${INK};font-size:15px;">
        Voici ton lien personnel : tu y retrouveras toutes les informations pratiques et tu pourras nous confirmer ta présence.
      </p>
      ${button(url, "Voir mon invitation")}
      <p style="margin:0;line-height:1.6;color:#a08d86;font-size:12px;text-align:center;">
        Si le bouton ne fonctionne pas, copie ce lien :<br />
        <a href="${escapeHtml(url)}" style="color:${ROSE};word-break:break-all;">${escapeHtml(url)}</a>
      </p>
      <p style="margin:16px 0 0;line-height:1.6;color:#a08d86;font-size:12px;text-align:center;">
        Ce lien n'est qu'à toi, merci de ne pas le transmettre.
      </p>`,
  });

  return { subject: `${coupleNames} — tu es invité·e !`, text, html };
}

export function infoEmail(params: {
  coupleNames: string;
  firstName: string;
  title: string;
  body: string;
  url: string;
}): RenderedEmail {
  const { coupleNames, firstName, title, body, url } = params;

  const text = [
    `Bonjour ${firstName},`,
    "",
    body,
    "",
    `Tu retrouves toutes les informations sur ta page personnelle : ${url}`,
    "",
    coupleNames,
  ].join("\n");

  const html = layout({
    coupleNames,
    title,
    content: `
      <p style="margin:0 0 16px;line-height:1.6;color:${INK};font-size:15px;">Bonjour ${escapeHtml(firstName)},</p>
      ${toParagraphs(body)}
      ${button(url, "Voir ma page")}`,
  });

  return { subject: `${coupleNames} — ${title}`, text, html };
}

/** Message libre écrit depuis /admin/emails, avec son propre objet. */
export function customEmail(params: {
  coupleNames: string;
  firstName: string;
  subject: string;
  body: string;
  url: string;
}): RenderedEmail {
  const { coupleNames, firstName, subject, body, url } = params;

  const text = [
    `Bonjour ${firstName},`,
    "",
    body,
    "",
    `Ta page personnelle : ${url}`,
    "",
    coupleNames,
  ].join("\n");

  const html = layout({
    coupleNames,
    title: subject,
    content: `
      <p style="margin:0 0 16px;line-height:1.6;color:${INK};font-size:15px;">Bonjour ${escapeHtml(firstName)},</p>
      ${toParagraphs(body)}
      ${button(url, "Voir ma page")}`,
  });

  return { subject, text, html };
}

export function testEmail(coupleNames: string): RenderedEmail {
  const text =
    "Cet email confirme que la configuration SMTP du site de mariage fonctionne.";

  return {
    subject: `${coupleNames} — email de test`,
    text,
    html: layout({
      coupleNames,
      title: "Email de test",
      content: `<p style="margin:0;line-height:1.6;color:${INK};font-size:15px;">${text}</p>`,
    }),
  };
}
