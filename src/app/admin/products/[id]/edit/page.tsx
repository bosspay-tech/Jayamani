import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { formatSizesInput } from "@/lib/product-sizes";
import { createClient } from "@/lib/supabase/server";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("name")
    .eq("id", id)
    .single();

  return { title: data ? `Edit ${data.name}` : "Edit Product" };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl text-foreground">Edit Product</h1>
      <p className="mt-2 text-muted-foreground">Update {product.name}</p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <ProductForm
          productId={product.id}
          submitLabel="Save Changes"
          initialValues={{
            name: product.name,
            slug: product.slug,
            description: product.description ?? "",
            price: String(product.price),
            compare_at_price: product.compare_at_price
              ? String(product.compare_at_price)
              : "",
            image_url: product.image_url ?? "",
            badge: product.badge ?? "",
            category_id: product.category_id ?? "",
            sizes: formatSizesInput(product.sizes),
            stock: String(product.stock),
            is_featured: product.is_featured,
            is_new_arrival: product.is_new_arrival,
            is_popular: product.is_popular,
          }}
        />
      </div>
    </div>
  );
}
