import Link from "next/link";
import {
  CheckCircle2,
  CircleHelp,
  Landmark,
  Mail,
  MailWarning,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GUEST_TYPE_LABELS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { isMailConfigured } from "@/lib/mail";
import { formatDate, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [guests, settings] = await Promise.all([
    prisma.guest.findMany({
      select: {
        type: true,
        attending: true,
        attendingMairie: true,
        email: true,
        _count: { select: { companions: true } },
      },
    }),
    getSettings(),
  ]);

  const yes = guests.filter((guest) => guest.attending === true);
  const no = guests.filter((guest) => guest.attending === false).length;
  const pending = guests.filter((guest) => guest.attending === null).length;
  const withoutEmail = guests.filter((guest) => !guest.email).length;

  // Un accompagnant suit la formule de l'invité qui l'a déclaré.
  const headcountOf = (type: string) =>
    yes
      .filter((guest) => guest.type === type)
      .reduce((total, guest) => total + 1 + guest._count.companions, 0);

  const fullDay = headcountOf("FULL");
  const cocktailOnly = headcountOf("COCKTAIL");
  const headcount = fullDay + cocktailOnly;

  // Les accompagnants suivent leur hôte à la mairie.
  const mairie = yes
    .filter((guest) => guest.attendingMairie)
    .reduce((total, guest) => total + 1 + guest._count.companions, 0);

  const dateLabel = formatDate(settings.weddingDate);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Tableau de bord</h1>
        <p className="text-muted-foreground mt-1">
          {dateLabel ? `Mariage le ${dateLabel}.` : "Date à renseigner."}{" "}
          {guests.length} invitation(s) créée(s).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
          label="Présents"
          value={yes.length}
          hint={`${headcount} personnes avec les accompagnants`}
        />
        <StatCard
          icon={<XCircle className="size-5 text-stone-500" />}
          label="Absents"
          value={no}
        />
        <StatCard
          icon={<CircleHelp className="size-5 text-orange-500" />}
          label="Sans réponse"
          value={pending}
        />
        <StatCard
          icon={<Users className="size-5 text-rose-600" />}
          label="Total invitations"
          value={guests.length}
          hint={`${withoutEmail} sans email`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des présents</CardTitle>
            <CardDescription>
              Utile pour le traiteur et le plan de table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>{GUEST_TYPE_LABELS.FULL}</span>
              <span className="font-medium">{fullDay} personne(s)</span>
            </div>
            <div className="flex justify-between">
              <span>{GUEST_TYPE_LABELS.COCKTAIL}</span>
              <span className="font-medium">{cocktailOnly} personne(s)</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Total</span>
              <span className="font-medium">{headcount} personne(s)</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Landmark className="size-4 text-orange-500" />
                Dont à la mairie
              </span>
              <span>{mairie} personne(s)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {isMailConfigured() ? (
                <Mail className="size-4 text-emerald-600" />
              ) : (
                <MailWarning className="size-4 text-orange-500" />
              )}
              Envoi d&apos;emails
            </CardTitle>
            <CardDescription>
              {isMailConfigured()
                ? "SMTP configuré : les invitations et les infos peuvent partir."
                : "SMTP non configuré : renseignez SMTP_HOST dans le fichier .env pour activer l'envoi."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/admin/invites">Gérer les invités</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/emails">Voir les envois</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon}
        </div>
        <div className="mt-2 text-3xl font-semibold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
