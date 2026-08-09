import "server-only";

/**
 * Géocodage via Nominatim (OpenStreetMap). Utilisé une poignée de fois depuis
 * le back-office pour convertir une adresse en coordonnées, jamais dans le
 * rendu des pages invité : le résultat est stocké en base.
 *
 * Nominatim impose un User-Agent identifiant et une requête par seconde ;
 * l'usage manuel depuis un formulaire reste très en deçà.
 */
export type GeocodeResult =
  | { ok: true; coords: string; label: string }
  | { ok: false; error: string };

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const query = address.trim();
  if (!query) return { ok: false, error: "Renseignez d'abord une adresse." };

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "louiseetjulien-wedding-site/1.0",
        "Accept-Language": "fr",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `OpenStreetMap a répondu ${response.status}.`,
      };
    }

    const results = (await response.json()) as {
      lat?: string;
      lon?: string;
      display_name?: string;
    }[];

    const first = results[0];
    if (!first?.lat || !first?.lon) {
      return { ok: false, error: "Adresse introuvable sur OpenStreetMap." };
    }

    // 5 décimales ≈ 1 m, largement suffisant et plus lisible.
    const lat = Number(first.lat).toFixed(5);
    const lon = Number(first.lon).toFixed(5);

    return {
      ok: true,
      coords: `${lat},${lon}`,
      label: first.display_name ?? query,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Impossible de joindre OpenStreetMap : ${error.message}`
          : "Impossible de joindre OpenStreetMap.",
    };
  }
}
