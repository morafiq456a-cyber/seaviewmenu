type RuntimeSupabaseConfig = {
  url?: string;
  publishableKey?: string;
  projectId?: string;
};

declare global {
  interface Window {
    __SUPABASE_CONFIG__?: RuntimeSupabaseConfig;
  }
}

const PUBLIC_ENV_NAMES = new Set([
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_PROJECT_ID",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_PROJECT_ID",
]);

function readProcessEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env?.[name];
}

function stripAccidentalAssignment(value: string): string {
  const match = value.match(/^([A-Z][A-Z0-9_]*)\s*=\s*([\s\S]*)$/);
  if (!match) return value;
  return PUBLIC_ENV_NAMES.has(match[1]) ? match[2] : value;
}

export function cleanPublicEnvValue(value: string | null | undefined): string {
  if (!value) return "";

  let cleaned = stripAccidentalAssignment(value).trim();

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Handles values copied from documentation lines such as:
  // SUPABASE_PUBLISHABLE_KEY=eyJ...   # public anon key
  cleaned = cleaned.replace(/\s+#.*$/, "").trim();

  return cleaned;
}

function normalizeSupabaseUrl(value: string): string {
  const cleaned = cleanPublicEnvValue(value).replace(/\/+$/, "");
  try {
    const url = new URL(cleaned);
    if (url.protocol !== "https:") throw new Error("Supabase URL must use HTTPS");
    return url.toString().replace(/\/+$/, "");
  } catch {
    throw new Error("Invalid SUPABASE_URL / VITE_SUPABASE_URL value.");
  }
}

function normalizePublishableKey(value: string): string {
  const cleaned = cleanPublicEnvValue(value);
  if (!cleaned) return "";
  if (/\s/.test(cleaned) || cleaned.includes("…") || cleaned.includes("...")) {
    throw new Error("Invalid SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_PUBLISHABLE_KEY value.");
  }
  return cleaned;
}

function projectIdFromUrl(url: string): string {
  try {
    return new URL(url).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (token.split(".").length !== 3) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

export function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get("Authorization") === `Bearer ${supabaseKey}`) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export function getBrowserSupabaseConfig(): RuntimeSupabaseConfig | undefined {
  if (typeof window === "undefined") return undefined;
  return window.__SUPABASE_CONFIG__;
}

export function getSupabaseEnvConfig(): Required<RuntimeSupabaseConfig> {
  const browserConfig = getBrowserSupabaseConfig();
  const isBrowser = typeof window !== "undefined";
  const rawUrl = isBrowser
    ? (browserConfig?.url ??
      import.meta.env.VITE_SUPABASE_URL ??
      readProcessEnv("SUPABASE_URL") ??
      readProcessEnv("VITE_SUPABASE_URL") ??
      "")
    : (readProcessEnv("SUPABASE_URL") ??
      readProcessEnv("VITE_SUPABASE_URL") ??
      import.meta.env.VITE_SUPABASE_URL ??
      "");
  const rawKey = isBrowser
    ? (browserConfig?.publishableKey ??
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      readProcessEnv("SUPABASE_PUBLISHABLE_KEY") ??
      readProcessEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
      "")
    : (readProcessEnv("SUPABASE_PUBLISHABLE_KEY") ??
      readProcessEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      "");

  const url = normalizeSupabaseUrl(rawUrl);
  const publishableKey = normalizePublishableKey(rawKey);
  const projectId = cleanPublicEnvValue(
    isBrowser
      ? (browserConfig?.projectId ??
          import.meta.env.VITE_SUPABASE_PROJECT_ID ??
          readProcessEnv("SUPABASE_PROJECT_ID") ??
          readProcessEnv("VITE_SUPABASE_PROJECT_ID") ??
          projectIdFromUrl(url))
      : (readProcessEnv("SUPABASE_PROJECT_ID") ??
          readProcessEnv("VITE_SUPABASE_PROJECT_ID") ??
          import.meta.env.VITE_SUPABASE_PROJECT_ID ??
          projectIdFromUrl(url)),
  );

  if (!url || !publishableKey) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!publishableKey ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}.`);
  }

  const jwtPayload = decodeJwtPayload(publishableKey);
  if (jwtPayload) {
    if (jwtPayload.role !== "anon") {
      throw new Error("Invalid Supabase publishable key: expected the anon role key.");
    }
    if (typeof jwtPayload.ref === "string" && jwtPayload.ref !== projectIdFromUrl(url)) {
      throw new Error("Supabase URL and publishable key belong to different projects.");
    }
  }

  return { url, publishableKey, projectId };
}

export function getSupabaseRuntimeConfigScript(): string {
  const existing = getBrowserSupabaseConfig();
  const config = existing ?? {
    url: cleanPublicEnvValue(readProcessEnv("SUPABASE_URL") ?? readProcessEnv("VITE_SUPABASE_URL")),
    publishableKey: cleanPublicEnvValue(
      readProcessEnv("SUPABASE_PUBLISHABLE_KEY") ?? readProcessEnv("VITE_SUPABASE_PUBLISHABLE_KEY"),
    ),
    projectId: cleanPublicEnvValue(
      readProcessEnv("SUPABASE_PROJECT_ID") ?? readProcessEnv("VITE_SUPABASE_PROJECT_ID"),
    ),
  };

  return `window.__SUPABASE_CONFIG__=${JSON.stringify(config).replace(/</g, "\\u003c")};`;
}
