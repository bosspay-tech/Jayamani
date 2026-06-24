import type { SupabaseClient } from "@supabase/supabase-js";
import { isUuid } from "@/lib/supabase/admin";
import type { OrderItemInput } from "./types";

export type OrderProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
};

function indexProducts(products: OrderProduct[]) {
  const byId = new Map<string, OrderProduct>();
  const bySlug = new Map<string, OrderProduct>();

  for (const product of products) {
    byId.set(product.id, product);
    bySlug.set(product.slug, product);
  }

  return { byId, bySlug };
}

export async function loadOrderProducts(
  admin: SupabaseClient,
  items: OrderItemInput[]
): Promise<
  | { byId: Map<string, OrderProduct>; bySlug: Map<string, OrderProduct> }
  | { error: string }
> {
  const uuidIds = new Set<string>();
  const slugs = new Set<string>();

  for (const item of items) {
    if (isUuid(item.productId)) {
      uuidIds.add(item.productId);
    } else {
      slugs.add(item.productId);
    }

    if (item.productSlug) {
      slugs.add(item.productSlug);
    }
  }

  const [idResult, slugResult] = await Promise.all([
    uuidIds.size > 0
      ? admin
          .from("products")
          .select("id, slug, name, price, stock, image_url")
          .in("id", [...uuidIds])
      : Promise.resolve({ data: [], error: null }),
    slugs.size > 0
      ? admin
          .from("products")
          .select("id, slug, name, price, stock, image_url")
          .in("slug", [...slugs])
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (idResult.error || slugResult.error) {
    console.error("Product lookup failed:", idResult.error ?? slugResult.error);
    return { error: "Could not validate cart items. Please try again." };
  }

  const merged = new Map<string, OrderProduct>();
  for (const product of [...(idResult.data ?? []), ...(slugResult.data ?? [])]) {
    merged.set(product.id, product as OrderProduct);
  }

  if (!merged.size) {
    return { error: "Cart items are outdated. Clear your cart, add products again, and retry." };
  }

  return indexProducts([...merged.values()]);
}

export function resolveOrderProduct(
  item: OrderItemInput,
  byId: Map<string, OrderProduct>,
  bySlug: Map<string, OrderProduct>
): OrderProduct | undefined {
  return (
    byId.get(item.productId) ??
    bySlug.get(item.productId) ??
    (item.productSlug ? bySlug.get(item.productSlug) : undefined)
  );
}

export function aggregateQuantityByProductId(
  lines: { product: OrderProduct; quantity: number }[]
) {
  const totals = new Map<string, number>();

  for (const line of lines) {
    totals.set(
      line.product.id,
      (totals.get(line.product.id) ?? 0) + line.quantity
    );
  }

  return totals;
}
