"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/types";
import { resolveProductSizes } from "@/lib/product-sizes";
import { cn } from "@/lib/utils";

interface ProductPurchasePanelProps {
  product: Product;
}

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const { addItem } = useCart();
  const sizes = resolveProductSizes(
    product.sizes,
    product.categories?.slug ?? null
  );
  const [selectedSize, setSelectedSize] = useState(sizes[0] ?? "");
  const [justAdded, setJustAdded] = useState(false);

  function handleAddToCart() {
    if (sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }

    addItem(product, 1, selectedSize || undefined);
    setJustAdded(true);
    toast.success("Added to cart");
    window.setTimeout(() => setJustAdded(false), 900);
  }

  return (
    <div className="mt-8 space-y-5">
      {sizes.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground">Select Size</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition",
                  selectedSize === size
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-background hover:border-accent"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide uppercase transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
            justAdded
              ? "bg-accent text-accent-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <ShoppingBag className="h-4 w-4" />
          {product.stock <= 0
            ? "Out of Stock"
            : justAdded
              ? "Added"
              : "Add to Cart"}
        </button>
        <Link
          href="/cart"
          className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase transition hover:border-accent hover:text-accent"
        >
          View Cart
        </Link>
      </div>
    </div>
  );
}
