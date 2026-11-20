import Link from "next/link";
import {
  BedDouble,
  Download,
  Landmark,
  MessageCircleHeart,
  Music,
  Utensils,
} from "lucide-react";

import { RsvpBadge } from "@/components/admin/rsvp-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GUEST_TYPE_LABELS,
  GUEST_TYPES,
  LODGING_LABELS,
  LODGINGS,
  type GuestType,
  type Lodging,
} from "@/lib/constants";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Party = {
  id: string;
  firstName: string;
  lastName: string;
  companions: { firstName: string; lastName: string | null; isChild: boolean }[];
};

const people = (party: Party) => 1 + party.companions.length;
const children = (parties: Party[]) =>
  parties.reduce(
    (sum, party) => sum + party.companions.filter((c) => c.isChild).length,
    0,
  );
const headcount = (parties: Party[]) =>
  parties.reduce((sum, party) => sum + people(party), 0);

const SECTIONS = [
  { id: "repas", label: "Repas" },
  { id: "mairie", label: "Mairie" },
  { id: "logement", label: "Logement" },
  { id: "musiques", label: "Musiques" },
  { id: "mots", label: "Petits mots" },
];

const messageDateFormat = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Paris",
});

export default async function ResponsesPage() {
  const [present, messages] = await Promise.all([
    prisma.guest.findMany({
      where: { attending: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        type: true,
        attendingMairie: true,
        lodging: true,
        dietary: true,
        songRequest: true,
        respondedAt: true,
        companions: {
          orderBy: { createdAt: "asc" },
          select: {
            firstName: true,
            lastName: true,
            isChild: true,
            dietary: true,
          },
        },
      },
    }),
    prisma.guest.findMany({
      where: { message: { not: null } },
      orderBy: { respondedAt: { sort: "desc", nulls: "last" } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        attending: true,
        message: true,
        respondedAt: true,
      },
    }),
  ]);

  const byType = GUEST_TYPES.map((type) => {
    const parties = present.filter((guest) => guest.type === type);
    return {
      type,
      total: headcount(parties),
      children: children(parties),
    };
  });

  const diets = present.flatMap((guest) => [
    ...(guest.dietary
      ? [{ name: `${guest.firstName} ${guest.lastName}`, isChild: false, guest, dietary: guest.dietary }]
      : []),
    ...guest.companions.flatMap((companion) =>
      companion.dietary
        ? [
            {
              name: `${companion.firstName} ${companion.lastName ?? ""}`.trim(),
              isChild: companion.isChild,
              guest,
              dietary: companion.dietary,
            },
          ]
        : [],
    ),
  ]);

  const mairie = present.filter((guest) => guest.attendingMairie);

  const lodgers = present.filter((guest) => guest.type === "FULL");
  const lodgingGroups = [
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

  const songs = present
    .filter((guest) => guest.songRequest)
    .sort(
      (a, b) =>
        (b.respondedAt?.getTime() ?? 0) - (a.respondedAt?.getTime() ?? 0),
    );

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div>
          <h1 className="font-serif text-3xl">Réponses</h1>
          <p className="text-muted-foreground mt-1">
            Le récapitulatif des invités présents, accompagnants compris.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <Button key={section.id} asChild variant="outline" size="sm">
              <a href={`#${section.id}`}>{section.label}</a>
            </Button>
          ))}
        </nav>
      </div>

      <Section
        id="repas"
        icon={<Utensils className="size-5 text-orange-500" />}
        title="Repas"
        description="Pour le traiteur : effectifs, enfants et régimes alimentaires."
        action={
          <Button asChild size="sm" variant="outline">
            <a href="/admin/reponses/export">
              <Download className="size-4" />
              Exporter (CSV)
            </a>
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {byType.map(({ type, total, children }) => (
            <Card key={type}>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">
                  {GUEST_TYPE_LABELS[type]}
                </div>
                <div className="mt-1 text-2xl font-semibold">{total}</div>
                <div className="text-xs text-muted-foreground">
                  dont {children} enfant(s)
                </div>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="mt-1 text-2xl font-semibold">
                {headcount(present)}
              </div>
              <div className="text-xs text-muted-foreground">
                dont {children(present)} enfant(s)
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Allergies et régimes ({diets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {diets.length === 0 ? (
              <Empty>Rien de signalé pour l&apos;instant.</Empty>
            ) : (
              <ul className="divide-y text-sm">
                {diets.map((diet, index) => (
                  <li key={index} className="py-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <span className="font-medium">
                        {diet.name}
                        {diet.isChild && (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            (enfant)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {GUEST_TYPE_LABELS[diet.guest.type as GuestType] ??
                          diet.guest.type}
                      </span>
                    </div>
                    <div>{diet.dietary}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Section>

      <Section
        id="mairie"
        icon={<Landmark className="size-5 text-orange-500" />}
        title={`Mairie — ${headcount(mairie)} personne(s)`}
        description={`Dont ${children(mairie)} enfant(s). Les accompagnants suivent leur hôte.`}
      >
        <Card>
          <CardContent className="pt-6">
            <PartyList parties={mairie} empty="Personne pour l'instant." />
          </CardContent>
        </Card>
      </Section>

      <Section
        id="logement"
        icon={<BedDouble className="size-5 text-orange-500" />}
        title="Logement"
        description="Invités présents à la journée complète."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {lodgingGroups.map(({ key, label, parties }) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="text-base">{label}</CardTitle>
                <CardDescription>
                  {headcount(parties)} personne(s)
                  {children(parties) > 0 &&
                    `, dont ${children(parties)} enfant(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PartyList parties={parties} empty="Personne." />
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        id="musiques"
        icon={<Music className="size-5 text-orange-500" />}
        title={`Musiques demandées (${songs.length})`}
        description="Les plus récentes en premier, pour la playlist de la soirée."
      >
        <Card>
          <CardContent className="pt-6">
            {songs.length === 0 ? (
              <Empty>Aucune musique demandée pour l&apos;instant.</Empty>
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
      </Section>

      <Section
        id="mots"
        icon={<MessageCircleHeart className="size-5 text-orange-500" />}
        title={`Petits mots (${messages.length})`}
        description="Ce que les invités vous ont écrit en répondant, présents ou non."
      >
        <Card>
          <CardContent className="pt-6">
            {messages.length === 0 ? (
              <Empty>Pas encore de message.</Empty>
            ) : (
              <ul className="divide-y text-sm">
                {messages.map((guest) => (
                  <li key={guest.id} className="space-y-1 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <GuestLink
                        party={guest}
                        className="font-medium hover:underline"
                      />
                      <RsvpBadge attending={guest.attending} />
                      {guest.respondedAt && (
                        <span className="text-xs text-muted-foreground">
                          {messageDateFormat.format(guest.respondedAt)}
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-line text-muted-foreground">
                      {guest.message}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}

function Section({
  id,
  icon,
  title,
  description,
  action,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-2xl">
            {icon}
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function PartyList({ parties, empty }: { parties: Party[]; empty: string }) {
  if (parties.length === 0) return <Empty>{empty}</Empty>;

  return (
    <ul className="divide-y text-sm">
      {parties.map((party) => (
        <li key={party.id} className="py-2">
          <div className="flex items-baseline justify-between gap-4">
            <GuestLink party={party} className="font-medium hover:underline" />
            <span className="text-muted-foreground">{people(party)}</span>
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
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
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
