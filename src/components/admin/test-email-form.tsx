"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { sendTestEmail } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/** Vérifier la configuration SMTP avant d'écrire à 120 personnes. */
export function TestEmailForm() {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tester la configuration</CardTitle>
        <CardDescription>
          Envoyez-vous un email de test avant la première diffusion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await sendTestEmail(to);
              if (result.ok) {
                toast.success(result.message ?? "Email de test envoyé.");
                router.refresh();
              } else {
                toast.error(result.error ?? "Envoi impossible.");
              }
            });
          }}
        >
          <Input
            type="email"
            required
            value={to}
            onChange={(event) => setTo(event.target.value)}
            placeholder="votre.adresse@email.fr"
            className="max-w-xs"
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Envoyer un test
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
