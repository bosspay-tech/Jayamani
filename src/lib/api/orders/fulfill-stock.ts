import type { SupabaseClient } from "@supabase/supabase-js";

export async function fulfillOrderStock(
  admin: SupabaseClient,
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: items, error } = await admin
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  if (error || !items?.length) {
    return { ok: false, error: error?.message ?? "Order items not found." };
  }

  const quantityByProduct = new Map<string, number>();
  for (const item of items) {
    if (!item.product_id) continue;
    quantityByProduct.set(
      item.product_id,
      (quantityByProduct.get(item.product_id) ?? 0) + item.quantity
    );
  }

  for (const [productId, quantity] of quantityByProduct) {
    const { data: product, error: productError } = await admin
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return { ok: false, error: productError?.message ?? "Product not found." };
    }

    const nextStock = Number(product.stock ?? 0) - quantity;
    const { error: updateError } = await admin
      .from("products")
      .update({ stock: nextStock })
      .eq("id", productId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }
  }

  return { ok: true };
}
