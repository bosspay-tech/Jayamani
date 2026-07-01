"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { SiteShell } from "@/components/layout/SiteShell";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const total = subtotal;

  return (
    <SiteShell>
      <section className="border-b border-border bg-primary py-14 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl">Your Cart</h1>
          <p className="mt-2 text-primary-foreground/80">
            Review your items before checkout
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-2xl">Your cart is empty</h2>
            <p className="mt-2 text-muted-foreground">
              Discover our latest sarees, ethnic wear, and casual styles.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 rounded-2xl border border-border bg-surface p-4 sm:gap-6"
                >
                  <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-28">
                    <Image
                      src={
                        item.product.image_url ??
                        "https://images.unsplash.com/photo-1483985988350-763728e1935b?w=800&q=80"
                      }
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          href={`/shop/${item.product.slug}`}
                          className="font-medium hover:text-accent"
                        >
                          {item.product.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-muted-foreground transition hover:text-rose-600"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center gap-3">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                          className="p-2 text-muted-foreground hover:text-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                          className="p-2 text-muted-foreground hover:text-foreground"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="ml-auto font-semibold">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-3xl border border-border bg-surface p-6">
              <h2 className="font-display text-2xl">Order Summary</h2>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="font-medium">Free</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-semibold">{formatPrice(total)}</dd>
                </div>
              </dl>

              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-full bg-accent py-3 text-center text-sm font-semibold text-accent-foreground uppercase transition hover:brightness-110"
              >
                Proceed to Checkout
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="mt-3 w-full text-sm text-muted-foreground transition hover:text-foreground"
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
