"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { sendCustomEmail } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GUEST_TYPES, GUEST_TYPE_LABELS, type GuestType } from "@/lib/constants";

type RsvpState = "YES" | "NO" | "PENDING";

const RSVP_STATE_LABELS: Record<RsvpState, string> = {
  YES: "Présents",
  NO: "Absents",
  PENDING: "Sans réponse",
};

/** Vue réduite d'un invité, suffisante pour compter les destinataires. */
export type RecipientSummary = {
  type: string;
  attending: boolean | null;
  hasEmail: boolean;
};

function stateOf(attending: boolean | null): RsvpState {
  if (attending === true) return "YES";
  if (attending === false) return "NO";
  return "PENDING";
}

/**
 * Message libre adressé à une partie des invités. Le décompte des
 * destinataires est calculé côté client à partir de la liste déjà chargée par
 * la page : il suit les cases à cocher sans aller-retour serveur.
 */
export function BroadcastForm({ guests }: { guests: RecipientSummary[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [types, setTypes] = useState<GuestType[]>([]);
  const [states, setStates] = useState<RsvpState[]>([]);
  const [pending, startTransition] = useTransition();

  const matching = guests.filter(
    (guest) =>
      (types.length === 0 || types.includes(guest.type as GuestType)) &&
      (states.length === 0 || states.includes(stateOf(guest.attending))),
  );
  const recipients = matching.filter((guest) => guest.hasEmail).length;
  const withoutEmail = matching.length - recipients;

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value)
      ? list.filter((item) => item !== value)
      : [...list, value];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Écrire aux invités</CardTitle>
        <CardDescription>
          Un message libre, adressé à qui vous voulez. Sans case cochée, le
          critère ne filtre rien.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (
              !confirm(
                `Envoyer ce message à ${recipients} invité(s) ? Cette action est irréversible.`,
              )
            ) {
              return;
            }
            startTransition(async () => {
              const result = await sendCustomEmail({
                subject,
                body,
                types,
                states,
              });
              if (!result.ok) {
                toast.error(result.error ?? "Envoi impossible.");
                return;
              }
              toast.success(result.message ?? "Message envoyé.");
              setSubject("");
              setBody("");
              router.refresh();
            });
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium mb-2">Formule</legend>
              {GUEST_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={types.includes(type)}
                    onCheckedChange={() =>
                      setTypes((current) => toggle(current, type))
                    }
                  />
                  <Label htmlFor={`type-${type}`} className="font-normal">
                    {GUEST_TYPE_LABELS[type]}
                  </Label>
                </div>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium mb-2">
                État de la réponse
              </legend>
              {(Object.keys(RSVP_STATE_LABELS) as RsvpState[]).map((state) => (
                <div key={state} className="flex items-center gap-2">
                  <Checkbox
                    id={`state-${state}`}
                    checked={states.includes(state)}
                    onCheckedChange={() =>
                      setStates((current) => toggle(current, state))
                    }
                  />
                  <Label htmlFor={`state-${state}`} className="font-normal">
                    {RSVP_STATE_LABELS[state]}
                  </Label>
                </div>
              ))}
            </fieldset>
          </div>

          <div
            className="rounded-lg border bg-muted/40 px-4 py-3 text-sm"
            aria-live="polite"
          >
            <strong>{recipients}</strong> destinataire(s)
            {withoutEmail > 0 && (
              <span className="text-muted-foreground">
                {" "}
                — {withoutEmail} invité(s) correspondant aux filtres n&apos;ont
                pas encore renseigné leur email et ne recevront rien.
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-subject">Objet *</Label>
            <Input
              id="broadcast-subject"
              required
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Petit rappel avant le grand jour"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="broadcast-body">Message *</Label>
            <Textarea
              id="broadcast-body"
              required
              rows={8}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Le message est envoyé tel quel, précédé de « Bonjour <prénom>, » et suivi d'un lien vers la page personnelle de chacun."
            />
          </div>

          <Button
            type="submit"
            disabled={pending || recipients === 0 || !subject || !body}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Envoyer à {recipients} invité(s)
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
