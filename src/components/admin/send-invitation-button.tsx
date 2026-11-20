"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { sendInvitation, sendReminders } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function SendInvitationButton({
  guestId,
  hasEmail,
  reminder = false,
}: {
  guestId: string;
  hasEmail: boolean;
  /** Envoie la relance plutôt que l'invitation. */
  reminder?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending || !hasEmail}
      title={
        hasEmail
          ? undefined
          : "Renseignez d'abord une adresse email pour cet invité."
      }
      onClick={() =>
        startTransition(async () => {
          const result = reminder
            ? await sendReminders([guestId])
            : await sendInvitation(guestId);
          if (result.ok) toast.success(result.message ?? "Email envoyé.");
          else toast.error(result.error ?? "Envoi impossible.");
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Send className="size-4" />
      )}
      {reminder ? "Relancer par email" : "Envoyer par email"}
    </Button>
  );
}
