import { createAdminClient } from "@/lib/supabase/admin";

type Mode = "nearest" | "up" | "down";
type Strategy = "duplicate-bump" | "round";

type ProductRow = {
  id: string;
  name: string;
  price: number;
};

type PriceChange = {
  id: string;
  name: string;
  from: number;
  to: number;
  reason: "bump" | "round";
  priceGroup: number;
};

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

function parseStrategy(raw: string | undefined): Strategy {
  const strategy = (raw ?? "duplicate-bump").toLowerCase();
  if (strategy === "duplicate-bump" || strategy === "round") return strategy;
  throw new Error(`Invalid --strategy "${raw}". Use duplicate-bump|round.`);
}

function parsePercent(raw: string | undefined): number {
  const percent = raw ? Number(raw) : 40;
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
    throw new Error(`Invalid --bump-percent "${raw}". Use a number between 1 and 99.`);
  }
  return percent;
}

function parseBump(raw: string | undefined): number {
  const bump = raw ? Number(raw) : 50;
  if (!Number.isFinite(bump) || bump <= 0) {
    throw new Error(`Invalid --bump "${raw}". Use a positive number like 50.`);
  }
  return bump;
}

function buildRoundChanges(
  products: ProductRow[],
  step: number,
  mode: Mode
): PriceChange[] {
  const changes: PriceChange[] = [];

  for (const product of products) {
    const price = Number(product.price);
    if (!Number.isFinite(price)) continue;

    const next = roundTo(price, step, mode);
    if (next !== price) {
      changes.push({
        id: product.id,
        name: product.name,
        from: price,
        to: next,
        reason: "round",
        priceGroup: price,
      });
    }
  }

  return changes;
}

function buildDuplicateBumpChanges(
  products: ProductRow[],
  bumpAmount: number,
  bumpPercent: number
): {
  changes: PriceChange[];
  groups: {
    price: number;
    total: number;
    bumped: number;
    unchanged: number;
  }[];
} {
  const byPrice = new Map<number, ProductRow[]>();

  for (const product of products) {
    const price = Number(product.price);
    if (!Number.isFinite(price)) continue;

    const group = byPrice.get(price) ?? [];
    group.push(product);
    byPrice.set(price, group);
  }

  const changes: PriceChange[] = [];
  const groups: {
    price: number;
    total: number;
    bumped: number;
    unchanged: number;
  }[] = [];

  for (const [price, group] of byPrice) {
    if (group.length < 2) continue;

    const sorted = [...group].sort((a, b) => a.id.localeCompare(b.id));
    const bumpCount = Math.round(sorted.length * (bumpPercent / 100));
    const bumped = Math.min(Math.max(bumpCount, 0), sorted.length);
    const unchanged = sorted.length - bumped;

    groups.push({
      price,
      total: sorted.length,
      bumped,
      unchanged,
    });

    for (let index = 0; index < sorted.length; index++) {
      const product = sorted[index];
      const shouldBump = index < bumped;
      if (!shouldBump) continue;

      changes.push({
        id: product.id,
        name: product.name,
        from: price,
        to: price + bumpAmount,
        reason: "bump",
        priceGroup: price,
      });
    }
  }

  return { changes, groups };
}

async function main() {
  const strategy = parseStrategy(getArg("strategy"));
  const step = parseStep(getArg("step"));
  const mode = parseMode(getArg("mode"));
  const bumpAmount = parseBump(getArg("bump"));
  const bumpPercent = parsePercent(getArg("bump-percent"));
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

  const rows = (products ?? []) as ProductRow[];

  const duplicateResult =
    strategy === "duplicate-bump"
      ? buildDuplicateBumpChanges(rows, bumpAmount, bumpPercent)
      : { changes: [] as PriceChange[], groups: [] };

  const changes =
    strategy === "round"
      ? buildRoundChanges(rows, step, mode)
      : duplicateResult.changes;

  console.log(
    JSON.stringify(
      {
        strategy,
        bumpAmount: strategy === "duplicate-bump" ? bumpAmount : undefined,
        bumpPercent: strategy === "duplicate-bump" ? bumpPercent : undefined,
        step: strategy === "round" ? step : undefined,
        mode: strategy === "round" ? mode : undefined,
        apply,
        scanned: rows.length,
        duplicatePriceGroups: duplicateResult.groups.length,
        groups: duplicateResult.groups.slice(0, 20),
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
