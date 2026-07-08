import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createSupabaseFetch, getSupabaseEnvConfig } from "@/lib/supabase-config";

const BUCKET = "menu-media";

let _client: ReturnType<typeof createClient<Database>> | undefined;

/**
 * Server-side, read-only Supabase client using the PUBLISHABLE (anon) key.
 * The "menu-media" bucket has a public SELECT policy, so the anon key is
 * enough to stream objects. This deliberately avoids the service-role key,
 * which is managed by Lovable Cloud and cannot be provided on external hosts
 * such as Vercel — using it here is what broke images on Vercel.
 */
function getPublicClient() {
  if (_client) return _client;

  const { url, publishableKey } = getSupabaseEnvConfig();

  _client = createClient<Database>(url, publishableKey, {
    global: { fetch: createSupabaseFetch(publishableKey) },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/**
 * Public read-only image proxy for the private "menu-media" bucket.
 * Streams objects with long-lived cache headers so customer menus can
 * reference stable URLs like /api/public/media/products/uuid.webp
 *
 * Standard TanStack Start server route — deploys as a serverless function on
 * both Lovable and Vercel. Requires only SUPABASE_URL + SUPABASE_PUBLISHABLE_KEY.
 */
export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = params._splat ?? "";
        if (!path || path.includes("..")) {
          return new Response("Not found", { status: 404 });
        }

        // Bundled demo images (public/seed/*) are shipped in the repo so that a
        // freshly remixed project — whose storage bucket starts empty — still
        // shows the full demo menu. Serve them from the static file first; this
        // makes remixes work without any storage upload step.
        if (path.startsWith("seed/")) {
          const staticRes = await fetch(new URL(`/${path}`, request.url));
          if (staticRes.ok) {
            const buffer = await staticRes.arrayBuffer();
            return new Response(buffer, {
              status: 200,
              headers: {
                "content-type": staticRes.headers.get("content-type") || "image/jpeg",
                "cache-control": "public, max-age=31536000, immutable",
              },
            });
          }
        }

        try {
          const supabase = getPublicClient();
          const { data, error } = await supabase.storage.from(BUCKET).download(path);

          if (error || !data) {
            return new Response("Not found", { status: 404 });
          }

          const contentType = data.type || "image/webp";
          const buffer = await data.arrayBuffer();

          return new Response(buffer, {
            status: 200,
            headers: {
              "content-type": contentType,
              "cache-control": "public, max-age=31536000, immutable",
            },
          });
        } catch {
          return new Response("Image service unavailable", { status: 500 });
        }
      },
    },
  },
});
