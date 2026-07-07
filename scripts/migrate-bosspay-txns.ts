import { readFileSync } from "fs";
import { resolve } from "path";
import pg from "pg";

const { Client } = pg;

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const poolerHost =
    process.env.SUPABASE_DB_HOST ?? "aws-1-us-east-1.pooler.supabase.com";

  if (!supabaseUrl || !password) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASSWORD in .env");
  }

  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${poolerHost}:5432/postgres`;
}

async function migrate() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const sql = readFileSync(
    resolve(__dirname, "../supabase/migrations/add_bosspay_txns.sql"),
    "utf8"
  );

  console.log("Applying bosspay_txns migration...");
  await client.query(sql);

  const check = await client.query(
    "select to_regclass('public.bosspay_txns') as table_name"
  );

  await client.end();
  console.log("Done. Table exists:", check.rows[0]?.table_name === "bosspay_txns");
}

migrate().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
