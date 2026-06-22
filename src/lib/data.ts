import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch categories:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getProducts(options?: {
  categorySlug?: string;
  featured?: boolean;
  newArrival?: boolean;
  popular?: boolean;
  limit?: number;
}): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, categories(*)")
    .order("created_at", { ascending: false });

  if (options?.categorySlug) {
    const category = await getCategoryBySlug(options.categorySlug);
    if (!category) return [];
    query = query.eq("category_id", category.id);
  }
  if (options?.featured) {
    query = query.eq("is_featured", true);
  }
  if (options?.newArrival) {
    query = query.eq("is_new_arrival", true);
  }
  if (options?.popular) {
    query = query.eq("is_popular", true);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch products:", error.message);
    return [];
  }

  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(*)")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Failed to fetch product:", error.message);
    return null;
  }

  return data as Product;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Failed to fetch category:", error.message);
    return null;
  }

  return data;
}

export async function getCategoryCoverImages(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from("products")
    .select("image_url, updated_at, categories(slug)")
    .not("image_url", "is", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch category covers:", error.message);
    return {};
  }

  const covers: Record<string, string> = {};

  for (const product of products ?? []) {
    const categories = product.categories as
      | { slug: string }[]
      | { slug: string }
      | null
      | undefined;
    const slug = Array.isArray(categories)
      ? categories[0]?.slug
      : categories?.slug;
    const imageUrl = product.image_url as string | null;

    if (!slug || !imageUrl || imageUrl.includes("unsplash.com")) continue;

    const isUploaded = imageUrl.includes("/storage/");
    const current = covers[slug];
    const currentIsUploaded = current?.includes("/storage/");

    if (!current || (isUploaded && !currentIsUploaded)) {
      covers[slug] = imageUrl;
    }
  }

  return covers;
}
