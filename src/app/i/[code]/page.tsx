import { notFound } from "next/navigation";
import { CalendarHeart, Clock, Info } from "lucide-react";

import { RsvpForm } from "@/components/rsvp-form";
import { VenueBlock } from "@/components/venue-map";
import { WelcomeConfetti } from "@/components/welcome-confetti";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { normalizeCode } from "@/lib/code-format";
import { type GuestType } from "@/lib/constants";
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
  const isCocktail = guestType === "COCKTAIL";

  const infos = await prisma.infoPost.findMany({
    where: {
      published: true,
      OR: [{ audience: "ALL" }, { audience: guestType }],
    },
    orderBy: [{ pinned: "desc" }, { position: "asc" }, { createdAt: "asc" }],
  });

  const dateLabel = formatDate(settings.weddingDate);
  const deadlineLabel = formatDate(settings.rsvpDeadline, false);
  const hasMairie = Boolean(settings.mairiePlace || settings.mairieAddress);

  return (
    <main className="bg-wedding min-h-screen">
      <WelcomeConfetti />

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
            Bonjour {guest.firstName}, on serait vraiment heureux de t&apos;avoir
            avec nous.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Le jour J</CardTitle>
            <CardDescription>
              {isCocktail
                ? "Tu es convié·e au vin d'honneur, juste après la cérémonie laïque."
                : "Cérémonie laïque, vin d'honneur, dîner et soirée : on t'attend pour toute la journée."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dateLabel && (
              <div className="flex gap-3 text-sm">
                <CalendarHeart className="mt-0.5 size-4 shrink-0 text-orange-500" />
                <div>
                  <div className="font-medium">Date</div>
                  <div>{dateLabel}</div>
                </div>
              </div>
            )}

            {hasMairie && (
              <VenueBlock
                label="Mairie"
                time={settings.mairieTime}
                place={settings.mairiePlace}
                address={settings.mairieAddress}
                coords={settings.mairieCoords}
                note="Un moment plus intime — dis-nous plus bas si tu veux en être."
              />
            )}

            <VenueBlock
              label="Cérémonie laïque"
              time={settings.ceremonyTime}
              place={settings.ceremonyPlace}
              address={settings.ceremonyAddress}
              coords={settings.ceremonyCoords}
            />

            <VenueBlock
              label={isCocktail ? "Vin d'honneur" : "Réception"}
              time={settings.cocktailTime}
              place={settings.receptionPlace}
              address={settings.receptionAddress}
              coords={settings.receptionCoords}
              note={
                isCocktail
                  ? undefined
                  : "Le vin d'honneur, puis le dîner et la soirée."
              }
            />

            {deadlineLabel && (
              <div className="flex gap-3 text-sm">
                <Clock className="mt-0.5 size-4 shrink-0 text-orange-500" />
                <div>
                  <div className="font-medium">
                    Réponse souhaitée avant le
                  </div>
                  <div>{deadlineLabel}</div>
                </div>
              </div>
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
            <CardTitle className="font-serif text-xl">Ta réponse</CardTitle>
            <CardDescription>
              {guest.respondedAt
                ? "Tu as déjà répondu — tu peux modifier ta réponse quand tu veux."
                : "Confirme-nous ta présence, et laisse ton email pour recevoir les informations."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RsvpForm
              code={guest.code}
              maxCompanions={guest.maxCompanions}
              askMairie={hasMairie}
              mairieLabel={
                settings.mairieTime
                  ? `à la mairie (${settings.mairieTime})`
                  : "à la mairie"
              }
              defaultValues={{
                email: guest.email ?? "",
                phone: guest.phone ?? "",
                attending: guest.attending,
                attendingMairie: guest.attendingMairie,
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
            Une question ? Écris-nous à{" "}
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
