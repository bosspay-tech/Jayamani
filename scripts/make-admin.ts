import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const email = process.argv[2];

async function grantAdminWithServiceRole(userId: string, fullName?: string | null) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName ?? null,
      is_admin: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase env vars.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const users = data.users;

  if (users.length === 0) {
    console.log("No registered users yet. Register at /register first.");
    return;
  }

  if (email) {
    const user = users.find(
      (item) => item.email?.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }

    await grantAdminWithServiceRole(
      user.id,
      (user.user_metadata?.full_name as string | undefined) ?? null
    );
    console.log(`Admin access granted to ${email}`);
    return;
  }

  for (const user of users) {
    await grantAdminWithServiceRole(
      user.id,
      (user.user_metadata?.full_name as string | undefined) ?? null
    );
    console.log(`Admin access granted to ${user.email}`);
  }
}

main().catch(async (error) => {
  if (email || !process.env.SUPABASE_DB_PASSWORD) {
    console.error(error.message);
    process.exit(1);
  }

  try {
    const password = process.env.SUPABASE_DB_PASSWORD!;
    const poolerHost =
      process.env.SUPABASE_DB_HOST ?? "aws-1-us-east-1.pooler.supabase.com";
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(
      "https://",
      ""
    ).split(".")[0];

    const client = new pg.Client({
      connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${poolerHost}:5432/postgres`,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();
    await client.query(`
      insert into profiles (id, full_name, is_admin)
      select id, raw_user_meta_data->>'full_name', true
      from auth.users
      on conflict (id) do update set is_admin = true, updated_at = now()
    `);
    await client.end();
    console.log("Admin access granted to all registered users.");
  } catch (fallbackError) {
    console.error((fallbackError as Error).message);
    process.exit(1);
  }
});
