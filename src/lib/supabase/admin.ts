import { createClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isNewSecretKey(key: string): boolean {
  return key.startsWith("sb_secret_");
}

/**
 * New sb_secret_* keys must only be sent in the apikey header.
 * PostgREST rejects them when placed in Authorization: Bearer.
 */
function createAdminFetch(serviceRoleKey: string): typeof fetch {
  return async (input, init) => {
    if (!isNewSecretKey(serviceRoleKey)) {
      return fetch(input, init);
    }

    const headers = new Headers(init?.headers);
    headers.delete("Authorization");

    return fetch(input, { ...init, headers });
  };
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase service role configuration.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: createAdminFetch(key),
    },
  });
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
