import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { SiteShell } from "@/components/layout/SiteShell";
import { getProductBySlug } from "@/lib/data";
import { calculateDiscount, formatPrice } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description ?? `Shop ${product.name} at Jayamani Export`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const discount =
    product.badge ??
    calculateDiscount(product.price, product.compare_at_price);

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-border bg-surface">
            <Image
              src={
                product.image_url ??
                "https://images.unsplash.com/photo-1483985988350-763728e1935b?w=800&q=80"
              }
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {discount && (
              <span className="absolute top-4 left-4 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                {typeof discount === "string" ? discount : `-${discount}%`}
              </span>
            )}
          </div>

          <div className="flex flex-col">
            {product.categories && (
              <p className="text-xs font-semibold tracking-[0.25em] text-accent uppercase">
                {product.categories.name}
              </p>
            )}
            <h1 className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-5 flex items-center gap-3">
              <span className="text-3xl font-semibold">
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
            </div>

            <p className="mt-6 leading-relaxed text-muted-foreground">
              {product.description ??
                "Premium quality fabric with a modern silhouette designed for comfort and style."}
            </p>

            <ul className="mt-6 space-y-2 text-sm text-foreground">
              <li>• Free shipping on orders over ₹2,500</li>
              <li>• Easy returns within 7 days</li>
              <li>• Secure payment options</li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <AddToCartButton product={product} />
              <Link
                href="/cart"
                className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase transition hover:border-accent hover:text-accent"
              >
                View Cart
              </Link>
            </div>

            <div className="mt-10 rounded-2xl bg-muted p-5 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Availability:</span>{" "}
                {product.stock > 0 ? "In stock" : "Out of stock"}
              </p>
              <p className="mt-2">
                Need help? Call{" "}
                <a href="tel:9384099029" className="text-accent">
                  9384099029
                </a>{" "}
                or email{" "}
                <a
                  href="mailto:sales@jayamanicollections.com"
                  className="text-accent"
                >
                  sales@jayamanicollections.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
