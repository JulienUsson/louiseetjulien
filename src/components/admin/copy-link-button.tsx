"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function CopyLinkButton({
  url,
  label = "Copier le lien",
  variant = "ghost",
}: {
  url: string;
  label?: string;
  variant?: "ghost" | "outline" | "default";
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le presse-papier est refusé hors HTTPS : on montre le lien à copier.
      toast.error("Copie impossible. Le lien est : " + url, { duration: 10000 });
    }
  };

  return (
    <Button variant={variant} size="sm" onClick={copy} title={url}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      <span className="sr-only sm:not-sr-only">{label}</span>
    </Button>
  );
}
