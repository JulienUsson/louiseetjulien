import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(length = 10): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

/**
 * Jeu de données de démonstration : réglages, deux infos et quatre invités
 * couvrant les deux formules et les différents états de réponse.
 */
async function main() {
  const settings: Record<string, string> = {
    coupleNames: "Louise & Julien",
    weddingDate: "2027-07-10",

    mairieTime: "11h00",
    mairiePlace: "Mairie du 6e arrondissement",
    mairieAddress: "58 rue de Sèze, 69006 Lyon",
    mairieCoords: "45.76752,4.85174",

    ceremonyTime: "15h00",
    ceremonyPlace: "Parc de la Tête d'Or",
    ceremonyAddress: "Place Général Leclerc, 69006 Lyon",
    ceremonyCoords: "45.77405,4.85228",

    // Réception au même endroit que la cérémonie laïque : la page invité
    // fusionne alors les deux en un seul bloc, avec une seule carte.
    cocktailTime: "17h00",
    receptionPlace: "Parc de la Tête d'Or",
    receptionAddress: "Place Général Leclerc, 69006 Lyon",
    receptionCoords: "45.77405,4.85228",

    rsvpDeadline: "2027-04-30",
    contactEmail: "louise.et.julien@example.com",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }

  const infos = [
    {
      title: "Le programme de la journée",
      body: "11h00 — Passage en mairie, pour celles et ceux qui souhaitent en être.\n15h00 — Cérémonie laïque au parc de la Tête d'Or.\n17h00 — Vin d'honneur, sur place.\n20h00 — Dîner puis soirée dansante, toujours sur place.\n\nUn fléchage sera installé depuis l'entrée du parc.",
      audience: "ALL",
      published: true,
      pinned: true,
      position: 0,
    },
    {
      title: "Où dormir ?",
      body: "Nous avons pré-réservé une dizaine de chambres à l'Hôtel du Parc, à 10 minutes à pied.\n\nMentionne « mariage Louise & Julien » en réservant pour bénéficier du tarif négocié, avant le 1er juin.",
      audience: "FULL",
      published: true,
      pinned: false,
      position: 1,
    },
  ];

  for (const info of infos) {
    const existing = await prisma.infoPost.findFirst({
      where: { title: info.title },
    });
    if (existing) continue;

    await prisma.infoPost.create({
      data: { ...info, publishedAt: info.published ? new Date() : null },
    });
  }

  const guests = [
    {
      firstName: "Camille",
      lastName: "Bernard",
      type: "FULL",
      maxCompanions: 2,
      email: "camille.bernard@example.com",
      attending: true,
      dietary: "Végétarienne",
    },
    {
      firstName: "Antoine",
      lastName: "Lefèvre",
      type: "FULL",
      maxCompanions: 1,
      email: null,
      attending: null,
    },
    {
      firstName: "Sophie",
      lastName: "Marchand",
      type: "COCKTAIL",
      maxCompanions: 1,
      email: "sophie.marchand@example.com",
      attending: false,
    },
    {
      firstName: "Paul",
      lastName: "Nguyen",
      type: "COCKTAIL",
      maxCompanions: 0,
      email: null,
      attending: null,
    },
  ];

  for (const guest of guests) {
    const existing = await prisma.guest.findFirst({
      where: { firstName: guest.firstName, lastName: guest.lastName },
    });
    if (existing) continue;

    const created = await prisma.guest.create({
      data: {
        ...guest,
        code: generateCode(),
        respondedAt: guest.attending === null ? null : new Date(),
      },
    });
    console.log(
      `Invité créé : ${created.firstName} ${created.lastName} → /i/${created.code}`,
    );
  }
}

main()
  .then(() => console.log("Seed terminé."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
