import { createServerFn } from "@tanstack/react-start";

import {
  seedCategories,
  seedProducts,
  seedOffers,
  seedRestaurantSettings,
  seedSocialLinks,
  seedThemeSettings,
} from "./seed-data";

/**
 * Idempotently seed the full demo restaurant into an EMPTY database.
 *
 * Why this exists (and not a SQL migration): a Lovable remix takes a schema
 * snapshot of the master — which carries over the `schema_migrations` history —
 * but does NOT copy table row data. The seed migration is therefore marked as
 * "already applied" on a fresh remix and its INSERTs never run, leaving the
 * remix with the full schema but empty tables. Application CODE, however, IS
 * copied on remix, so seeding from code is the only reliable path.
 *
 * Runs server-side with the service-role admin client (available on the
 * Lovable-hosted remix) so it bypasses RLS. It only ever writes when the
 * database is empty, so it is a safe no-op on the populated master and on
 * subsequent loads.
 */
export const ensureDemoSeed = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Only seed a genuinely empty database (fresh remix). If settings already
  // exist, the demo — or the owner's real content — is present: do nothing.
  const { count, error: countError } = await supabaseAdmin
    .from("restaurant_settings")
    .select("*", { count: "exact", head: true });

  if (countError) {
    // Admin client unavailable (e.g. external host without service role) or a
    // transient error — fail soft so the public menu still renders.
    return { seeded: false, reason: countError.message };
  }
  if ((count ?? 0) > 0) return { seeded: false, reason: "already populated" };

  // Insert in FK-safe order. ignoreDuplicates keeps this fully idempotent even
  // if two first-load requests race each other.
  const upsert = (table: string, rows: unknown) =>
    supabaseAdmin.from(table as never).upsert(rows as never, {
      onConflict: "id",
      ignoreDuplicates: true,
    });

  await upsert("restaurant_settings", seedRestaurantSettings);
  await upsert("social_links", seedSocialLinks);
  await upsert("theme_settings", seedThemeSettings);
  await upsert("categories", seedCategories as unknown);
  await upsert("products", seedProducts as unknown);
  await upsert("offers", seedOffers as unknown);

  return { seeded: true };
});
