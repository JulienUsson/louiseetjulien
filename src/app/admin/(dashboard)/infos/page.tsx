import { InfoDialog } from "@/components/admin/info-dialog";
import { InfoRowActions } from "@/components/admin/info-row-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AUDIENCE_LABELS, type Audience } from "@/lib/constants";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InfosPage() {
  const [infos, reachable] = await Promise.all([
    prisma.infoPost.findMany({
      orderBy: [{ pinned: "desc" }, { position: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { emails: true } } },
    }),
    prisma.guest.count({ where: { email: { not: null } } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Informations</h1>
          <p className="text-muted-foreground mt-1">
            Publiées sur la page de chaque invité concerné, et diffusables par
            email aux {reachable} invité(s) ayant renseigné leur adresse.
          </p>
        </div>
        <InfoDialog />
      </div>

      {infos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Aucune information. Créez-en une pour communiquer le programme,
            l&apos;hébergement, la liste de mariage…
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {infos.map((info) => (
            <Card key={info.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <CardTitle className="text-base">{info.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={info.published ? "default" : "outline"}>
                        {info.published ? "Publiée" : "Brouillon"}
                      </Badge>
                      <Badge variant="secondary">
                        {AUDIENCE_LABELS[info.audience as Audience] ??
                          info.audience}
                      </Badge>
                      {info.pinned && <Badge variant="outline">Épinglée</Badge>}
                      {info._count.emails > 0 && (
                        <span className="text-xs text-muted-foreground">
                          envoyée {info._count.emails} fois
                        </span>
                      )}
                    </div>
                  </div>

                  <InfoRowActions
                    info={{
                      id: info.id,
                      title: info.title,
                      body: info.body,
                      audience: (info.audience as Audience) ?? "ALL",
                      published: info.published,
                      pinned: info.pinned,
                      position: info.position,
                    }}
                  />
                </div>
                <CardDescription className="sr-only">
                  Contenu de l&apos;information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-sm text-muted-foreground line-clamp-4">
                  {info.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
