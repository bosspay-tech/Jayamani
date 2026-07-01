"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import type { Order } from "@/lib/api/orders";
import { formatPrice } from "@/lib/utils";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState("");

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
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-600" />
        <h1 className="mt-6 font-display text-4xl">Payment Successful</h1>
        <p className="mt-3 text-muted-foreground">
          Thank you! Your payment was received and your order is confirmed.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading order details...</p>
        ) : order ? (
          <div className="mt-8 rounded-3xl border border-border bg-surface p-6 text-left">
            <p className="text-sm text-muted-foreground">Order Number</p>
            <p className="font-display text-2xl">{order.order_number}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              Total paid: <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Confirmation sent to {order.customer_email}
            </p>
          </div>
        ) : error ? (
          <p className="mt-8 text-sm text-muted-foreground">{error}</p>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase"
            >
              View Order
            </Link>
          )}
          <Link
            href="/shop"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase"
          >
            Continue Shopping
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
