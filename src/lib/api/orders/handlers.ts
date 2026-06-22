import {
  calculateShipping,
  generateOrderNumber,
  validateCreateOrderBody,
} from "./validators";
import type { CreateOrderBody } from "./types";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createRouteClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createOrder(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const validationError = validateCreateOrderBody(body);

    if (validationError) {
      return apiError(validationError);
    }

    const routeClient = await createRouteClient();
    const {
      data: { user },
    } = await routeClient.auth.getUser();

    const admin = createAdminClient();
    const productIds = body.items.map((item) => item.productId);

    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, price, stock, image_url")
      .in("id", productIds);

    if (productsError || !products?.length) {
      return apiError("Could not validate cart items.", 400);
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    let subtotal = 0;

    for (const item of body.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return apiError("One or more products are no longer available.");
      }
      if (product.stock < item.quantity) {
        return apiError(`Insufficient stock for ${product.name}.`);
      }
      subtotal += Number(product.price) * item.quantity;
    }

    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;
    const orderNumber = generateOrderNumber();

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        order_number: orderNumber,
        status: "pending",
        customer_name: body.customerName.trim(),
        customer_email: body.customerEmail.trim().toLowerCase(),
        customer_phone: body.customerPhone.trim(),
        shipping_address: body.shippingAddress.trim(),
        city: body.city.trim(),
        state: body.state.trim(),
        pincode: body.pincode.trim(),
        subtotal,
        shipping,
        total,
      })
      .select("*")
      .single();

    if (orderError || !order) {
      return apiError(orderError?.message ?? "Failed to create order.", 500);
    }

    const orderItems = body.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_image_url: product.image_url,
        price: product.price,
        quantity: item.quantity,
      };
    });

    const { error: itemsError } = await admin.from("order_items").insert(orderItems);

    if (itemsError) {
      await admin.from("orders").delete().eq("id", order.id);
      return apiError("Failed to save order items.", 500);
    }

    for (const item of body.items) {
      const product = productMap.get(item.productId)!;
      await admin
        .from("products")
        .update({ stock: product.stock - item.quantity })
        .eq("id", product.id);
    }

    const { data: fullOrder } = await admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order.id)
      .single();

    return apiSuccess(
      { order: fullOrder, message: "Order placed successfully." },
      201
    );
  } catch {
    return apiError("Invalid request body.", 400);
  }
}

export async function listOrders() {
  const routeClient = await createRouteClient();
  const {
    data: { user },
    error,
  } = await routeClient.auth.getUser();

  if (error || !user) {
    return apiError("Please login to view your orders.", 401);
  }

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (dbError) {
    return apiError(dbError.message, 500);
  }

  return apiSuccess({ orders: data ?? [] });
}

export async function getOrder(id: string) {
  const routeClient = await createRouteClient();
  const {
    data: { user },
  } = await routeClient.auth.getUser();

  const admin = createAdminClient();
  const { data, error: dbError } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (dbError || !data) {
    return apiError("Order not found.", 404);
  }

  if (user) {
    if (data.user_id && data.user_id !== user.id) {
      return apiError("Order not found.", 404);
    }
  } else if (data.user_id) {
    return apiError("Please login to view this order.", 401);
  }

  return apiSuccess({ order: data });
}

export async function listAdminOrders() {
  const routeClient = await createRouteClient();
  const {
    data: { user },
  } = await routeClient.auth.getUser();

  if (!user) {
    return apiError("Unauthorized.", 401);
  }

  const { data: profile } = await routeClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return apiError("Admin access required.", 403);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ orders: data ?? [] });
}
