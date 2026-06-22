import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.18),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(232,180,184,0.12),transparent_40%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div className="space-y-6 text-primary-foreground">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-[0.25em] uppercase">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            New Season Edit
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl lg:text-6xl">
            Elevate your style with{" "}
            <span className="text-accent">Jayamani</span>
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
            Discover sarees, ethnic wear, denim, and everyday essentials crafted
            for modern Indian fashion. Free shipping on orders over ₹2,500.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold tracking-wide text-accent-foreground uppercase transition hover:brightness-110"
            >
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold tracking-wide text-primary-foreground uppercase transition hover:bg-white/10"
            >
              Our Story
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
              alt="Jayamani fashion collection"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div className="absolute -bottom-5 -left-4 rounded-2xl border border-white/10 bg-background/95 px-5 py-4 shadow-xl backdrop-blur sm:-left-8">
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              Best Sellers
            </p>
            <p className="mt-1 font-display text-2xl text-foreground">500+</p>
            <p className="text-sm text-muted-foreground">Happy customers</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Quick dispatch across Tamil Nadu and India",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "Safe checkout with trusted payment options",
  },
  {
    icon: Sparkles,
    title: "Premium Quality",
    description: "Handpicked fabrics and modern designs",
  },
];

export function FeatureBar() {
  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
        {features.map((feature) => (
          <div key={feature.title} className="flex items-start gap-4">
            <div className="rounded-2xl bg-muted p-3 text-accent">
              <feature.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
