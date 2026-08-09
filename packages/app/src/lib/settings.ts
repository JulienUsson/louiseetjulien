import "server-only";

import { prisma } from "@/lib/db";
import {
  SETTING_DEFAULTS,
  type Settings,
} from "@/lib/settings-fields";

export {
  SETTING_DEFAULTS,
  SETTING_FIELDS,
  formatDate,
  type SettingKey,
  type Settings,
} from "@/lib/settings-fields";

/** Réglages stockés en base, complétés par les valeurs par défaut. */
export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));

  return Object.fromEntries(
    Object.entries(SETTING_DEFAULTS).map(([key, fallback]) => [
      key,
      stored[key] ?? fallback,
    ]),
  ) as Settings;
}

export async function saveSettings(values: Partial<Settings>): Promise<void> {
  const entries = Object.entries(values).filter(
    ([key]) => key in SETTING_DEFAULTS,
  );

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: value ?? "" },
        update: { value: value ?? "" },
      }),
    ),
  );
}
