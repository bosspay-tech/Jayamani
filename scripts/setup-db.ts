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
    console.error("Missing database connection.");
    console.error("");
    console.error("Add to your .env file (from Supabase → Project Settings → Database):");
    console.error("  SUPABASE_DB_PASSWORD=your_database_password");
    console.error("");
    console.error("Or paste the full connection string as:");
    console.error("  DATABASE_URL=postgresql://...");
    console.error("");
    console.error(
      "Manual setup: run supabase/schema.sql in the SQL Editor:"
    );
    console.error(
      "  https://supabase.com/dashboard/project/_/sql"
    );
    process.exit(1);
  }

  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@${poolerHost}:5432/postgres`;
}

async function setup() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  const schemaPath = resolve(__dirname, "../supabase/schema.sql");
  const sql = readFileSync(schemaPath, "utf8");

  console.log("Running database schema...");
  await client.query(sql);
  await client.end();

  console.log("Database schema applied successfully.");
}

setup().catch((error) => {
  console.error("Setup failed:", error.message);
  console.error("");
  console.error(
    "If this keeps failing, open Supabase SQL Editor and run supabase/schema.sql manually."
  );
  process.exit(1);
});
