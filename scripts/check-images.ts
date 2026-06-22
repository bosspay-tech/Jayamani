import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

async function main() {
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, image_url")
    .order("name");

  const { data: storage } = await supabase.storage
    .from("product-images")
    .list("products", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

  console.log("\n=== Products in database ===");
  for (const p of products ?? []) {
    const isUploaded = p.image_url?.includes("supabase.co/storage");
    const isBroken = p.image_url?.includes("unsplash.com");
    console.log(
      `${isUploaded ? "[UPLOADED]" : isBroken ? "[BROKEN]  " : "[OTHER]   "} ${p.slug}`
    );
    console.log(`  ${p.image_url ?? "no image"}\n`);
  }

  console.log("=== Files still in Supabase Storage ===");
  for (const file of storage ?? []) {
    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(`products/${file.name}`);
    console.log(`  ${file.name}`);
    console.log(`  ${data.publicUrl}\n`);
  }
}

main().catch(console.error);
