"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCart } from "@/components/cart/CartProvider";
import { SiteShell } from "@/components/layout/SiteShell";
import { formatPrice } from "@/lib/utils";

const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const total = subtotal;

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
  });
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billing, setBilling] = useState({
    billingAddress: "",
    billingCity: "",
    billingState: "Tamil Nadu",
    billingPincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://pay.easebuzz.in";
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data.user) {
          setForm((current) => ({
            ...current,
            customerName: result.data.user.fullName ?? current.customerName,
            customerEmail: result.data.user.email ?? current.customerEmail,
          }));
        }
      })
      .catch(() => undefined);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);
    setLoadingMessage("Creating your order...");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          billingSameAsShipping,
          ...(billingSameAsShipping ? {} : billing),
          items: items.map((item) => ({
            productId: item.product.id,
            productSlug: item.product.slug,
            quantity: item.quantity,
            size: item.size,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setLoading(false);
        setLoadingMessage("");
        toast.error(result.error ?? "Failed to place order");
        return;
      }

      if (result.data?.paymentUrl) {
        const paymentUrl = result.data.paymentUrl as string;
        if (!paymentUrl.includes("easebuzz.in")) {
          setLoading(false);
          setLoadingMessage("");
          toast.error("Invalid payment gateway response. Please try again.");
          return;
        }
        setLoadingMessage("Redirecting to payment gateway...");
        clearCart();
        window.location.assign(paymentUrl);
        return;
      }

      setLoading(false);
      setLoadingMessage("");
      clearCart();
      toast.success("Order placed successfully");
      router.push(`/orders/${result.data.order.id}?placed=1`);
      router.refresh();
    } catch {
      setLoading(false);
      setLoadingMessage("");
      toast.error("Failed to place order. Please try again.");
    }
  }

  if (items.length === 0) {
    return (
      <SiteShell>
        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h1 className="font-display text-3xl">Checkout</h1>
          <p className="mt-3 text-muted-foreground">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase"
          >
            Continue Shopping
          </Link>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="border-b border-border bg-primary py-14 text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl">Checkout</h1>
          <p className="mt-2 text-primary-foreground/80">
            Enter your details to place the order
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-border bg-surface p-6">
          <h2 className="font-display text-2xl">Delivery Address</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" required>
              <input
                required
                value={form.customerName}
                onChange={(e) =>
                  setForm((current) => ({ ...current, customerName: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Phone" required>
              <input
                required
                value={form.customerPhone}
                onChange={(e) =>
                  setForm((current) => ({ ...current, customerPhone: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Email" required>
            <input
              type="email"
              required
              value={form.customerEmail}
              onChange={(e) =>
                setForm((current) => ({ ...current, customerEmail: e.target.value }))
              }
              className={inputClass}
            />
          </Field>

          <Field label="Address" required>
            <textarea
              required
              rows={3}
              value={form.shippingAddress}
              onChange={(e) =>
                setForm((current) => ({ ...current, shippingAddress: e.target.value }))
              }
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="City" required>
              <input
                required
                value={form.city}
                onChange={(e) =>
                  setForm((current) => ({ ...current, city: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="State" required>
              <input
                required
                value={form.state}
                onChange={(e) =>
                  setForm((current) => ({ ...current, state: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
            <Field label="Pincode" required>
              <input
                required
                value={form.pincode}
                onChange={(e) =>
                  setForm((current) => ({ ...current, pincode: e.target.value }))
                }
                className={inputClass}
              />
            </Field>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="font-display text-2xl">Billing Address</h2>
            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={billingSameAsShipping}
                onChange={(event) => setBillingSameAsShipping(event.target.checked)}
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
              />
              <span>Same as delivery address</span>
            </label>

            {!billingSameAsShipping && (
              <div className="mt-4 space-y-4">
                <Field label="Billing Address" required>
                  <textarea
                    required
                    rows={3}
                    value={billing.billingAddress}
                    onChange={(e) =>
                      setBilling((current) => ({
                        ...current,
                        billingAddress: e.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City" required>
                    <input
                      required
                      value={billing.billingCity}
                      onChange={(e) =>
                        setBilling((current) => ({
                          ...current,
                          billingCity: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="State" required>
                    <input
                      required
                      value={billing.billingState}
                      onChange={(e) =>
                        setBilling((current) => ({
                          ...current,
                          billingState: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Pincode" required>
                    <input
                      required
                      value={billing.billingPincode}
                      onChange={(e) =>
                        setBilling((current) => ({
                          ...current,
                          billingPincode: e.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-accent-foreground uppercase transition hover:brightness-110 disabled:opacity-60"
          >
            {loading
              ? loadingMessage || "Proceeding to Payment..."
              : "Proceed to Payment"}
          </button>
        </form>

        <aside className="h-fit rounded-3xl border border-border bg-surface p-6">
          <h2 className="font-display text-2xl">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-3">
                <div className="relative h-14 w-12 overflow-hidden rounded-lg bg-muted">
                  {item.product.image_url && (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 text-sm">
                  <p className="line-clamp-2 font-medium">{item.product.name}</p>
                  <p className="text-muted-foreground">
                    {item.quantity} x {formatPrice(item.product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>Free</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </SiteShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      {children}
    </label>
  );
}
