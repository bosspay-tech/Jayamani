import type { CreateOrderBody } from "./types";

export function validateCreateOrderBody(body: CreateOrderBody): string | null {
  if (!body.customerName?.trim()) return "Full name is required";
  if (!body.customerEmail?.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail.trim())) {
    return "Invalid email address";
  }
  if (!body.customerPhone?.trim()) return "Phone number is required";
  if (!body.shippingAddress?.trim()) return "Shipping address is required";
  if (!body.city?.trim()) return "City is required";
  if (!body.state?.trim()) return "State is required";
  if (!body.pincode?.trim()) return "Pincode is required";
  if (body.billingSameAsShipping === false) {
    if (!body.billingAddress?.trim()) return "Billing address is required";
    if (!body.billingCity?.trim()) return "Billing city is required";
    if (!body.billingState?.trim()) return "Billing state is required";
    if (!body.billingPincode?.trim()) return "Billing pincode is required";
  }
  if (!body.items?.length) return "Cart is empty";
  if (body.items.some((item) => !item.productId || item.quantity < 1)) {
    return "Invalid cart items";
  }
  return null;
}

export function generateOrderNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `JM-${date}-${suffix}`;
}

export function calculateShipping(_subtotal: number) {
  return 0;
}

export function resolveBillingDetails(body: CreateOrderBody) {
  const billingSameAsShipping = body.billingSameAsShipping !== false;

  if (billingSameAsShipping) {
    return {
      billing_same_as_shipping: true,
      billing_address: body.shippingAddress.trim(),
      billing_city: body.city.trim(),
      billing_state: body.state.trim(),
      billing_pincode: body.pincode.trim(),
    };
  }

  return {
    billing_same_as_shipping: false,
    billing_address: body.billingAddress!.trim(),
    billing_city: body.billingCity!.trim(),
    billing_state: body.billingState!.trim(),
    billing_pincode: body.billingPincode!.trim(),
  };
}
