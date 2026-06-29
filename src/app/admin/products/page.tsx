"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";

type PriceSort = "default" | "price-asc" | "price-desc";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [priceSort, setPriceSort] = useState<PriceSort>("price-asc");

  const sortedProducts = useMemo(() => {
    if (priceSort === "default") return products;

    return [...products].sort((a, b) => {
      const diff = Number(a.price) - Number(b.price);
      return priceSort === "price-asc" ? diff : -diff;
    });
  }, [products, priceSort]);

  async function loadProducts() {
    const response = await fetch("/api/admin/products");
    const result = await response.json();
    if (result.success) {
      setProducts(result.data.products);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
    });
    const result = await response.json();
    if (result.success) {
      setProducts((current) => current.filter((product) => product.id !== id));
    }
    setDeletingId(null);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Products</h1>
          <p className="mt-2 text-muted-foreground">
            Create, edit, and remove store products.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PriceSortDropdown value={priceSort} onChange={setPriceSort} />
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground uppercase"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-muted-foreground">No products yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Run <code className="rounded bg-muted px-1.5 py-0.5">npm run seed</code>{" "}
            or add your first product.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Flags</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr key={product.id} className="border-b border-border/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-10 overflow-hidden rounded-lg bg-muted">
                        {product.image_url && (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.categories?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.is_featured && <Tag label="Featured" />}
                      {product.is_new_arrival && <Tag label="New" />}
                      {product.is_popular && <Tag label="Popular" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="rounded-lg border border-border p-2 hover:border-accent hover:text-accent"
                        aria-label="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="rounded-lg border border-border p-2 hover:border-rose-400 hover:text-rose-600 disabled:opacity-50"
                        aria-label="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PriceSortDropdown({
  value,
  onChange,
}: {
  value: PriceSort;
  onChange: (value: PriceSort) => void;
}) {
  return (
    <div className="relative min-w-[190px]">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as PriceSort)}
        aria-label="Sort products by price"
        className={cn(
          "w-full appearance-none rounded-full border border-border bg-surface py-2.5 pr-10 pl-4 text-sm font-medium outline-none transition",
          "focus:border-accent focus:ring-2 focus:ring-accent/20",
          value === "default" ? "text-muted-foreground" : "text-foreground"
        )}
      >
        <option value="default">Sort: Newest</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}
