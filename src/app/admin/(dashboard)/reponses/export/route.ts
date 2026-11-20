import { isAuthenticated } from "@/lib/auth";
import {
  GUEST_TYPE_LABELS,
  LODGING_LABELS,
  type GuestType,
  type Lodging,
} from "@/lib/constants";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const HEADERS = [
  "Invitation",
  "Prénom",
  "Nom",
  "Accompagnant",
  "Enfant",
  "Formule",
  "Mairie",
  "Logement",
  "Allergies / régime",
  "Musique",
  "Email",
  "Téléphone",
];

/** Échappement CSV : guillemets doublés, champ entre guillemets si besoin. */
function cell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Une ligne par personne présente, accompagnants compris : de quoi préparer
 * le traiteur ou le plan de table dans un tableur. Séparateur `;` et BOM UTF-8
 * pour qu'Excel en français l'ouvre correctement.
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    where: { attending: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: { companions: { orderBy: { createdAt: "asc" } } },
  });

  const rows = guests.flatMap((guest) => {
    const invitation = `${guest.firstName} ${guest.lastName}`;
    const shared = [
      GUEST_TYPE_LABELS[guest.type as GuestType] ?? guest.type,
      guest.attendingMairie ? "Oui" : "Non",
      guest.type === "FULL"
        ? (LODGING_LABELS[guest.lodging as Lodging] ?? "Non précisé")
        : "",
    ];

    return [
      [
        invitation,
        guest.firstName,
        guest.lastName,
        "Non",
        "Non",
        ...shared,
        guest.dietary ?? "",
        guest.songRequest ?? "",
        guest.email ?? "",
        guest.phone ?? "",
      ],
      ...guest.companions.map((companion) => [
        invitation,
        companion.firstName,
        companion.lastName ?? "",
        "Oui",
        companion.isChild ? "Oui" : "Non",
        ...shared,
        companion.dietary ?? "",
        "",
        "",
        "",
      ]),
    ];
  });

  const csv =
    "﻿" +
    [HEADERS, ...rows].map((row) => row.map(cell).join(";")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="invites-presents.csv"',
      "Cache-Control": "no-store",
    },
  });
}
