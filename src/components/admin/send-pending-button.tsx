"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { sendPendingInvitations } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

/** Envoie son lien à tout invité ayant un email et n'ayant jamais été contacté. */
export function SendPendingButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
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
      Envoyer les invitations en attente
    </Button>
  );
}
