import Link from "next/link";
import { BedDouble, Music } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LODGING_LABELS, LODGINGS, type Lodging } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Party = {
  id: string;
  firstName: string;
  lastName: string;
  companions: { firstName: string; lastName: string | null; isChild: boolean }[];
};

const people = (party: Party) => 1 + party.companions.length;

export default async function ResponsesPage() {
  const [songs, lodgers] = await Promise.all([
    prisma.guest.findMany({
      where: { attending: true, songRequest: { not: null } },
      orderBy: { respondedAt: "desc" },
      select: { id: true, firstName: true, lastName: true, songRequest: true },
    }),
    prisma.guest.findMany({
      where: { attending: true, type: "FULL" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        lodging: true,
        companions: {
          orderBy: { createdAt: "asc" },
          select: { firstName: true, lastName: true, isChild: true },
        },
      },
    }),
  ]);

  const groups = [
    ...LODGINGS.map((lodging) => ({
      key: lodging,
      label: LODGING_LABELS[lodging],
      parties: lodgers.filter((guest) => guest.lodging === lodging),
    })),
    {
      key: "unknown",
      label: "Non précisé",
      parties: lodgers.filter(
        (guest) => !LODGINGS.includes(guest.lodging as Lodging),
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Réponses</h1>
        <p className="text-muted-foreground mt-1">
          Le récapitulatif des invités présents : musiques demandées et
          logement.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Music className="size-4 text-orange-500" />
            Musiques demandées ({songs.length})
          </CardTitle>
          <CardDescription>
            Les plus récentes en premier, pour la playlist de la soirée.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {songs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune musique demandée pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {songs.map((guest) => (
                <li
                  key={guest.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2"
                >
                  <span className="font-medium">{guest.songRequest}</span>
                  <GuestLink party={guest} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl">
            <BedDouble className="size-5 text-orange-500" />
            Logement
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Invités présents à la journée complète, accompagnants compris.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {groups.map(({ key, label, parties }) => {
            const total = parties.reduce(
              (sum, party) => sum + people(party),
              0,
            );
            const children = parties.reduce(
              (sum, party) =>
                sum + party.companions.filter((c) => c.isChild).length,
              0,
            );

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-base">{label}</CardTitle>
                  <CardDescription>
                    {total} personne(s)
                    {children > 0 && `, dont ${children} enfant(s)`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {parties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Personne.</p>
                  ) : (
                    <ul className="divide-y text-sm">
                      {parties.map((party) => (
                        <li key={party.id} className="py-2">
                          <div className="flex items-baseline justify-between gap-4">
                            <GuestLink
                              party={party}
                              className="font-medium hover:underline"
                            />
                            <span className="text-muted-foreground">
                              {people(party)}
                            </span>
                          </div>
                          {party.companions.length > 0 && (
                            <ul className="mt-0.5 text-xs text-muted-foreground">
                              {party.companions.map((companion, index) => (
                                <li key={index}>
                                  + {companion.firstName} {companion.lastName}
                                  {companion.isChild && " (enfant)"}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function GuestLink({
  party,
  className = "text-muted-foreground hover:text-foreground hover:underline",
}: {
  party: { id: string; firstName: string; lastName: string };
  className?: string;
}) {
  return (
    <Link href={`/admin/invites/${party.id}`} className={className}>
      {party.firstName} {party.lastName}
    </Link>
  );
}
