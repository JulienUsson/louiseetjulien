import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Réglages</h1>
        <p className="text-muted-foreground mt-1">
          Ces informations alimentent la page d&apos;accueil, la page de chaque
          invité et les emails.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
