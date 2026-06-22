import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: categoryCount }] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your Jayamani Export product catalog.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Products" value={productCount ?? 0} />
        <StatCard label="Categories" value={categoryCount ?? 0} />
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground uppercase"
        >
          <Package className="h-4 w-4" />
          Manage Products
        </Link>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold uppercase"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl text-foreground">{value}</p>
    </div>
  );
}
