import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Baby, ExternalLink, Landmark, Pencil } from "lucide-react";

import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { CopyMessageButton } from "@/components/admin/copy-message-button";
import { GuestDangerZone } from "@/components/admin/guest-danger-zone";
import { GuestDialog } from "@/components/admin/guest-dialog";
import { RsvpBadge } from "@/components/admin/rsvp-badge";
import { SendInvitationButton } from "@/components/admin/send-invitation-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { guestUrl } from "@/lib/codes";
import {
  EMAIL_KIND_LABELS,
  GUEST_TYPE_LABELS,
  type EmailKind,
  type GuestType,
} from "@/lib/constants";
import { prisma } from "@/lib/db";
import { invitationMessage } from "@/lib/invitation-message";
import { formatDate, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
});

export default async function GuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [guest, settings] = await Promise.all([
    prisma.guest.findUnique({
      where: { id },
      include: {
        companions: { orderBy: { createdAt: "asc" } },
        emails: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    getSettings(),
  ]);

  if (!guest) notFound();

  const url = guestUrl(guest.code);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/invites">
          <ArrowLeft className="size-4" />
          Tous les invités
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">
            {guest.firstName} {guest.lastName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={guest.type === "FULL" ? "default" : "secondary"}>
              {GUEST_TYPE_LABELS[guest.type as GuestType] ?? guest.type}
            </Badge>
            <RsvpBadge attending={guest.attending} />
            {guest.respondedAt && (
              <span className="text-xs text-muted-foreground">
                répondu le {dateTimeFormat.format(guest.respondedAt)}
              </span>
            )}
          </div>
        </div>

        <GuestDialog
          guest={{
            id: guest.id,
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email ?? "",
            phone: guest.phone ?? "",
            type: (guest.type === "COCKTAIL" ? "COCKTAIL" : "FULL") as GuestType,
            maxCompanions: guest.maxCompanions,
            notes: guest.notes ?? "",
          }}
          trigger={
            <Button variant="outline">
              <Pencil className="size-4" />
              Modifier
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lien d&apos;invitation</CardTitle>
            <CardDescription>
              Code <span className="font-mono">{guest.code}</span> — à envoyer
              par email, SMS, ou à imprimer sur le carton.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-muted px-3 py-2 font-mono text-xs break-all">
              {url}
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyLinkButton url={url} variant="outline" />
              <CopyMessageButton
                variant="outline"
                message={invitationMessage({
                  coupleNames: settings.coupleNames,
                  firstName: guest.firstName,
                  url,
                  weddingDateLabel: formatDate(settings.weddingDate),
                })}
              />
              <Button asChild variant="ghost" size="sm">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Prévisualiser
                </a>
              </Button>
              <SendInvitationButton
                guestId={guest.id}
                hasEmail={Boolean(guest.email)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Coordonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Email">
              {guest.email ?? (
                <span className="text-muted-foreground">
                  Pas encore renseigné par l&apos;invité
                </span>
              )}
            </Field>
            <Field label="Téléphone">
              {guest.phone ?? <span className="text-muted-foreground">—</span>}
            </Field>
            <Field label="Accompagnants autorisés">
              {guest.maxCompanions}
            </Field>
            {guest.notes && (
              <Field label="Notes privées">
                <span className="whitespace-pre-line">{guest.notes}</span>
              </Field>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Réponse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {guest.attending === null ? (
            <p className="text-muted-foreground">
              Cet invité n&apos;a pas encore répondu.
            </p>
          ) : (
            <>
              {guest.attending && (
                <Field label="Passage en mairie">
                  {guest.attendingMairie ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Landmark className="size-4 text-orange-500" />
                      Souhaite y assister
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Ne souhaite pas y assister
                    </span>
                  )}
                </Field>
              )}

              <Field label="Régime alimentaire">
                {guest.dietary ?? (
                  <span className="text-muted-foreground">Rien de signalé</span>
                )}
              </Field>

              {guest.companions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="font-medium mb-2">
                      Accompagnants déclarés ({guest.companions.length})
                    </div>
                    <ul className="space-y-1.5">
                      {guest.companions.map((companion) => (
                        <li
                          key={companion.id}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <span>
                            {companion.firstName} {companion.lastName}
                          </span>
                          {companion.isChild && (
                            <Badge variant="outline" className="gap-1">
                              <Baby className="size-3" />
                              Enfant
                            </Badge>
                          )}
                          {companion.dietary && (
                            <span className="text-muted-foreground text-xs">
                              — {companion.dietary}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {guest.message && (
                <>
                  <Separator />
                  <Field label="Message laissé">
                    <span className="whitespace-pre-line">{guest.message}</span>
                  </Field>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emails envoyés</CardTitle>
        </CardHeader>
        <CardContent>
          {guest.emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun email envoyé à cet invité.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {guest.emails.map((email) => (
                <li
                  key={email.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0"
                >
                  <span>
                    <Badge
                      variant={
                        email.status === "SENT" ? "secondary" : "destructive"
                      }
                      className="mr-2"
                    >
                      {EMAIL_KIND_LABELS[email.kind as EmailKind] ?? email.kind}
                    </Badge>
                    {email.subject}
                    {email.error && (
                      <span className="block text-xs text-destructive">
                        {email.error}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dateTimeFormat.format(email.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <GuestDangerZone
        guestId={guest.id}
        guestName={`${guest.firstName} ${guest.lastName}`}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
