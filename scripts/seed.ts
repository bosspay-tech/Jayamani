import { createClient } from "@supabase/supabase-js";
import { seedCategories, seedProducts } from "../src/lib/seed/data";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seed() {
  console.log("Seeding categories (new only)...");

  const { error: categoriesError } = await supabase
    .from("categories")
    .upsert(seedCategories, { onConflict: "slug", ignoreDuplicates: false });

  if (categoriesError) {
    throw new Error(`Categories failed: ${categoriesError.message}`);
  }

  const { data: categories, error: fetchError } = await supabase
    .from("categories")
    .select("id, slug");

  if (fetchError || !categories) {
    throw new Error(`Could not fetch categories: ${fetchError?.message}`);
  }

  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  console.log("Seeding products (new only — existing uploads are kept)...");

  const products = seedProducts.map((product) => {
    const { category_slug, ...rest } = product;
    return {
      ...rest,
      category_id: categoryMap.get(category_slug) ?? null,
      stock: 100,
    };
  });

  const { error: productsError } = await supabase
    .from("products")
    .upsert(products, { onConflict: "slug", ignoreDuplicates: true });

  if (productsError) {
    throw new Error(`Products failed: ${productsError.message}`);
  }

  console.log(
    `Done! Categories updated. Products only added if slug does not exist yet.`
  );
  console.log("Your admin-uploaded product images are never overwritten.");
}

seed().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
