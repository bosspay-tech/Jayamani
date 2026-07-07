"use client";

import Link from "next/link";
import { XCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OrderItemsList } from "@/components/orders/OrderItemsList";
import { SiteShell } from "@/components/layout/SiteShell";
import type { Order } from "@/lib/api/orders";
import { formatPrice } from "@/lib/utils";

const REASON_MESSAGES: Record<string, string> = {
  "Invalid payment response.": "We could not verify the payment response. Please try again.",
  "Order not found.": "We could not find your order. Contact support if money was deducted.",
  "Transaction mismatch.": "Payment details did not match your order. Contact support.",
  "Amount mismatch.": "The paid amount did not match your order total. Contact support.",
  "Easebuzz not configured.": "Payment gateway is temporarily unavailable. Please try again later.",
};

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const reason = searchParams.get("reason");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState("");

  const reasonMessage = reason
    ? REASON_MESSAGES[decodeURIComponent(reason)] ?? decodeURIComponent(reason)
    : "Your payment was not completed. No amount has been charged, or any pending charge will be reversed by your bank.";

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) {
          setError(result.error ?? "Order not found");
          return;
        }
        setOrder(result.data.order);
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <XCircle className="mx-auto h-16 w-16 text-rose-600" />
        <h1 className="mt-6 font-display text-4xl">Payment Failed</h1>
        <p className="mt-3 text-muted-foreground">{reasonMessage}</p>

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading order details...</p>
        ) : order ? (
          <div className="mt-8 rounded-3xl border border-border bg-surface p-6 text-left">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-display text-2xl">{order.order_number}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Order total: <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
            </p>
            {order.order_items && order.order_items.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <p className="text-sm font-medium text-foreground">Order items</p>
                <OrderItemsList items={order.order_items} className="mt-3 space-y-3" />
              </div>
            )}
          </div>
        ) : error ? (
          <p className="mt-8 text-sm text-muted-foreground">{error}</p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase"
          >
            Try Again
          </Link>
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase"
            >
              View Order
            </Link>
          )}
          <Link
            href="/contact"
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PaymentFailedContent />
    </Suspense>
  );
}
