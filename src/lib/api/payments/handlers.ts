import { verifyPaymentResponseHash } from "@/lib/easebuzz/hash";
import { getEasebuzzConfig } from "@/lib/easebuzz/config";
import { fulfillOrderStock } from "@/lib/api/orders/fulfill-stock";
import { createAdminClient } from "@/lib/supabase/admin";

function formDataToRecord(formData: FormData): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      record[key] = value;
    }
  }
  return record;
}

export type EasebuzzCallbackResult = {
  outcome: "success" | "failed" | "error";
  orderId?: string;
  error?: string;
};

export function getEasebuzzRedirectPath(result: EasebuzzCallbackResult): string {
  if (result.outcome === "success" && result.orderId) {
    return `/payment/success?order=${result.orderId}`;
  }

  if (result.outcome === "failed" && result.orderId) {
    return `/payment/failed?order=${result.orderId}`;
  }

  const reason = encodeURIComponent(result.error ?? "invalid");
  return `/payment/failed?reason=${reason}`;
}

export async function handleEasebuzzCallback(
  formData: FormData
): Promise<EasebuzzCallbackResult> {
  const config = getEasebuzzConfig();
  if (!config) {
    return { outcome: "error", error: "Easebuzz not configured." };
  }

  const params = formDataToRecord(formData);
  const orderId = params.udf1?.trim();

  if (!orderId || !verifyPaymentResponseHash(params, config.salt)) {
    return { outcome: "error", error: "Invalid payment response." };
  }

  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select("id, status, order_number, total")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return { outcome: "error", error: "Order not found." };
  }

  if (params.txnid && order.order_number !== params.txnid) {
    return { outcome: "error", orderId: order.id, error: "Transaction mismatch." };
  }

  const amount = Number(params.amount);
  if (Number.isFinite(amount) && Math.abs(amount - Number(order.total)) > 0.01) {
    return { outcome: "error", orderId: order.id, error: "Amount mismatch." };
  }

  if (params.status === "success") {
    if (order.status !== "paid") {
      const stockResult = await fulfillOrderStock(admin, order.id);
      if (!stockResult.ok) {
        console.error("Stock fulfillment failed:", stockResult.error);
      }

      await admin.from("orders").update({ status: "paid" }).eq("id", order.id);
    }

    return { outcome: "success", orderId: order.id };
  }

  if (order.status === "awaiting_payment") {
    await admin.from("orders").update({ status: "payment_failed" }).eq("id", order.id);
  }

  return { outcome: "failed", orderId: order.id };
}
