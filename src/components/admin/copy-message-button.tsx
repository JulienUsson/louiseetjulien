"use client";

import { useState } from "react";
import { Check, MessageSquareShare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Copie le message d'invitation complet, prêt à coller dans un SMS ou une
 * messagerie — par opposition au bouton qui ne copie que l'URL.
 */
export function CopyMessageButton({
  message,
  label = "Copier le message",
  variant = "ghost",
}: {
  message: string;
  label?: string;
  variant?: "ghost" | "outline" | "default";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Message copié, prêt à coller.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le presse-papier est refusé hors HTTPS : on affiche le texte à copier.
      toast.error("Copie impossible. Le message :\n\n" + message, {
        duration: 20000,
      });
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={copy}
      title="Copier un message d'invitation prêt à envoyer"
    >
      {copied ? (
        <Check className="size-4" />
      ) : (
        <MessageSquareShare className="size-4" />
      )}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </Button>
  );
}
