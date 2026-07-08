import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAdminT } from "@/lib/admin-i18n";

export type SoftTable = "products" | "categories";

/**
 * Trash lifecycle for a soft-deletable table: move to Trash (with an inline
 * Undo toast), restore, and permanently purge. Keeps both the active list and
 * the Trash list caches in sync.
 */
export function useTrashActions(table: SoftTable) {
  const qc = useQueryClient();
  const t = useAdminT();

  const invalidate = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: [table] }),
      qc.invalidateQueries({ queryKey: ["trash", table] }),
    ]);
  };

  async function setDeleted(ids: string[], value: string | null) {
    // Concrete-but-unioned table name; cast keeps the payload type simple.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table) as any)
      .update({ deleted_at: value })
      .in("id", ids);
    if (error) throw error;
  }

  async function restore(ids: string[]) {
    try {
      await setDeleted(ids, null);
      await invalidate();
      toast.success(ids.length > 1 ? `${t("restored")} (${ids.length})` : t("restored"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function softDelete(ids: string[]) {
    if (!ids.length) return;
    try {
      await setDeleted(ids, new Date().toISOString());
      await invalidate();
      toast.success(ids.length > 1 ? `${t("itemDeleted")} (${ids.length})` : t("itemDeleted"), {
        action: { label: t("undo"), onClick: () => void restore(ids) },
        duration: 6000,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      throw e;
    }
  }

  async function purge(ids: string[]) {
    if (!ids.length) return;
    const { error } = await supabase.from(table).delete().in("id", ids);
    if (error) throw error;
    await invalidate();
    toast.success(
      ids.length > 1 ? `${t("deletedPermanently")} (${ids.length})` : t("deletedPermanently"),
    );
  }

  return { softDelete, restore, purge };
}
