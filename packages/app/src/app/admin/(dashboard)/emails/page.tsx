import Link from "next/link";
import { MailWarning } from "lucide-react";

import { TestEmailForm } from "@/components/admin/test-email-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EMAIL_KIND_LABELS, type EmailKind } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { isMailConfigured, mailFrom } from "@/lib/mail";

export const dynamic = "force-dynamic";

const dateTimeFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function EmailsPage() {
  const emails = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { guest: { select: { id: true, firstName: true, lastName: true } } },
  });

  const failed = emails.filter((email) => email.status === "FAILED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Emails</h1>
        <p className="text-muted-foreground mt-1">
          {emails.length === 200 ? "200 derniers envois" : `${emails.length} envoi(s)`}
          {failed > 0 && ` — dont ${failed} en échec`}.
        </p>
      </div>

      {!isMailConfigured() ? (
        <Alert>
          <MailWarning className="size-4" />
          <AlertTitle>Envoi d&apos;emails désactivé</AlertTitle>
          <AlertDescription>
            Renseignez <code>SMTP_HOST</code> (et au besoin{" "}
            <code>SMTP_PORT</code>, <code>SMTP_USER</code>,{" "}
            <code>SMTP_PASSWORD</code>, <code>SMTP_FROM</code>) dans le fichier{" "}
            <code>.env</code>, puis redémarrez l&apos;application. Les tentatives
            d&apos;envoi restent journalisées ci-dessous.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>Expéditeur</AlertTitle>
          <AlertDescription>
            Les emails partent au nom de <code>{mailFrom()}</code>.
          </AlertDescription>
        </Alert>
      )}

      <TestEmailForm />

      {emails.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">Aucun email envoyé pour le moment.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {dateTimeFormat.format(email.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {EMAIL_KIND_LABELS[email.kind as EmailKind] ?? email.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {email.guest ? (
                      <Link
                        href={`/admin/invites/${email.guest.id}`}
                        className="hover:underline"
                      >
                        {email.guest.firstName} {email.guest.lastName}
                      </Link>
                    ) : (
                      email.to
                    )}
                    <span className="block text-xs text-muted-foreground">
                      {email.to}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate text-sm">
                    {email.subject}
                  </TableCell>
                  <TableCell>
                    {email.status === "SENT" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        Envoyé
                      </Badge>
                    ) : (
                      <span>
                        <Badge variant="destructive">Échec</Badge>
                        {email.error && (
                          <span className="block max-w-[240px] truncate text-xs text-muted-foreground">
                            {email.error}
                          </span>
                        )}
                      </span>
                    )}
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
