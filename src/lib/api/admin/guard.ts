import type { SupabaseClient } from "@supabase/supabase-js";
import { apiError } from "@/lib/api/response";
import { createRouteClient } from "@/lib/supabase/route";

interface AdminContext {
  supabase: SupabaseClient;
  userId: string;
}

export async function requireAdmin() {
  const supabase = await createRouteClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: apiError("Unauthorized.", 401), context: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return { error: apiError("Admin access required.", 403), context: null };
  }

  const context: AdminContext = { supabase, userId: user.id };
  return { error: null, context };
}
