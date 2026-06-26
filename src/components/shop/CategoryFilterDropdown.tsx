"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryFilterDropdownProps {
  categories: Category[];
  activeCategory?: string;
}

export function CategoryFilterDropdown({
  categories,
  activeCategory,
}: CategoryFilterDropdownProps) {
  const router = useRouter();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const slug = event.target.value;
    router.push(slug ? `/shop?category=${encodeURIComponent(slug)}` : "/shop");
  }

  return (
    <div className="relative min-w-[200px] sm:min-w-[220px]">
      <select
        value={activeCategory ?? ""}
        onChange={handleChange}
        aria-label="Filter by category"
        className={cn(
          "w-full appearance-none rounded-full border border-border bg-surface py-2.5 pr-10 pl-4 text-sm font-medium outline-none transition",
          "focus:border-accent focus:ring-2 focus:ring-accent/20",
          activeCategory ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.slug}>
            {category.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
