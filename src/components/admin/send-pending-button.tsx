"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { sendPendingInvitations } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

/**
 * Envoie son lien à tout invité ayant un email et n'ayant jamais été contacté.
 * Les invités sans email sont hors d'atteinte : le bouton le dit, sinon on
 * croit avoir invité tout le monde alors qu'il en manque la moitié.
 */
export function SendPendingButton({
  reachable,
  unreachable,
}: {
  reachable: number;
  unreachable: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending || reachable === 0}
      title={
        unreachable > 0
          ? `${unreachable} invité(s) n'ont pas encore d'email : envoyez-leur leur lien avec « Copier le message ».`
          : undefined
      }
      onClick={() =>
        startTransition(async () => {
          const result = await sendPendingInvitations();
          if (result.ok) toast.success(result.message ?? "Envoi terminé.");
          else toast.error(result.error ?? "Envoi impossible.");
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Send className="size-4" />
      )}
      Envoyer {reachable} invitation(s) en attente
    </Button>
  );
}
