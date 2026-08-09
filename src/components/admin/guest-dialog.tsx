"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createGuest,
  updateGuest,
  type GuestInput,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GUEST_TYPES, GUEST_TYPE_LABELS, type GuestType } from "@/lib/constants";

type GuestFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: GuestType;
  maxCompanions: number;
  notes: string;
};

const EMPTY: GuestFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  type: "FULL",
  maxCompanions: 0,
  notes: "",
};

/**
 * Sert à la création (sans `guest`) comme à la modification (avec `guest`).
 */
export function GuestDialog({
  guest,
  trigger,
}: {
  guest?: { id: string } & GuestFormValues;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<GuestFormValues>(guest ?? EMPTY);
  const [sendInvitation, setSendInvitation] = useState(true);
  const [pending, startTransition] = useTransition();

  // Rien à envoyer sans adresse, et on ne renvoie pas d'invitation depuis une
  // simple modification de fiche.
  const canSendInvitation = !guest && values.email.trim().length > 0;

  const set = <K extends keyof GuestFormValues>(
    key: K,
    value: GuestFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    startTransition(async () => {
      const payload: GuestInput = values;
      const result = guest
        ? await updateGuest(guest.id, payload)
        : await createGuest(payload, canSendInvitation && sendInvitation);

      if (!result.ok) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }

      toast.success(
        result.message ?? (guest ? "Invité mis à jour." : "Invité créé."),
      );
      setOpen(false);
      if (!guest) setValues(EMPTY);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValues(guest ?? EMPTY);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Ajouter un invité
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {guest ? "Modifier l'invité" : "Nouvel invité"}
            </DialogTitle>
            <DialogDescription>
              Un lien personnel est généré automatiquement. L&apos;email peut
              rester vide : l&apos;invité le renseignera lui-même.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  required
                  value={values.firstName}
                  onChange={(event) => set("firstName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  required
                  value={values.lastName}
                  onChange={(event) => set("lastName", event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Formule</Label>
                <Select
                  value={values.type}
                  onValueChange={(value) => set("type", value as GuestType)}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GUEST_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {GUEST_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCompanions">Accompagnants autorisés</Label>
                <Input
                  id="maxCompanions"
                  type="number"
                  min={0}
                  max={10}
                  value={values.maxCompanions}
                  onChange={(event) =>
                    set("maxCompanions", Number(event.target.value))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email (facultatif)</Label>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone (facultatif)</Label>
                <Input
                  id="phone"
                  value={values.phone}
                  onChange={(event) => set("phone", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes privées</Label>
              <Textarea
                id="notes"
                rows={2}
                value={values.notes}
                onChange={(event) => set("notes", event.target.value)}
                placeholder="Jamais affiché à l'invité."
              />
            </div>

            {!guest && (
              <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                <Checkbox
                  id="sendInvitation"
                  checked={canSendInvitation && sendInvitation}
                  disabled={!canSendInvitation}
                  onCheckedChange={(checked) =>
                    setSendInvitation(checked === true)
                  }
                  className="mt-0.5"
                />
                <div>
                  <Label
                    htmlFor="sendInvitation"
                    className="font-normal data-[disabled]:opacity-60"
                  >
                    Envoyer l&apos;invitation par email tout de suite
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {canSendInvitation
                      ? "Le lien personnel part dès la création."
                      : "Renseignez une adresse email pour pouvoir l'envoyer. Sinon, utilisez « Copier le message » pour l'envoyer par SMS."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {guest ? "Enregistrer" : "Créer l'invité"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
