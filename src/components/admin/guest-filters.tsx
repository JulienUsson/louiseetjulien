"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GUEST_FILTER_KEYS,
  GUEST_FILTERS,
  guestListHref,
  type GuestFilterKey,
  type GuestFilters,
} from "@/lib/guest-filters";
import { cn } from "@/lib/utils";

const ALL = "all";

export function GuestFiltersBar({ filters }: { filters: GuestFilters }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = GUEST_FILTER_KEYS.some((key) => filters[key]);

  const navigate = (next: GuestFilters) =>
    startTransition(() => router.replace(guestListHref(next), { scroll: false }));

  const change = (key: GuestFilterKey, value: string) =>
    navigate({ ...filters, [key]: value === ALL ? undefined : value });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
        {GUEST_FILTER_KEYS.map((key) => {
          const { label, allLabel, options } = GUEST_FILTERS[key];
          const value = filters[key] ?? ALL;

          return (
            <Select
              key={key}
              value={value}
              onValueChange={(next) => change(key, next)}
            >
              <SelectTrigger
                aria-label={label}
                className={cn(
                  "w-full bg-background sm:w-auto",
                  value === ALL
                    ? "text-muted-foreground"
                    : "border-rose-300 bg-rose-50 text-rose-800",
                )}
              >
                <SelectValue>
                  {value === ALL
                    ? label
                    : (options as Record<string, string>)[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{allLabel}</SelectItem>
                {Object.entries(options).map(([option, optionLabel]) => (
                  <SelectItem key={option} value={option}>
                    {optionLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
      </div>

      {active && (
        <Button variant="ghost" size="sm" onClick={() => navigate({})}>
          <X className="size-4" />
          Réinitialiser
        </Button>
      )}
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
