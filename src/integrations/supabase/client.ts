import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/** The browser receives only the public Supabase URL and publishable key. */
function createSupabaseClient() {
  const server = typeof window === "undefined";
  const url = import.meta.env.VITE_SUPABASE_URL || (server ? process.env.SUPABASE_URL : undefined);
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || (server ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);

  if (!url || !key) {
    console.error("[Supabase] Public Supabase configuration is incomplete.");
    throw new Error("Le service est temporairement indisponible. Veuillez réessayer plus tard.");
  }

  return createClient<Database>(url, key, {
    auth: {
      storage: server ? undefined : window.localStorage,
      persistSession: !server,
      autoRefreshToken: !server,
    },
  });
}

let client: ReturnType<typeof createSupabaseClient> | undefined;
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, property, receiver) {
    if (!client) client = createSupabaseClient();
    return Reflect.get(client, property, receiver);
  },
});
