/**
 * Filtres de la liste des invités, portés par l'URL (`/admin/invites?…`) pour
 * que le tableau de bord puisse renvoyer directement vers une catégorie.
 */

import type { Prisma } from "@/generated/prisma/client";
import {
  GUEST_TYPE_LABELS,
  GUEST_TYPES,
  LODGING_LABELS,
  LODGINGS,
} from "@/lib/constants";

export const GUEST_FILTERS = {
  reponse: {
    label: "Réponse",
    allLabel: "Toutes les réponses",
    options: {
      oui: "Présents",
      non: "Absents",
      attente: "Sans réponse",
    },
  },
  formule: {
    label: "Formule",
    allLabel: "Toutes les formules",
    options: Object.fromEntries(
      GUEST_TYPES.map((type) => [type, GUEST_TYPE_LABELS[type]]),
    ),
  },
  mairie: {
    label: "Mairie",
    allLabel: "Mairie : peu importe",
    options: {
      oui: "À la mairie",
      non: "Pas à la mairie",
    },
  },
  logement: {
    label: "Logement",
    allLabel: "Tous les logements",
    options: {
      ...Object.fromEntries(
        LODGINGS.map((lodging) => [lodging, LODGING_LABELS[lodging]]),
      ),
      aucun: "Non précisé",
    },
  },
  email: {
    label: "Email",
    allLabel: "Avec ou sans email",
    options: {
      avec: "Avec email",
      sans: "Sans email",
    },
  },
} as const satisfies Record<
  string,
  { label: string; allLabel: string; options: Record<string, string> }
>;

export type GuestFilterKey = keyof typeof GUEST_FILTERS;
export type GuestFilters = Partial<Record<GuestFilterKey, string>>;

export const GUEST_FILTER_KEYS = Object.keys(GUEST_FILTERS) as GuestFilterKey[];

/** Ne garde que les filtres connus, avec une valeur connue. */
export function parseGuestFilters(
  params: Record<string, string | string[] | undefined>,
): GuestFilters {
  const filters: GuestFilters = {};
  for (const key of GUEST_FILTER_KEYS) {
    const value = params[key];
    if (typeof value === "string" && value in GUEST_FILTERS[key].options) {
      filters[key] = value;
    }
  }
  return filters;
}

export function guestFiltersWhere(
  filters: GuestFilters,
): Prisma.GuestWhereInput {
  const where: Prisma.GuestWhereInput[] = [];

  if (filters.reponse === "oui") where.push({ attending: true });
  if (filters.reponse === "non") where.push({ attending: false });
  if (filters.reponse === "attente") where.push({ attending: null });

  if (filters.formule) where.push({ type: filters.formule });

  if (filters.mairie === "oui") where.push({ attendingMairie: true });
  if (filters.mairie === "non") where.push({ attendingMairie: false });

  if (filters.logement === "aucun") where.push({ lodging: null });
  else if (filters.logement) where.push({ lodging: filters.logement });

  if (filters.email === "avec") where.push({ email: { not: null } });
  if (filters.email === "sans") where.push({ email: null });

  return { AND: where };
}

export function guestListHref(filters: GuestFilters = {}): string {
  const params = new URLSearchParams();
  for (const key of GUEST_FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/admin/invites?${query}` : "/admin/invites";
}
