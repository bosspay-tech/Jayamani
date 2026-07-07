import type { ProductUpdateBody } from "./types";
import { normalizeProductBody, normalizeSizesField, validateProductBody } from "./validators";
import { requireAdmin } from "@/lib/api/admin/guard";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function listAdminProducts() {
  const { error, context } = await requireAdmin();
  if (error || !context) return error;

  const { data, error: dbError } = await context.supabase
    .from("products")
    .select("*, categories(id, name, slug)")
    .order("created_at", { ascending: false });

  if (dbError) {
    return apiError(dbError.message, 500);
  }

  return apiSuccess({ products: data ?? [] });
}

export async function getAdminProduct(id: string) {
  const { error, context } = await requireAdmin();
  if (error || !context) return error;

  const { data, error: dbError } = await context.supabase
    .from("products")
    .select("*, categories(id, name, slug)")
    .eq("id", id)
    .single();

  if (dbError) {
    return apiError("Product not found.", 404);
  }

  return apiSuccess({ product: data });
}

export async function createProduct(request: Request) {
  const { error, context } = await requireAdmin();
  if (error || !context) return error;

  try {
    const body = await request.json();
    const validationError = validateProductBody(body);

    if (validationError) {
      return apiError(validationError);
    }

    const payload = normalizeProductBody(body);
    const { data, error: dbError } = await context.supabase
      .from("products")
      .insert(payload)
      .select("*, categories(id, name, slug)")
      .single();

    if (dbError) {
      if (dbError.code === "23505") {
        return apiError("A product with this slug already exists.");
      }
      return apiError(dbError.message, 500);
    }

    return apiSuccess({ product: data, message: "Product created." }, 201);
  } catch {
    return apiError("Invalid request body.", 400);
  }
}

export async function updateProduct(id: string, request: Request) {
  const { error, context } = await requireAdmin();
  if (error || !context) return error;

  try {
    const body = (await request.json()) as ProductUpdateBody;
    const validationError = validateProductBody(body, true);

    if (validationError) {
      return apiError(validationError);
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.slug !== undefined) updates.slug = body.slug.trim();
    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }
    if (body.price !== undefined) updates.price = Number(body.price);
    if (body.compare_at_price !== undefined) {
      updates.compare_at_price =
        body.compare_at_price === null
          ? null
          : Number(body.compare_at_price);
    }
    if (body.image_url !== undefined) {
      updates.image_url = body.image_url?.trim() || null;
    }
    if (body.badge !== undefined) updates.badge = body.badge?.trim() || null;
    if (body.category_id !== undefined) updates.category_id = body.category_id;
    if (body.sizes !== undefined) {
      updates.sizes = normalizeSizesField(body.sizes);
    }
    if (body.is_featured !== undefined) updates.is_featured = body.is_featured;
    if (body.is_new_arrival !== undefined) {
      updates.is_new_arrival = body.is_new_arrival;
    }
    if (body.is_popular !== undefined) updates.is_popular = body.is_popular;
    if (body.stock !== undefined) updates.stock = Number(body.stock);

    const { data, error: dbError } = await context.supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("*, categories(id, name, slug)")
      .single();

    if (dbError) {
      if (dbError.code === "23505") {
        return apiError("A product with this slug already exists.");
      }
      return apiError(dbError.message, 500);
    }

    return apiSuccess({ product: data, message: "Product updated." });
  } catch {
    return apiError("Invalid request body.", 400);
  }
}

export async function deleteProduct(id: string) {
  const { error, context } = await requireAdmin();
  if (error || !context) return error;

  const { error: dbError } = await context.supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (dbError) {
    return apiError(dbError.message, 500);
  }

  return apiSuccess({ message: "Product deleted." });
}

export async function listAdminCategories() {
  const { error, context } = await requireAdmin();
  if (error || !context) return error;

  const { data, error: dbError } = await context.supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (dbError) {
    return apiError(dbError.message, 500);
  }

  return apiSuccess({ categories: data ?? [] });
}
