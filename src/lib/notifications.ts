import "server-only";

import { appUrl } from "@/lib/codes";
import {
  GUEST_TYPE_LABELS,
  LODGING_LABELS,
  type GuestType,
  type Lodging,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { responseNotificationEmail } from "@/lib/email-templates";
import { isMailConfigured, sendMail } from "@/lib/mail";
import { getSettings } from "@/lib/settings";

/**
 * Prévient les mariés qu'un invité vient de répondre, avec le détail de sa
 * réponse. Sans adresse ni SMTP configurés, on ne fait rien plutôt que de
 * remplir le journal des envois d'échecs.
 */
export async function notifyResponse(
  guestId: string,
  firstAnswer: boolean,
): Promise<void> {
  if (!isMailConfigured()) return;

  const settings = await getSettings();
  const to = settings.notificationEmail || settings.contactEmail;
  if (!to) return;

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    include: { companions: { orderBy: { createdAt: "asc" } } },
  });
  if (!guest || guest.attending === null) return;

  const details: [string, string][] = [
    [
      "Formule",
      GUEST_TYPE_LABELS[guest.type as GuestType] ?? guest.type,
    ],
  ];

  if (guest.attending) {
    const people = [
      guest.firstName,
      ...guest.companions.map(
        (companion) =>
          `${companion.firstName}${companion.isChild ? " (enfant)" : ""}`,
      ),
    ];
    details.push(["Personnes", `${people.length} — ${people.join(", ")}`]);
    details.push(["Mairie", guest.attendingMairie ? "Oui" : "Non"]);

    if (guest.type === "FULL") {
      details.push([
        "Logement",
        LODGING_LABELS[guest.lodging as Lodging] ?? "Non précisé",
      ]);
    }

    const diets = [
      guest.dietary && `${guest.firstName} : ${guest.dietary}`,
      ...guest.companions.map(
        (companion) =>
          companion.dietary && `${companion.firstName} : ${companion.dietary}`,
      ),
    ].filter(Boolean);
    if (diets.length > 0) details.push(["Régimes", diets.join("\n")]);

    if (guest.songRequest) details.push(["Musique", guest.songRequest]);
  }

  if (guest.message) details.push(["Message", guest.message]);
  if (guest.email) details.push(["Email", guest.email]);
  if (guest.phone) details.push(["Téléphone", guest.phone]);

  const email = responseNotificationEmail({
    coupleNames: settings.coupleNames,
    guestName: `${guest.firstName} ${guest.lastName}`,
    firstAnswer,
    attending: guest.attending,
    details,
    url: appUrl(`/admin/invites/${guest.id}`),
  });

  await sendMail({ ...email, to, kind: "NOTIFICATION", guestId: guest.id });
}
