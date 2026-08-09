import { notFound } from "next/navigation";
import { CalendarHeart, Clock, Info, MapPin, PartyPopper } from "lucide-react";

import { RsvpForm } from "@/components/rsvp-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { normalizeCode } from "@/lib/code-format";
import {
  GUEST_TYPE_DESCRIPTIONS,
  GUEST_TYPE_LABELS,
  type GuestType,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { formatDate, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function GuestPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = normalizeCode(rawCode);

  const guest = await prisma.guest.findUnique({
    where: { code },
    include: { companions: { orderBy: { createdAt: "asc" } } },
  });

  if (!guest) notFound();

  const settings = await getSettings();
  const guestType = (
    guest.type === "COCKTAIL" ? "COCKTAIL" : "FULL"
  ) satisfies GuestType;

  const infos = await prisma.infoPost.findMany({
    where: {
      published: true,
      OR: [{ audience: "ALL" }, { audience: guestType }],
    },
    orderBy: [{ pinned: "desc" }, { position: "asc" }, { createdAt: "asc" }],
  });

  const dateLabel = formatDate(settings.weddingDate);
  const deadlineLabel = formatDate(settings.rsvpDeadline, false);

  return (
    <main className="bg-wedding min-h-screen">
      <div className="mx-auto w-full max-w-2xl px-4 py-12 space-y-8">
        <header className="text-center font-serif">
          <p className="text-orange-500 text-xs tracking-[0.3em] uppercase">
            {dateLabel || "Save the date"}
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-light text-foreground">
            {settings.coupleNames}
          </h1>
          <div className="w-16 h-px bg-orange-300 mx-auto my-6" />
          <p className="font-sans text-muted-foreground">
            Bonjour {guest.firstName}, nous serions très heureux de vous compter
            parmi nous.
          </p>
          <div className="mt-4 flex justify-center">
            <Badge variant="secondary" className="gap-1.5">
              <PartyPopper className="size-3.5" />
              {GUEST_TYPE_LABELS[guestType]}
            </Badge>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Le jour J</CardTitle>
            <CardDescription>
              {GUEST_TYPE_DESCRIPTIONS[guestType]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dateLabel && (
              <DetailRow icon={<CalendarHeart className="size-4" />} label="Date">
                {dateLabel}
              </DetailRow>
            )}

            {settings.ceremonyPlace && (
              <DetailRow icon={<MapPin className="size-4" />} label="Cérémonie">
                {settings.ceremonyTime && `${settings.ceremonyTime} — `}
                {settings.ceremonyPlace}
                {settings.ceremonyAddress && (
                  <span className="block text-muted-foreground">
                    {settings.ceremonyAddress}
                  </span>
                )}
              </DetailRow>
            )}

            {settings.receptionPlace && (
              <DetailRow
                icon={<MapPin className="size-4" />}
                label={
                  guestType === "COCKTAIL" ? "Vin d'honneur" : "Réception"
                }
              >
                {guestType === "COCKTAIL" && settings.cocktailTime
                  ? `${settings.cocktailTime} — `
                  : null}
                {settings.receptionPlace}
                {settings.receptionAddress && (
                  <span className="block text-muted-foreground">
                    {settings.receptionAddress}
                  </span>
                )}
              </DetailRow>
            )}

            {deadlineLabel && (
              <DetailRow
                icon={<Clock className="size-4" />}
                label="Réponse souhaitée avant le"
              >
                {deadlineLabel}
              </DetailRow>
            )}
          </CardContent>
        </Card>

        {infos.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-center">
              Les informations pratiques
            </h2>
            {infos.map((info) => (
              <Card key={info.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="size-4 text-orange-500" />
                    {info.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {info.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </section>
        )}

        <Card id="rsvp">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Votre réponse</CardTitle>
            <CardDescription>
              {guest.respondedAt
                ? "Vous avez déjà répondu — vous pouvez modifier votre réponse à tout moment."
                : "Merci de nous confirmer votre présence, et de renseigner votre email pour recevoir les informations."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RsvpForm
              code={guest.code}
              maxCompanions={guest.maxCompanions}
              defaultValues={{
                email: guest.email ?? "",
                phone: guest.phone ?? "",
                attending: guest.attending,
                dietary: guest.dietary ?? "",
                message: guest.message ?? "",
                companions: guest.companions.map((companion) => ({
                  firstName: companion.firstName,
                  lastName: companion.lastName ?? "",
                  isChild: companion.isChild,
                  dietary: companion.dietary ?? "",
                })),
              }}
            />
          </CardContent>
        </Card>

        {settings.contactEmail && (
          <p className="text-center text-sm text-muted-foreground">
            Une question ? Écrivez-nous à{" "}
            <a
              className="text-rose-600 underline underline-offset-4"
              href={`mailto:${settings.contactEmail}`}
            >
              {settings.contactEmail}
            </a>
            {settings.contactPhone && ` ou au ${settings.contactPhone}`}.
          </p>
        )}
      </div>
    </main>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-orange-500">{icon}</div>
      <div className="text-sm">
        <div className="font-medium">{label}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}
