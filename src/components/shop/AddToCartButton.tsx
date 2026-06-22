"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 900);
    return () => clearTimeout(timer);
  }, [justAdded]);

  return (
    <button
      type="button"
      onClick={() => {
        addItem(product);
        setJustAdded(true);
        toast.success("Added to cart");
      }}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide uppercase transition active:scale-[0.98]",
        justAdded
          ? "bg-accent text-accent-foreground"
          : "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      <ShoppingBag className="h-4 w-4" />
      {justAdded ? "Added" : "Add to Cart"}
    </button>
  );
}
