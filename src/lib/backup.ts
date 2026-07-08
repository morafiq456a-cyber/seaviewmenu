import { supabase } from "@/integrations/supabase/client";

/**
 * Backup / restore engine. Powers the Import/Export admin page.
 * Because this project is duplicated per-customer, a single JSON file can carry
 * the entire restaurant (settings, appearance, categories, products, offers).
 */

export const BACKUP_VERSION = 1;

export type BackupSection =
  | "restaurant"
  | "social"
  | "appearance"
  | "categories"
  | "products"
  | "offers";

export interface BackupFile {
  version: number;
  exportedAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  restaurant?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  social?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  appearance?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offers?: any[];
}

/** Build a backup object containing only the requested sections. */
export async function buildBackup(sections: BackupSection[]): Promise<BackupFile> {
  const out: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
  };

  if (sections.includes("restaurant")) {
    const { data } = await supabase.from("restaurant_settings").select("*").limit(1).maybeSingle();
    out.restaurant = data ?? null;
  }
  if (sections.includes("social")) {
    const { data } = await supabase.from("social_links").select("*").limit(1).maybeSingle();
    out.social = data ?? null;
  }
  if (sections.includes("appearance")) {
    const { data } = await supabase.from("theme_settings").select("*").limit(1).maybeSingle();
    out.appearance = data ?? null;
  }
  if (sections.includes("categories")) {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    out.categories = data ?? [];
  }
  if (sections.includes("products")) {
    const { data } = await supabase.from("products").select("*").order("sort_order");
    out.products = data ?? [];
  }
  if (sections.includes("offers")) {
    const { data } = await supabase.from("offers").select("*").order("sort_order");
    out.offers = data ?? [];
  }

  return out;
}

/** Trigger a browser download of a JSON backup. */
export function downloadBackup(backup: BackupFile, filename: string): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Restore a backup file. Replaces the sections that are present in the file. */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  if (!backup || typeof backup !== "object") throw new Error("Invalid backup file");

  // Singletons — upsert onto the existing row.
  if (backup.restaurant) {
    const { data: existing } = await supabase
      .from("restaurant_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    const row = { ...backup.restaurant, id: existing?.id ?? backup.restaurant.id };
    const { error } = await supabase.from("restaurant_settings").upsert(row);
    if (error) throw error;
  }
  if (backup.social) {
    const { data: existing } = await supabase
      .from("social_links")
      .select("id")
      .limit(1)
      .maybeSingle();
    const row = { ...backup.social, id: existing?.id ?? backup.social.id };
    const { error } = await supabase.from("social_links").upsert(row);
    if (error) throw error;
  }
  if (backup.appearance) {
    const { data: existing } = await supabase
      .from("theme_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    const row = { ...backup.appearance, id: existing?.id ?? backup.appearance.id };
    const { error } = await supabase.from("theme_settings").upsert(row);
    if (error) throw error;
  }

  // Collections — replace entirely. Delete children before parents (FK order).
  if (backup.products) {
    await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
  if (backup.offers) {
    await supabase.from("offers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }
  if (backup.categories) {
    await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (backup.categories.length) {
      const { error } = await supabase.from("categories").insert(backup.categories);
      if (error) throw error;
    }
  }
  if (backup.products && backup.products.length) {
    const { error } = await supabase.from("products").insert(backup.products);
    if (error) throw error;
  }
  if (backup.offers && backup.offers.length) {
    const { error } = await supabase.from("offers").insert(backup.offers);
    if (error) throw error;
  }
}
