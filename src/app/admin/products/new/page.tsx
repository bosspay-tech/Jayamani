import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = {
  title: "Add Product",
};

export default function NewProductPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl text-foreground">Add Product</h1>
      <p className="mt-2 text-muted-foreground">
        Create a new product for your store.
      </p>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <ProductForm submitLabel="Create Product" />
      </div>
    </div>
  );
}
