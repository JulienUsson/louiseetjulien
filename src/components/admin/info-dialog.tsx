"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { saveInfo } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AUDIENCES, AUDIENCE_LABELS, type Audience } from "@/lib/constants";

export type InfoFormValues = {
  title: string;
  body: string;
  audience: Audience;
  published: boolean;
  pinned: boolean;
  position: number;
};

const EMPTY: InfoFormValues = {
  title: "",
  body: "",
  audience: "ALL",
  published: false,
  pinned: false,
  position: 0,
};

export function InfoDialog({
  info,
  trigger,
}: {
  info?: { id: string } & InfoFormValues;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<InfoFormValues>(info ?? EMPTY);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof InfoFormValues>(
    key: K,
    value: InfoFormValues[K],
  ) => setValues((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveInfo(info?.id ?? null, values);
      if (!result.ok) {
        toast.error(result.error ?? "Enregistrement impossible.");
        return;
      }
      toast.success(info ? "Information mise à jour." : "Information créée.");
      setOpen(false);
      if (!info) setValues(EMPTY);
      router.refresh();
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValues(info ?? EMPTY);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="size-4" />
            Nouvelle information
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {info ? "Modifier l'information" : "Nouvelle information"}
            </DialogTitle>
            <DialogDescription>
              Le texte est affiché tel quel : les sauts de ligne sont conservés.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                required
                value={values.title}
                onChange={(event) => set("title", event.target.value)}
                placeholder="Où dormir ?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Contenu *</Label>
              <Textarea
                id="body"
                required
                rows={8}
                value={values.body}
                onChange={(event) => set("body", event.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audience">Destinataires</Label>
                <Select
                  value={values.audience}
                  onValueChange={(value) => set("audience", value as Audience)}
                >
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((audience) => (
                      <SelectItem key={audience} value={audience}>
                        {AUDIENCE_LABELS[audience]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Ordre d&apos;affichage</Label>
                <Input
                  id="position"
                  type="number"
                  min={0}
                  value={values.position}
                  onChange={(event) =>
                    set("position", Number(event.target.value))
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="published" className="font-normal">
                  Visible par les invités
                </Label>
                <Switch
                  id="published"
                  checked={values.published}
                  onCheckedChange={(checked) => set("published", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pinned" className="font-normal">
                  Épingler en haut de la page
                </Label>
                <Switch
                  id="pinned"
                  checked={values.pinned}
                  onCheckedChange={(checked) => set("pinned", checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
