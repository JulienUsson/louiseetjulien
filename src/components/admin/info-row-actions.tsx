"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Eye, EyeOff, Loader2, MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteInfo,
  sendInfoToGuests,
  toggleInfoPublished,
} from "@/app/admin/actions";
import { InfoDialog, type InfoFormValues } from "@/components/admin/info-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function InfoRowActions({
  info,
}: {
  info: { id: string } & InfoFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
    successMessage: string,
  ) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? successMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? "Opération impossible.");
      }
    });

  return (
    <div className="flex items-center gap-1">
      <InfoDialog
        info={info}
        trigger={
          <Button variant="ghost" size="sm">
            <Pencil className="size-4" />
            Modifier
          </Button>
        }
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
            <span className="sr-only">Autres actions</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() =>
              run(
                () => toggleInfoPublished(info.id, !info.published),
                info.published ? "Information dépubliée." : "Information publiée.",
              )
            }
          >
            {info.published ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
            {info.published ? "Dépublier" : "Publier"}
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!info.published}
            onSelect={() => {
              if (
                !confirm(
                  "Envoyer cette information par email à tous les invités concernés ayant renseigné leur adresse ?",
                )
              ) {
                return;
              }
              run(() => sendInfoToGuests(info.id), "Information envoyée.");
            }}
          >
            <Send className="size-4" />
            Envoyer par email
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              if (!confirm(`Supprimer « ${info.title} » ?`)) return;
              run(() => deleteInfo(info.id), "Information supprimée.");
            }}
          >
            <Trash2 className="size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
