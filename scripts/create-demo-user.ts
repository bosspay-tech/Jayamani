import { createClient } from "@supabase/supabase-js";

function getCredentials() {
  const email =
    process.env.DEMO_LOGIN_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL?.trim();
  const password =
    process.env.DEMO_LOGIN_PASSWORD?.trim() ||
    process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD?.trim();

  if (!email || !password) {
    throw new Error(
      "Set DEMO_LOGIN_EMAIL and DEMO_LOGIN_PASSWORD (or NEXT_PUBLIC_DEMO_LOGIN_* ) in .env"
    );
  }

  return { email: email.toLowerCase(), password };
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const { email, password } = getCredentials();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: listed, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existing = listed.users.find(
    (user) => user.email?.toLowerCase() === email
  );

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...existing.user_metadata,
        full_name: existing.user_metadata?.full_name ?? "Demo User",
      },
    });

    if (error) throw error;

    await supabase.from("profiles").upsert(
      {
        id: existing.id,
        full_name: "Demo User",
        is_admin: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    console.log(`Updated demo user password for ${email}`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Demo User" },
  });

  if (error) throw error;
  if (!data.user) throw new Error("Failed to create demo user.");

  await supabase.from("profiles").upsert(
    {
      id: data.user.id,
      full_name: "Demo User",
      is_admin: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  console.log(`Created demo user ${email}`);
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exit(1);
});
