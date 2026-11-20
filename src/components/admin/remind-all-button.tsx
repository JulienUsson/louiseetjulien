"use client";

import { useTransition } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { sendReminders } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function RemindAllButton({ guestIds }: { guestIds: string[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending || guestIds.length === 0}
      onClick={() => {
        if (
          !window.confirm(
            `Envoyer la relance par email à ${guestIds.length} invité(s) ?`,
          )
        ) {
          return;
        }
        startTransition(async () => {
          const result = await sendReminders(guestIds);
          if (result.ok) toast.success(result.message ?? "Relances envoyées.");
          else toast.error(result.error ?? "Envoi impossible.");
        });
      }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <BellRing className="size-4" />
      )}
      Relancer par email ({guestIds.length})
    </Button>
  );
}
