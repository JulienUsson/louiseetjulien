"use client";

import { useState, useTransition } from "react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { geocodeSetting, updateSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SETTING_GROUPS,
  VENUES,
  frenchDateToIso,
  isoToFrenchDate,
  parseCoords,
  type SettingKey,
  type Settings,
} from "@/lib/settings-fields";

const DATE_KEYS = SETTING_GROUPS.flatMap((group) => group.fields)
  .filter((field) => field.type === "date")
  .map((field) => field.key);

export function SettingsForm({ settings }: { settings: Settings }) {
  const [values, setValues] = useState<Settings>(settings);
  const [dateTexts, setDateTexts] = useState<Partial<Record<SettingKey, string>>>(
    () =>
      Object.fromEntries(
        DATE_KEYS.map((key) => [key, isoToFrenchDate(settings[key])]),
      ),
  );
  const [pending, startTransition] = useTransition();
  const [locating, setLocating] = useState<string | null>(null);

  const set = (key: SettingKey, value: string) =>
    setValues((current) => ({ ...current, [key]: value }));

  const setDate = (key: SettingKey, text: string) => {
    setDateTexts((current) => ({ ...current, [key]: text }));
    const iso = frenchDateToIso(text);
    if (iso !== null) set(key, iso);
  };

  const invalidDate = (key: SettingKey) =>
    frenchDateToIso(dateTexts[key] ?? "") === null;

  const locate = (venueId: string) => {
    const venue = VENUES.find((candidate) => candidate.id === venueId);
    if (!venue) return;

    setLocating(venueId);
    startTransition(async () => {
      const result = await geocodeSetting(values[venue.addressKey]);
      setLocating(null);

      if (!result.ok || !result.coords) {
        toast.error(result.error ?? "Localisation impossible.");
        return;
      }
      set(venue.coordsKey, result.coords);
      toast.success(result.message ?? "Coordonnées trouvées.");
    });
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (DATE_KEYS.some(invalidDate)) {
          toast.error("Une date est invalide : utilisez le format JJ/MM/AAAA.");
          return;
        }
        startTransition(async () => {
          const result = await updateSettings(values);
          if (result.ok) toast.success(result.message ?? "Enregistré.");
          else toast.error(result.error ?? "Enregistrement impossible.");
        });
      }}
    >
      {SETTING_GROUPS.map((group) => {
        const venue = group.venueId
          ? VENUES.find((candidate) => candidate.id === group.venueId)
          : undefined;
        const coords = venue ? parseCoords(values[venue.coordsKey]) : null;

        return (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle className="text-base">{group.title}</CardTitle>
              {group.description && (
                <CardDescription>{group.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {group.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    {field.type === "date" ? (
                      <Input
                        id={field.key}
                        name={field.key}
                        inputMode="numeric"
                        placeholder="JJ/MM/AAAA"
                        value={dateTexts[field.key] ?? ""}
                        onChange={(event) =>
                          setDate(field.key, event.target.value)
                        }
                        aria-invalid={invalidDate(field.key)}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        name={field.key}
                        type={field.type ?? "text"}
                        value={values[field.key]}
                        onChange={(event) => set(field.key, event.target.value)}
                      />
                    )}
                    {field.type === "date" && invalidDate(field.key) ? (
                      <p className="text-xs text-destructive">
                        Format attendu : JJ/MM/AAAA
                      </p>
                    ) : (
                      field.help && (
                        <p className="text-xs text-muted-foreground">
                          {field.help}
                        </p>
                      )
                    )}
                  </div>
                ))}
              </div>

              {venue && (
                <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                  <Label htmlFor={venue.coordsKey}>
                    Coordonnées de la carte
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id={venue.coordsKey}
                      value={values[venue.coordsKey]}
                      onChange={(event) =>
                        set(venue.coordsKey, event.target.value)
                      }
                      placeholder="45.76404,4.83566"
                      className="max-w-xs font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={pending}
                      onClick={() => locate(venue.id)}
                    >
                      {locating === venue.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <MapPin className="size-4" />
                      )}
                      Localiser l&apos;adresse
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format <code>latitude,longitude</code>. Sans coordonnées, la
                    carte n&apos;est pas affichée aux invités — seule
                    l&apos;adresse en texte l&apos;est.
                    {values[venue.coordsKey] && !coords && (
                      <span className="ml-1 text-destructive">
                        Format invalide.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Enregistrer
      </Button>
    </form>
  );
}
