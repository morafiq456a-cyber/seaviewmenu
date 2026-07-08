import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type CrudTable =
  | "categories"
  | "products"
  | "offers"
  | "restaurant_settings"
  | "social_links"
  | "theme_settings";

/**
 * Generic create/update/delete mutations for a table, wired to invalidate the
 * matching TanStack Query cache key. RLS enforces admin-only writes.
 */
export function useCrud(table: CrudTable, queryKey: string) {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const save = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (row: any) => {
      const { error } = await supabase.from(table).upsert(row);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  return { save, remove };
}

/**
 * Persist a reordered / re-categorised list of rows. Each patch carries the
 * row id plus the columns that changed (sort_order and optionally category_id).
 * Uses upsert so a single round-trip saves the whole batch.
 */
export function useReorder(table: CrudTable, queryKey: string) {
  const qc = useQueryClient();
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (rows: Array<Record<string, any>>) => {
      if (!rows.length) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from(table).upsert(rows as any);
      if (error) throw error;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: [queryKey] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [queryKey] }),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });
}
