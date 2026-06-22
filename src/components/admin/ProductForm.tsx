"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { slugify } from "@/lib/utils";
import type { Category } from "@/lib/types";

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  price: string;
  compare_at_price: string;
  image_url: string;
  badge: string;
  category_id: string;
  stock: string;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_popular: boolean;
}

const emptyValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compare_at_price: "",
  image_url: "",
  badge: "",
  category_id: "",
  stock: "100",
  is_featured: false,
  is_new_arrival: false,
  is_popular: false,
};

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  productId?: string;
  submitLabel: string;
}

export function ProductForm({
  initialValues,
  productId,
  submitLabel,
}: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [values, setValues] = useState<ProductFormValues>({
    ...emptyValues,
    ...initialValues,
  });
  const [autoSlug, setAutoSlug] = useState(!productId);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setCategories(result.data.categories);
      });
  }, []);

  function updateField<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && autoSlug) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (!values.image_url) {
      setStatus("error");
      setMessage("Please upload a product image.");
      return;
    }

    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      price: Number(values.price),
      compare_at_price: values.compare_at_price
        ? Number(values.compare_at_price)
        : null,
      image_url: values.image_url,
      badge: values.badge || null,
      category_id: values.category_id || null,
      stock: Number(values.stock),
      is_featured: values.is_featured,
      is_new_arrival: values.is_new_arrival,
      is_popular: values.is_popular,
    };

    const url = productId
      ? `/api/admin/products/${productId}`
      : "/api/admin/products";
    const method = productId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      setStatus("error");
      setMessage(result.error ?? "Failed to save product.");
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" required>
          <input
            required
            value={values.name}
            onChange={(e) => updateField("name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Slug" required>
          <input
            required
            value={values.slug}
            onChange={(e) => {
              setAutoSlug(false);
              updateField("slug", e.target.value);
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Price (₹)" required>
          <input
            required
            type="number"
            min="0"
            value={values.price}
            onChange={(e) => updateField("price", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Compare at price (₹)">
          <input
            type="number"
            min="0"
            value={values.compare_at_price}
            onChange={(e) => updateField("compare_at_price", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Category">
          <select
            value={values.category_id}
            onChange={(e) => updateField("category_id", e.target.value)}
            className={inputClass}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Stock">
          <input
            type="number"
            min="0"
            value={values.stock}
            onChange={(e) => updateField("stock", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Product image" required>
        <ImageUpload
          value={values.image_url}
          onChange={(url) => updateField("image_url", url)}
        />
      </Field>

      <Field label="Badge">
        <input
          value={values.badge}
          onChange={(e) => updateField("badge", e.target.value)}
          className={inputClass}
          placeholder="-50%"
        />
      </Field>

      <Field label="Description">
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => updateField("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap gap-4">
        <Checkbox
          label="Featured"
          checked={values.is_featured}
          onChange={(checked) => updateField("is_featured", checked)}
        />
        <Checkbox
          label="New arrival"
          checked={values.is_new_arrival}
          onChange={(checked) => updateField("is_new_arrival", checked)}
        />
        <Checkbox
          label="Popular"
          checked={values.is_popular}
          onChange={(checked) => updateField("is_popular", checked)}
        />
      </div>

      {message && (
        <p className="rounded-xl bg-rose/20 px-4 py-3 text-sm">{message}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground uppercase disabled:opacity-60"
        >
          {status === "loading" ? "Saving..." : submitLabel}
        </button>
        <Link
          href="/admin/products"
          className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent";

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

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-border text-accent focus:ring-accent"
      />
      {label}
    </label>
  );
}
