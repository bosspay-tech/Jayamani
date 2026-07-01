import {
  calculateShipping,
  generateOrderNumber,
  validateCreateOrderBody,
} from "./validators";
import type { CreateOrderBody } from "./types";
import { apiError, apiSuccess } from "@/lib/api/response";
import { createRouteClient } from "@/lib/supabase/route";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  aggregateQuantityByProductId,
  loadOrderProducts,
  resolveOrderProduct,
} from "./product-lookup";
import { isEasebuzzConfigured } from "@/lib/easebuzz/config";
import { initiateEasebuzzPayment } from "@/lib/easebuzz/client";
import { getSiteUrl } from "@/lib/site-url";

export async function createOrder(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const validationError = validateCreateOrderBody(body);

    if (validationError) {
      return apiError(validationError);
    }

    if (!isEasebuzzConfigured()) {
      return apiError("Payment gateway is not configured. Please contact support.", 500);
    }

    const routeClient = await createRouteClient();
    const {
      data: { user },
    } = await routeClient.auth.getUser();

    const admin = createAdminClient();
    const productLookup = await loadOrderProducts(admin, body.items);

    if ("error" in productLookup) {
      return apiError(productLookup.error, 400);
    }

    const { byId, bySlug } = productLookup;
    const resolvedLines: {
      item: (typeof body.items)[number];
      product: NonNullable<ReturnType<typeof resolveOrderProduct>>;
    }[] = [];

    for (const item of body.items) {
      const product = resolveOrderProduct(item, byId, bySlug);

      if (!product) {
        return apiError(
          "One or more cart items are outdated. Clear your cart, add products again, and retry.",
          400
        );
      }

      resolvedLines.push({ item, product });
    }

    const quantityByProductId = aggregateQuantityByProductId(
      resolvedLines.map(({ item, product }) => ({
        product,
        quantity: item.quantity,
      }))
    );

    let subtotal = 0;

    for (const { item, product } of resolvedLines) {
      const totalQuantity = quantityByProductId.get(product.id) ?? item.quantity;
      const stock = Number(product.stock ?? 0);

      if (stock < totalQuantity) {
        return apiError(`Insufficient stock for ${product.name}.`);
      }

      subtotal += Number(product.price) * item.quantity;
    }

    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;
    const orderNumber = generateOrderNumber();
    const siteUrl = getSiteUrl(request);
    const successUrl = `${siteUrl}/payment/success`;
    const failureUrl = `${siteUrl}/payment/failed`;

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        order_number: orderNumber,
        status: "awaiting_payment",
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

    const orderItems = resolvedLines.map(({ item, product }) => ({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      product_image_url: product.image_url,
      price: product.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await admin.from("order_items").insert(orderItems);

    if (itemsError) {
      await admin.from("orders").delete().eq("id", order.id);
      return apiError("Failed to save order items.", 500);
    }

    const firstName = body.customerName.trim().split(/\s+/)[0] || "Customer";
    const payment = await initiateEasebuzzPayment({
      txnid: orderNumber,
      amount: total,
      productinfo: `Jayamani Order ${orderNumber}`,
      firstname: firstName,
      email: body.customerEmail.trim().toLowerCase(),
      phone: body.customerPhone.trim(),
      surl: successUrl,
      furl: failureUrl,
      udf1: order.id,
    });

    if (!payment.success) {
      await admin.from("orders").delete().eq("id", order.id);
      return apiError(payment.error, 502);
    }

    const { data: fullOrder } = await admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order.id)
      .single();

    return apiSuccess(
      {
        order: fullOrder,
        paymentUrl: payment.paymentUrl,
        message: "Redirecting to payment...",
      },
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) {
      return apiError("Order service is not configured. Please contact support.", 500);
    }

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

