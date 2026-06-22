import Image from "next/image";
import Link from "next/link";
import { getCategoryImage } from "@/lib/category-images";
import type { Category } from "@/lib/types";

const fallbackCategories = [
  { name: "Sarees", slug: "sarees" },
  { name: "T-Shirts", slug: "t-shirts" },
  { name: "Jeans", slug: "jeans" },
  { name: "Ethnic Wear", slug: "ethnic-wear" },
];

interface CategoryGridProps {
  categories: Category[];
  coverImages?: Record<string, string>;
}

export function CategoryGrid({ categories, coverImages = {} }: CategoryGridProps) {
  const items =
    categories.length > 0
      ? categories.map((category) => ({
          name: category.name,
          slug: category.slug,
          image: getCategoryImage(
            category.slug,
            coverImages[category.slug] ?? category.image_url
          ),
        }))
      : fallbackCategories.map((category) => ({
          ...category,
          image: getCategoryImage(
            category.slug,
            coverImages[category.slug]
          ),
        }));

  return (
    <section className="bg-muted/40 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] text-accent uppercase">
            Shop by Category
          </p>
          <h2 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
            Find your perfect look
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((category) => (
            <Link
              key={category.slug}
              href={`/shop?category=${category.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-3xl"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-display text-2xl text-white">{category.name}</p>
                <p className="mt-1 text-sm text-white/80 transition group-hover:text-accent">
                  Explore collection →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
