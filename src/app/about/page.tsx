import Image from "next/image";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata = {
  title: "About Us",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="border-b border-border bg-primary py-14 text-primary-foreground sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
            Our Story
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl">About Jayamani Export</h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
          <Image
            src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=80"
            alt="Jayamani fashion studio"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="space-y-5 text-muted-foreground">
          <h2 className="font-display text-3xl text-foreground">
            Crafting modern Indian fashion
          </h2>
          <p>
            Jayamani Export brings together traditional elegance and contemporary
            style. From ready-to-wear sarees and ethnic sets to everyday t-shirts
            and denim, we curate collections that help you express your personality
            with confidence.
          </p>
          <p>
            Based in Tiruvallur, Tamil Nadu, we serve customers across India with
            quality fabrics, thoughtful designs, and reliable service. Our mission
            is to make premium fashion accessible while celebrating Indian
            craftsmanship.
          </p>
          <div className="grid gap-4 pt-2 sm:grid-cols-3">
            {[
              { value: "500+", label: "Products" },
              { value: "10%", label: "First-order offer" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-surface p-4 text-center"
              >
                <p className="font-display text-2xl text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs tracking-wide uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
