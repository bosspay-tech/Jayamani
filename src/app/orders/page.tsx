"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { SiteShell } from "@/components/layout/SiteShell";
import type { Order } from "@/lib/api/orders";
import { formatPrice } from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) {
          setError(result.error ?? "Failed to load orders");
          return;
        }
        setOrders(result.data.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteShell>
      <section className="border-b border-border bg-primary py-14 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl">Order History</h1>
          <p className="mt-2 text-primary-foreground/80">
            View your past orders and their status
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <p className="text-muted-foreground">Loading orders...</p>
        ) : error ? (
          <div className="rounded-3xl border border-border bg-surface p-8 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Link
              href="/login?redirect=/orders"
              className="mt-4 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase"
            >
              Login to View Orders
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl">No orders yet</h2>
            <p className="mt-2 text-muted-foreground">
              Place your first order from the shop.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block rounded-2xl border border-border bg-surface p-5 transition hover:border-accent"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{order.order_number}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-sm">
                      {order.order_items?.length ?? 0} item(s)
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <StatusBadge status={order.status} />
                    <p className="mt-2 font-semibold">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-rose-100 text-rose-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        styles[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {status}
    </span>
  );
}
