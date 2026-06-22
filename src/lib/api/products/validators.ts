import type { ProductBody, ProductUpdateBody } from "./types";
import { slugify } from "@/lib/utils";

export function validateProductBody(body: ProductBody): string | null;
export function validateProductBody(
  body: ProductUpdateBody,
  partial: true
): string | null;
export function validateProductBody(
  body: ProductBody | ProductUpdateBody,
  partial = false
): string | null {
  if (!partial || body.name !== undefined) {
    if (!body.name?.trim()) return "Product name is required";
  }

  if (!partial || body.price !== undefined) {
    if (body.price === undefined || body.price === null) {
      return "Price is required";
    }
    if (Number.isNaN(Number(body.price)) || Number(body.price) < 0) {
      return "Price must be a valid positive number";
    }
  }

  if (
    body.compare_at_price !== undefined &&
    body.compare_at_price !== null &&
    (Number.isNaN(Number(body.compare_at_price)) ||
      Number(body.compare_at_price) < 0)
  ) {
    return "Compare at price must be a valid positive number";
  }

  if (
    body.stock !== undefined &&
    (Number.isNaN(Number(body.stock)) || Number(body.stock) < 0)
  ) {
    return "Stock must be a valid non-negative number";
  }

  return null;
}

export function normalizeProductBody(body: ProductBody) {
  const name = body.name.trim();
  const slug = body.slug?.trim() || slugify(name);

  return {
    name,
    slug,
    description: body.description?.trim() || null,
    price: Number(body.price),
    compare_at_price:
      body.compare_at_price === null || body.compare_at_price === undefined
        ? null
        : Number(body.compare_at_price),
    image_url: body.image_url?.trim() || null,
    badge: body.badge?.trim() || null,
    category_id: body.category_id || null,
    is_featured: body.is_featured ?? false,
    is_new_arrival: body.is_new_arrival ?? false,
    is_popular: body.is_popular ?? false,
    stock: body.stock ?? 100,
    updated_at: new Date().toISOString(),
  };
}
