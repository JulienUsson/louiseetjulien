"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SETTING_FIELDS, type Settings } from "@/lib/settings-fields";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            startTransition(async () => {
              const result = await updateSettings(formData);
              if (result.ok) toast.success(result.message ?? "Enregistré.");
              else toast.error(result.error ?? "Enregistrement impossible.");
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {SETTING_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  name={field.key}
                  type={field.type ?? "text"}
                  defaultValue={settings[field.key]}
                />
                {field.help && (
                  <p className="text-xs text-muted-foreground">{field.help}</p>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
