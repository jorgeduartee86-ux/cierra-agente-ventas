import { appSettingsSchema } from "./schema";

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

declare global {
  var __CIERRA_DB__: D1Database | undefined;
}

function getDatabase() {
  const database = globalThis.__CIERRA_DB__;
  if (!database) throw new Error("D1 database binding is unavailable.");
  return database;
}

async function ensureSchema() {
  await getDatabase().prepare(appSettingsSchema).run();
}

export async function getSetting(settingKey: string) {
  await ensureSchema();
  const row = await getDatabase()
    .prepare("SELECT setting_value FROM app_settings WHERE setting_key = ?")
    .bind(settingKey)
    .first<{ setting_value: string }>();
  return row?.setting_value || null;
}

export async function setSetting(settingKey: string, settingValue: string) {
  await ensureSchema();
  await getDatabase()
    .prepare(`INSERT INTO app_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(setting_key) DO UPDATE SET
        setting_value = excluded.setting_value,
        updated_at = excluded.updated_at`)
    .bind(settingKey, settingValue, Date.now())
    .run();
}
