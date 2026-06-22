import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { slugify } from "../src/lib/utils";
import {
  allImages,
  cleanHtml,
  firstImage,
  getVariationPrices,
  parseCsv,
  parsePrice,
  parseStock,
  type CsvRow,
} from "./lib/csv";

const IMPORTABLE_TYPES = new Set(["simple", "variable"]);

const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  saree: "sarees",
  sarees: "sarees",
  "t-shirts": "t-shirts",
  "t-shirt": "t-shirts",
  tshirts: "t-shirts",
  jeans: "jeans",
  kurtis: "ethnic-wear",
  kurti: "ethnic-wear",
  kurta: "ethnic-wear",
  "ethnic wear": "ethnic-wear",
};

type CategoryRef = { id: string; slug: string };
type DbProduct = {
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  images: string[];
  badge: string | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_popular: boolean;
  stock: number;
};

function getArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    onlyNew: args.includes("--only-new"),
    limit: (() => {
      const index = args.indexOf("--limit");
      if (index === -1 || !args[index + 1]) return null;
      const value = Number(args[index + 1]);
      return Number.isFinite(value) && value > 0 ? value : null;
    })(),
    file: (() => {
      const index = args.indexOf("--file");
      return index !== -1 && args[index + 1]
        ? resolve(process.cwd(), args[index + 1])
        : resolve(process.cwd(), "products.csv");
    })(),
  };
}

function leafCategoryName(categories: string): string {
  const firstPath = categories.split(",")[0]?.trim() ?? "";
  const parts = firstPath
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts[parts.length - 1] ?? firstPath;
}

function categorySlugFromPath(categories: string): string {
  const leaf = leafCategoryName(categories);
  const normalized = leaf.toLowerCase();
  const alias = CATEGORY_SLUG_ALIASES[normalized];
  return alias ?? slugify(leaf);
}

function categoryDisplayName(categories: string): string {
  const leaf = leafCategoryName(categories);
  return leaf || "Uncategorized";
}

function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.replace(/\\/g, "").trim().toUpperCase())
    .filter(Boolean);
}

function resolvePrices(
  row: CsvRow,
  variationPrices: Map<string, { regularPrice: number | null; salePrice: number | null }>,
) {
  const fallback = variationPrices.get(row.ID);
  const regularPrice = parsePrice(row["Regular price"]) ?? fallback?.regularPrice ?? null;
  const salePrice = parsePrice(row["Sale price"]) ?? fallback?.salePrice ?? null;
  const price = salePrice ?? regularPrice ?? 0;
  const compareAt =
    regularPrice && salePrice && salePrice < regularPrice ? regularPrice : null;

  return { price, compareAt };
}

function makeBadge(price: number, compareAt: number | null): string | null {
  if (!compareAt || compareAt <= price) return null;
  const percent = Math.round(((compareAt - price) / compareAt) * 100);
  return percent > 0 ? `-${percent}%` : null;
}

function makeSlug(name: string, csvId: string, sku: string, usedSlugs: Set<string>): string {
  const base = slugify(name) || `product-${csvId}`;
  const candidates = [base];

  if (sku) {
    candidates.push(`${base}-${slugify(sku)}`);
  }
  candidates.push(`${base}-${csvId}`);

  for (const candidate of candidates) {
    if (!usedSlugs.has(candidate)) {
      usedSlugs.add(candidate);
      return candidate;
    }
  }

  let counter = 2;
  while (usedSlugs.has(`${base}-${counter}`)) {
    counter += 1;
  }

  const slug = `${base}-${counter}`;
  usedSlugs.add(slug);
  return slug;
}

function rowToProduct(
  row: CsvRow,
  variationPrices: Map<string, { regularPrice: number | null; salePrice: number | null }>,
  categoryId: string | null,
  usedSlugs: Set<string>,
): DbProduct | null {
  if (!IMPORTABLE_TYPES.has(row.Type)) return null;
  if (row.Published !== "1") return null;

  const name = row.Name?.trim();
  const image = firstImage(row.Images);
  const { price, compareAt } = resolvePrices(row, variationPrices);

  if (!name || !image || price <= 0) return null;

  const tags = parseTags(row.Tags ?? "");
  const shortDescription = cleanHtml(row["Short description"] ?? "");
  const description = cleanHtml(row.Description ?? "");
  const stock = parseStock(row.Stock) ?? 100;

  return {
    category_id: categoryId,
    name,
    slug: makeSlug(name, row.ID, row.SKU?.trim() ?? "", usedSlugs),
    description: shortDescription || description || null,
    price,
    compare_at_price: compareAt,
    image_url: image,
    images: allImages(row.Images),
    badge: makeBadge(price, compareAt),
    is_featured: row["Is featured?"] === "1",
    is_new_arrival: tags.some((tag) => tag.includes("NEW") || tag.includes("ARRIVAL")),
    is_popular: tags.some((tag) => tag.includes("BEST") || tag.includes("SELLER")),
    stock,
  };
}

async function main() {
  const { dryRun, onlyNew, limit, file } = getArgs();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  console.log(`Reading ${file}...`);
  const csv = readFileSync(file, "utf8");
  const rows = parseCsv(csv);
  const variationPrices = getVariationPrices(rows);
  const parentRows = limit ? rows.slice(0, limit * 3) : rows;

  const categoryDefs = new Map<string, { slug: string; name: string }>();

  for (const row of parentRows) {
    if (!IMPORTABLE_TYPES.has(row.Type) || row.Published !== "1") continue;
    const categories = row.Categories?.trim();
    if (!categories) continue;

    const slug = categorySlugFromPath(categories);
    if (!categoryDefs.has(slug)) {
      categoryDefs.set(slug, {
        slug,
        name: categoryDisplayName(categories),
      });
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const categoryRows = Array.from(categoryDefs.values()).map((category, index) => ({
    ...category,
    sort_order: index + 1,
  }));

  console.log(`Found ${categoryRows.length} categories to upsert.`);

  if (!dryRun) {
    const { error: categoryError } = await supabase
      .from("categories")
      .upsert(categoryRows, { onConflict: "slug" });

    if (categoryError) {
      throw new Error(`Categories failed: ${categoryError.message}`);
    }
  }

  const { data: categories, error: fetchCategoriesError } = dryRun
    ? { data: categoryRows.map((c, i) => ({ id: `dry-${i}`, slug: c.slug })), error: null }
    : await supabase.from("categories").select("id, slug, name");

  if (fetchCategoriesError || !categories) {
    throw new Error(`Could not load categories: ${fetchCategoriesError?.message}`);
  }

  const categoryMap = new Map(
    categories.map((category: CategoryRef) => [category.slug, category.id]),
  );
  const usedSlugs = new Set<string>();
  const products: DbProduct[] = [];

  for (const row of parentRows) {
    const categorySlug = row.Categories
      ? categorySlugFromPath(row.Categories)
      : "uncategorized";
    const categoryId = categoryMap.get(categorySlug) ?? null;
    const product = rowToProduct(row, variationPrices, categoryId, usedSlugs);

    if (product) {
      products.push(product);
    }

    if (limit && products.length >= limit) {
      break;
    }
  }

  console.log(`Prepared ${products.length} products for import.`);

  if (dryRun) {
    console.log("\nDry run sample (first 5):");
    for (const product of products.slice(0, 5)) {
      console.log(`- ${product.name} (${product.slug}) ₹${product.price}`);
    }
    console.log("\nNo changes written. Run without --dry-run to import.");
    return;
  }

  const batchSize = 100;
  let inserted = 0;

  for (let index = 0; index < products.length; index += batchSize) {
    const batch = products.slice(index, index + batchSize);
    const { error } = await supabase.from("products").upsert(batch, {
      onConflict: "slug",
      ignoreDuplicates: onlyNew,
    });

    if (error) {
      throw new Error(`Products batch ${index / batchSize + 1} failed: ${error.message}`);
    }

    inserted += batch.length;
    console.log(`Imported ${inserted}/${products.length}...`);
  }

  console.log(
    onlyNew
      ? `Done! Attempted to add ${products.length} products (existing slugs skipped).`
      : `Done! Imported ${products.length} products and ${categoryRows.length} categories.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
