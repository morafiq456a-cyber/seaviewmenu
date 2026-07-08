import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Tracks the current Supabase auth session (client-side). */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

/** Checks whether the signed-in user has the admin role. */
export function useIsAdmin(enabled: boolean) {
  return useQuery({
    queryKey: ["is_admin"],
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<boolean> => {
      // First-registered user auto-claims admin (no-op if one already exists).
      await supabase.rpc("claim_admin");
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      return Boolean(data);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  }, [queryClient]);
}
