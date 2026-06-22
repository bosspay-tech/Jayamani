import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeatureBar, Hero } from "@/components/home/Hero";
import { ProductSection } from "@/components/home/ProductSection";
import { PromoBanner } from "@/components/home/PromoBanner";
import { SiteShell } from "@/components/layout/SiteShell";
import { getCategories, getCategoryCoverImages, getProducts } from "@/lib/data";

export default async function HomePage() {
  const [categories, coverImages, newArrivals, featured, popular] =
    await Promise.all([
    getCategories(),
    getCategoryCoverImages(),
    getProducts({ newArrival: true, limit: 8 }),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ popular: true, limit: 8 }),
  ]);

  return (
    <SiteShell>
      <Hero />
      <FeatureBar />
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh drops in sarees and ready-to-wear styles"
        products={newArrivals}
        viewAllHref="/shop?filter=new"
      />
      <CategoryGrid categories={categories} coverImages={coverImages} />
      <ProductSection
        title="Featured Items"
        subtitle="Handpicked ethnic sets, denim, and statement pieces"
        products={featured}
        viewAllHref="/shop?filter=featured"
      />
      <PromoBanner />
      <ProductSection
        title="Popular Items"
        subtitle="Customer favorites across sarees and casual wear"
        products={popular}
        viewAllHref="/shop?filter=popular"
      />
    </SiteShell>
  );
}
