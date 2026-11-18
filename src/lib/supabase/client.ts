import type { SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when this build has Supabase settings (accounts, cloud storage, cross-device rounds). */
export const supabaseConfigured = !!(URL && KEY);

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * The one Supabase client for the app (auth sessions, database, realtime).
 * Loaded on demand so pages that never need it don't download it.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!supabaseConfigured) return Promise.reject(new Error("Supabase is not configured"));
  clientPromise ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(URL!, KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Confirmation and reset links come back with tokens in the URL; any browser can open them.
        detectSessionInUrl: true,
        flowType: "implicit",
        storageKey: "llce:supabase-auth",
      },
      realtime: { params: { eventsPerSecond: 20 } },
    }),
  );
  return clientPromise;
}
