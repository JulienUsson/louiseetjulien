"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteGuest, regenerateGuestCode } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function GuestDangerZone({
  guestId,
  guestName,
}: {
  guestId: string;
  guestName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const regenerate = () => {
    if (
      !confirm(
        "Générer un nouveau lien ? L'ancien lien cessera immédiatement de fonctionner.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await regenerateGuestCode(guestId);
      if (result.ok) {
        toast.success(result.message ?? "Nouveau lien généré.");
        router.refresh();
      } else {
        toast.error(result.error ?? "Opération impossible.");
      }
    });
  };

  const remove = () => {
    if (
      !confirm(
        `Supprimer définitivement ${guestName} ? Sa réponse et ses accompagnants seront perdus.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteGuest(guestId);
      if (result.ok) {
        toast.success("Invité supprimé.");
        router.push("/admin/invites");
      } else {
        toast.error(result.error ?? "Suppression impossible.");
      }
    });
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">
          Zone sensible
        </CardTitle>
        <CardDescription>
          Ces deux actions sont irréversibles.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={regenerate}>
          <RefreshCw className="size-4" />
          Régénérer le lien
        </Button>
        <Button variant="destructive" size="sm" disabled={pending} onClick={remove}>
          <Trash2 className="size-4" />
          Supprimer l&apos;invité
        </Button>
      </CardContent>
    </Card>
  );
}
