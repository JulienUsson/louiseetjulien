import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { CopyMessageButton } from "@/components/admin/copy-message-button";
import { GuestDialog } from "@/components/admin/guest-dialog";
import { GuestImportDialog } from "@/components/admin/guest-import-dialog";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { RsvpBadge } from "@/components/admin/rsvp-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { guestUrl } from "@/lib/codes";
import { GUEST_TYPE_LABELS, type GuestType } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { invitationMessage } from "@/lib/invitation-message";
import { formatDate, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const [guests, settings] = await Promise.all([
    prisma.guest.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        _count: { select: { companions: true } },
        emails: {
          where: { kind: "INVITATION", status: "SENT" },
          select: { id: true },
          take: 1,
        },
      },
    }),
    getSettings(),
  ]);

  const weddingDateLabel = formatDate(settings.weddingDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Invités</h1>
          <p className="text-muted-foreground mt-1">
            {guests.length} invitation(s). Chaque invité renseigne lui-même son
            email depuis son lien.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GuestImportDialog />
          <GuestDialog />
        </div>
      </div>

      {guests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Aucun invité pour l&apos;instant. Ajoutez-en un, ou importez votre
            liste d&apos;un coup.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invité</TableHead>
                <TableHead>Formule</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Réponse</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guests.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell>
                    <Link
                      href={`/admin/invites/${guest.id}`}
                      className="font-medium hover:underline"
                    >
                      {guest.firstName} {guest.lastName}
                    </Link>
                    {guest._count.companions > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        +{guest._count.companions}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={guest.type === "FULL" ? "default" : "secondary"}
                    >
                      {GUEST_TYPE_LABELS[guest.type as GuestType] ?? guest.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">
                    {guest.email ? (
                      <span className="flex items-center gap-2">
                        {guest.email}
                        {guest.emails.length > 0 && (
                          <span
                            className="text-xs text-emerald-600"
                            title="Invitation envoyée"
                          >
                            ✓
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <RsvpBadge attending={guest.attending} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <CopyLinkButton
                        url={guestUrl(guest.code)}
                        label="Lien"
                      />
                      <CopyMessageButton
                        label="Message"
                        message={invitationMessage({
                          coupleNames: settings.coupleNames,
                          firstName: guest.firstName,
                          url: guestUrl(guest.code),
                          weddingDateLabel,
                        })}
                      />
                      <Button asChild variant="ghost" size="sm">
                        <a
                          href={guestUrl(guest.code)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ouvrir la page telle que l'invité la voit"
                        >
                          <ExternalLink className="size-4" />
                          <span className="sr-only sm:not-sr-only">
                            Prévisualiser
                          </span>
                        </a>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/invites/${guest.id}`}>Fiche</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
