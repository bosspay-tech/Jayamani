import Image from "next/image";
import Link from "next/link";

export function PromoBanner() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.15),transparent_60%)]" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div className="space-y-4 p-8 sm:p-12">
              <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
                Limited Offer
              </p>
              <h2 className="font-display text-3xl text-primary-foreground sm:text-4xl">
                Free shipping on all orders over ₹2,500
              </h2>
              <p className="max-w-md text-primary-foreground/80">
                Upgrade your wardrobe with our latest sarees, ethnic sets, and
                streetwear essentials. Tamil Nadu customers enjoy priority delivery.
              </p>
              <Link
                href="/shop"
                className="inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold tracking-wide text-accent-foreground uppercase transition hover:brightness-110"
              >
                Start Shopping
              </Link>
            </div>
            <div className="relative hidden h-full min-h-[320px] lg:block">
              <Image
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80"
                alt="Fashion promo"
                fill
                className="object-cover"
                sizes="50vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
