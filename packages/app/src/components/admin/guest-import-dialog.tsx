"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { importGuests } from "@/app/admin/actions";
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
import { Textarea } from "@/components/ui/textarea";

const PLACEHOLDER = `Camille;Bernard;FULL;2;camille@example.com
Antoine;Lefèvre;FULL;1
Sophie;Marchand;COCKTAIL;1`;

/** Coller la liste depuis un tableur plutôt que saisir 120 invités un à un. */
export function GuestImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [raw, setRaw] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Importer une liste
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Importer des invités</DialogTitle>
          <DialogDescription>
            Une ligne par invité :{" "}
            <code className="text-xs">
              Prénom;Nom;FULL ou COCKTAIL;accompagnants;email
            </code>
            . Seuls le prénom et le nom sont obligatoires. Les séparateurs
            point-virgule, virgule et tabulation sont acceptés — vous pouvez
            coller directement depuis un tableur.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          rows={10}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          placeholder={PLACEHOLDER}
          className="font-mono text-xs"
        />

        <DialogFooter>
          <Button
            disabled={pending || !raw.trim()}
            onClick={() =>
              startTransition(async () => {
                const result = await importGuests(raw);
                if (!result.ok) {
                  toast.error(result.error ?? "Import impossible.");
                  return;
                }
                toast.success(result.message ?? "Import terminé.");
                setRaw("");
                setOpen(false);
                router.refresh();
              })
            }
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Importer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
