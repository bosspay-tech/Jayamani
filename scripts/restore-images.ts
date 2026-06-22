import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function storageUrl(filename: string) {
  return `${baseUrl}/storage/v1/object/public/product-images/products/${filename}`;
}

async function main() {
  const { data: storage } = await supabase.storage
    .from("product-images")
    .list("products", { limit: 100 });

  const { data: products } = await supabase
    .from("products")
    .select("id, slug, image_url, updated_at")
    .order("updated_at", { ascending: false });

  if (!storage?.length || !products?.length) {
    console.log("Nothing to restore.");
    return;
  }

  const uploadedProducts = products.filter((p) =>
    p.image_url?.includes("unsplash.com")
  );

  const files = storage
    .map((file) => ({
      name: file.name,
      timestamp: Number(file.name.split("-")[0]),
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  const sortedProducts = uploadedProducts
    .filter((p) => {
      const updated = new Date(p.updated_at).getTime();
      return updated > new Date("2026-06-22T09:40:00Z").getTime();
    })
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  const count = Math.min(files.length, sortedProducts.length);

  console.log(`Restoring ${count} uploaded image(s)...\n`);

  for (let i = 0; i < count; i++) {
    const product = sortedProducts[i];
    const file = files[i];
    const imageUrl = storageUrl(file.name);

    const { error } = await supabase
      .from("products")
      .update({ image_url: imageUrl })
      .eq("id", product.id);

    if (error) {
      console.error(`Failed ${product.slug}:`, error.message);
      continue;
    }

    console.log(`✓ ${product.slug}`);
    console.log(`  ${imageUrl}\n`);
  }

  console.log("Restore complete. Re-upload any remaining products from Admin if needed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
