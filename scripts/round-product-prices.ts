import { createAdminClient } from "@/lib/supabase/admin";

type Mode = "nearest" | "up" | "down";

function getArg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function roundTo(value: number, step: number, mode: Mode): number {
  if (step <= 0) return value;
  const ratio = value / step;
  const rounded =
    mode === "up" ? Math.ceil(ratio) : mode === "down" ? Math.floor(ratio) : Math.round(ratio);
  return rounded * step;
}

function parseStep(raw: string | undefined): number {
  const step = raw ? Number(raw) : 50;
  if (!Number.isFinite(step) || step <= 0) {
    throw new Error(`Invalid --step "${raw}". Use 50 or 100 (or any positive number).`);
  }
  return step;
}

function parseMode(raw: string | undefined): Mode {
  const mode = (raw ?? "nearest").toLowerCase();
  if (mode === "nearest" || mode === "up" || mode === "down") return mode;
  throw new Error(`Invalid --mode "${raw}". Use nearest|up|down.`);
}

async function main() {
  const step = parseStep(getArg("step"));
  const mode = parseMode(getArg("mode"));
  const apply = hasFlag("apply");
  const limit = getArg("limit") ? Number(getArg("limit")) : undefined;

  const admin = createAdminClient();

  const { data: products, error } = await admin
    .from("products")
    .select("id, name, price, compare_at_price")
    .order("created_at", { ascending: false })
    .limit(limit && Number.isFinite(limit) ? limit : 10000);

  if (error) {
    throw new Error(error.message);
  }

  const changes: { id: string; name: string; from: number; to: number }[] = [];

  for (const product of products ?? []) {
    const price = Number(product.price);
    if (!Number.isFinite(price)) continue;
    const next = roundTo(price, step, mode);
    if (next !== price) {
      changes.push({ id: product.id, name: product.name, from: price, to: next });
    }
  }

  console.log(
    JSON.stringify(
      {
        step,
        mode,
        apply,
        scanned: products?.length ?? 0,
        changes: changes.length,
        sample: changes.slice(0, 25),
      },
      null,
      2
    )
  );

  if (!apply) {
    console.log("\nDry run only. Re-run with --apply to update prices in Supabase.");
    return;
  }

  // Update in small batches to avoid huge payloads/timeouts.
  const batchSize = 50;
  for (let i = 0; i < changes.length; i += batchSize) {
    const batch = changes.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (change) => {
        const { error: updateError } = await admin
          .from("products")
          .update({ price: change.to })
          .eq("id", change.id);
        if (updateError) {
          throw new Error(`Failed updating ${change.id}: ${updateError.message}`);
        }
      })
    );
    console.log(`Updated ${Math.min(i + batchSize, changes.length)}/${changes.length}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

