import { Envelope } from "@/components/envelope";
import { SaveTheDateCard } from "@/components/save-the-date";
import { CodeForm } from "@/components/code-form";
import { formatDate, getSettings } from "@/lib/settings";

// Rendu à la demande : la page « Save the Date » lit les réglages en base à
// chaque visite, pour refléter immédiatement les changements du back-office.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await getSettings();
  const dateLabel = formatDate(settings.weddingDate, false) || "à venir";

  return (
    <main className="bg-wedding min-h-screen flex flex-col items-center justify-center gap-12 px-4 py-16">
      <Envelope>
        <SaveTheDateCard
          coupleNames={settings.coupleNames}
          dateLabel={dateLabel}
        >
          <p className="text-muted-foreground text-sm mt-4">
            Plus de détails à venir…
          </p>
        </SaveTheDateCard>
      </Envelope>

      <CodeForm />
    </main>
  );
}
