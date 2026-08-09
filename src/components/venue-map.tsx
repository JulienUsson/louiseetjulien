import { ExternalLink, MapPin } from "lucide-react";

import { osmEmbedUrl, osmLinkUrl, parseCoords } from "@/lib/settings-fields";

/**
 * Un lieu de la journée : horaire, adresse, et carte OpenStreetMap quand des
 * coordonnées sont renseignées. Sans coordonnées, l'adresse en texte reste
 * affichée — la carte est un bonus, jamais un prérequis.
 */
export function VenueBlock({
  label,
  time,
  place,
  address,
  coords: rawCoords,
  note,
}: {
  label: string;
  time?: string;
  place?: string;
  address?: string;
  coords?: string;
  note?: string;
}) {
  if (!place && !address) return null;

  const coords = rawCoords ? parseCoords(rawCoords) : null;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex gap-3 p-4">
        <MapPin className="mt-0.5 size-4 shrink-0 text-orange-500" />
        <div className="min-w-0 text-sm">
          <div className="font-medium">
            {label}
            {time && (
              <span className="ml-2 font-normal text-muted-foreground">
                {time}
              </span>
            )}
          </div>
          {place && <div className="mt-0.5">{place}</div>}
          {address && (
            <div className="text-muted-foreground">{address}</div>
          )}
          {note && (
            <div className="mt-1 text-xs text-muted-foreground">{note}</div>
          )}
          {coords && (
            <a
              href={osmLinkUrl(coords)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-rose-600 underline underline-offset-4"
            >
              Ouvrir dans OpenStreetMap
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>

      {coords && (
        <iframe
          src={osmEmbedUrl(coords)}
          title={`Carte — ${label}`}
          loading="lazy"
          className="block h-56 w-full border-0 border-t"
          // Pas de `sandbox` : la visionneuse d'OpenStreetMap a besoin de son
          // propre origine (stockage local, tuiles), et un bac à sable sans
          // `allow-same-origin` la casse. C'est aussi ce que produit le
          // « Partager » d'OSM. Le referrer, lui, ne lui sert à rien.
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
