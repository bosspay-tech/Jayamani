import { SiteShell } from "@/components/layout/SiteShell";
import { CategoryFilterDropdown } from "@/components/shop/CategoryFilterDropdown";
import { ProductCard } from "@/components/shop/ProductCard";
import { getCategories, getProducts } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    filter?: string;
  }>;
}

export const metadata = {
  title: "Shop",
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const categories = await getCategories();

  const allProducts = await getProducts({
    categorySlug: params.category,
    featured: params.filter === "featured" || undefined,
    newArrival: params.filter === "new" || undefined,
    popular: params.filter === "popular" || undefined,
  });

  const activeCategory = params.category;
  const activeFilter = params.filter;

  return (
    <SiteShell>
      <section className="border-b border-border bg-primary py-14 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
            Collection
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">Shop All</h1>
          <p className="mt-3 max-w-2xl text-primary-foreground/80">
            Browse sarees, ethnic wear, t-shirts, and denim with modern designs
            and premium fabrics.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <FilterPill
              href="/shop"
              active={!activeCategory && !activeFilter}
              label="All"
            />
            <FilterPill
              href="/shop?filter=new"
              active={activeFilter === "new"}
              label="New Arrivals"
            />
            <FilterPill
              href="/shop?filter=featured"
              active={activeFilter === "featured"}
              label="Featured"
            />
            <FilterPill
              href="/shop?filter=popular"
              active={activeFilter === "popular"}
              label="Popular"
            />
          </div>

          <CategoryFilterDropdown
            categories={categories}
            activeCategory={activeCategory}
          />
        </div>

        {allProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <h2 className="font-display text-2xl text-foreground">
              No products yet
            </h2>
            <p className="mt-3 text-muted-foreground">
              Run the SQL files in the <code>supabase</code> folder to seed your
              product catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {allProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-accent hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}
