"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import type { Order } from "@/lib/api/orders";
import { formatPrice } from "@/lib/utils";

function OrderDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const placed = searchParams.get("placed") === "1";
  const paid = searchParams.get("paid") === "1";
  const paymentFailed = searchParams.get("payment") === "failed";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
      <section className="border-b border-border bg-primary py-14 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl">Order Details</h1>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-muted-foreground">Loading order...</p>
        ) : error || !order ? (
          <div className="rounded-3xl border border-border bg-surface p-8 text-center">
            <p className="text-muted-foreground">{error || "Order not found"}</p>
            <Link
              href="/orders"
              className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase"
            >
              Back to Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {paid && (
              <div className="rounded-2xl bg-emerald-100 px-5 py-4 text-sm text-emerald-900">
                Payment successful! Your order <strong>{order.order_number}</strong>{" "}
                is confirmed.
              </div>
            )}

            {paymentFailed && (
              <div className="rounded-2xl bg-rose-100 px-5 py-4 text-sm text-rose-900">
                Payment failed or was cancelled. You can try checkout again or contact
                support with order <strong>{order.order_number}</strong>.
              </div>
            )}

            {placed && !paid && (
              <div className="rounded-2xl bg-accent/15 px-5 py-4 text-sm">
                Thank you! Your order <strong>{order.order_number}</strong> has
                been placed successfully.
              </div>
            )}

            <div className="rounded-3xl border border-border bg-surface p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-display text-2xl">{order.order_number}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                  {order.status}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="font-medium">Customer</p>
                  <p className="mt-1 text-muted-foreground">{order.customer_name}</p>
                  <p className="text-muted-foreground">{order.customer_email}</p>
                  <p className="text-muted-foreground">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="font-medium">Shipping Address</p>
                  <p className="mt-1 text-muted-foreground">
                    {order.shipping_address}
                    <br />
                    {order.city}, {order.state} {order.pincode}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-surface p-6">
              <h2 className="font-display text-xl">Items</h2>
              <div className="mt-4 space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative h-16 w-14 overflow-hidden rounded-lg bg-muted">
                      {item.product_image_url && (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatPrice(order.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd>
                    {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatPrice(order.total)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex gap-3">
              <Link
                href="/orders"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase"
              >
                Order History
              </Link>
              <Link
                href="/shop"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <OrderDetailContent />
    </Suspense>
  );
}
