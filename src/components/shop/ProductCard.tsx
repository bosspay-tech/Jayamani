"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/types";
import { calculateDiscount, cn, formatPrice } from "@/lib/utils";

export function ProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const { addItem } = useCart();
  const discount =
    product.badge ?? calculateDiscount(product.price, product.compare_at_price);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 900);
    return () => clearTimeout(timer);
  }, [justAdded]);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl",
        className
      )}
    >
      <Link href={`/shop/${product.slug}`} className="relative aspect-[4/5] overflow-hidden">
        {discount && (
          <span className="absolute top-3 left-3 z-10 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground">
            {typeof discount === "string" ? discount : `-${discount}%`}
          </span>
        )}
        <Image
          src={
            product.image_url ??
            "https://images.unsplash.com/photo-1483985988350-763728e1935b?w=800&q=80"
          }
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 to-transparent p-4 transition duration-300 group-hover:translate-y-0">
          <p className="text-xs text-white/90">Quick view</p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/shop/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-medium leading-snug text-foreground transition hover:text-accent">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => {
              addItem(product);
              setJustAdded(true);
              toast.success("Added to cart");
            }}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-xs font-semibold tracking-wide uppercase transition active:scale-[0.98]",
              justAdded
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {justAdded ? "Added" : "Add to Cart"}
          </button>
          <button
            type="button"
            className="rounded-full border border-border p-2.5 text-muted-foreground transition hover:border-accent hover:text-accent"
            aria-label="Add to wishlist"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
