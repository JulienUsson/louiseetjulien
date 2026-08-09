"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { submitRsvp } from "@/app/i/[code]/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type CompanionDraft = {
  firstName: string;
  lastName: string;
  isChild: boolean;
  dietary: string;
};

export type RsvpFormProps = {
  code: string;
  maxCompanions: number;
  defaultValues: {
    email: string;
    phone: string;
    attending: boolean | null;
    dietary: string;
    message: string;
    companions: CompanionDraft[];
  };
};

const emptyCompanion: CompanionDraft = {
  firstName: "",
  lastName: "",
  isChild: false,
  dietary: "",
};

export function RsvpForm({ code, maxCompanions, defaultValues }: RsvpFormProps) {
  const [attending, setAttending] = useState<boolean | null>(
    defaultValues.attending,
  );
  const [email, setEmail] = useState(defaultValues.email);
  const [phone, setPhone] = useState(defaultValues.phone);
  const [dietary, setDietary] = useState(defaultValues.dietary);
  const [message, setMessage] = useState(defaultValues.message);
  const [companions, setCompanions] = useState<CompanionDraft[]>(
    defaultValues.companions,
  );
  const [pending, startTransition] = useTransition();

  const updateCompanion = (index: number, patch: Partial<CompanionDraft>) => {
    setCompanions((current) =>
      current.map((companion, i) =>
        i === index ? { ...companion, ...patch } : companion,
      ),
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (attending === null) {
      toast.error("Merci d'indiquer si vous serez des nôtres.");
      return;
    }

    startTransition(async () => {
      const result = await submitRsvp({
        code,
        email,
        phone,
        attending,
        dietary,
        message,
        companions,
      });

      if (result.ok) {
        toast.success(
          attending
            ? "Merci ! Votre réponse est enregistrée."
            : "Merci pour votre réponse, vous nous manquerez.",
        );
      } else {
        toast.error(result.error ?? "Une erreur est survenue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium mb-3">
          Serez-vous des nôtres ?
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <ChoiceButton
            selected={attending === true}
            onClick={() => setAttending(true)}
            icon={<Check className="size-4" />}
            label="Avec joie !"
            tone="yes"
          />
          <ChoiceButton
            selected={attending === false}
            onClick={() => setAttending(false)}
            icon={<X className="size-4" />}
            label="Je ne pourrai pas"
            tone="no"
          />
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Votre email *</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="prenom.nom@email.fr"
            autoComplete="email"
          />
          <p className="text-xs text-muted-foreground">
            Pour vous envoyer les infos pratiques. Rien d&apos;autre, promis.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone (facultatif)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="06 12 34 56 78"
            autoComplete="tel"
          />
        </div>
      </div>

      {attending === true && (
        <>
          <div className="space-y-2">
            <Label htmlFor="dietary">Allergies ou régime alimentaire</Label>
            <Input
              id="dietary"
              value={dietary}
              onChange={(event) => setDietary(event.target.value)}
              placeholder="Végétarien, sans gluten, allergie aux fruits à coque…"
            />
          </div>

          {maxCompanions > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Vos accompagnants</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vous pouvez en déclarer jusqu&apos;à {maxCompanions}.
                  </p>
                </div>
                {companions.length < maxCompanions && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCompanions((current) => [...current, { ...emptyCompanion }])
                    }
                  >
                    <Plus className="size-4" />
                    Ajouter
                  </Button>
                )}
              </div>

              {companions.map((companion, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-muted/40 p-4 space-y-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={companion.firstName}
                      onChange={(event) =>
                        updateCompanion(index, { firstName: event.target.value })
                      }
                      placeholder="Prénom *"
                      aria-label={`Prénom de l'accompagnant ${index + 1}`}
                      required
                    />
                    <Input
                      value={companion.lastName}
                      onChange={(event) =>
                        updateCompanion(index, { lastName: event.target.value })
                      }
                      placeholder="Nom"
                      aria-label={`Nom de l'accompagnant ${index + 1}`}
                    />
                  </div>
                  <Input
                    value={companion.dietary}
                    onChange={(event) =>
                      updateCompanion(index, { dietary: event.target.value })
                    }
                    placeholder="Allergies ou régime alimentaire"
                    aria-label={`Régime de l'accompagnant ${index + 1}`}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`child-${index}`}
                        checked={companion.isChild}
                        onCheckedChange={(checked) =>
                          updateCompanion(index, { isChild: checked === true })
                        }
                      />
                      <Label
                        htmlFor={`child-${index}`}
                        className="text-sm font-normal"
                      >
                        C&apos;est un enfant
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() =>
                        setCompanions((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                      Retirer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="message">Un mot pour nous ?</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={3}
          placeholder="Une question, une contrainte, un petit mot…"
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {defaultValues.attending === null
          ? "Envoyer ma réponse"
          : "Mettre à jour ma réponse"}
      </Button>
    </form>
  );
}

function ChoiceButton({
  selected,
  onClick,
  icon,
  label,
  tone,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "yes" | "no";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected && tone === "yes" && "border-rose-500 bg-rose-50 text-rose-700",
        selected &&
          tone === "no" &&
          "border-stone-400 bg-stone-100 text-stone-700",
        !selected && "border-border bg-card hover:bg-accent",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
