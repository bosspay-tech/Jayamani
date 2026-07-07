const APPAREL_CATEGORY_SLUGS = new Set(["t-shirts", "jeans", "jeans-bottoms"]);
const ONE_SIZE_CATEGORY_SLUGS = new Set(["sarees", "ethnic-wear"]);

export const DEFAULT_APPAREL_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export const DEFAULT_ONE_SIZE = ["Free Size"] as const;

export function normalizeSizes(sizes: string[] | null | undefined): string[] {
  if (!Array.isArray(sizes)) return [];

  return sizes
    .map((size) => size.trim())
    .filter((size, index, list) => size.length > 0 && list.indexOf(size) === index);
}

export function parseSizesInput(value: string): string[] {
  return normalizeSizes(
    value
      .split(/[,;\n|/]+/)
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

export function formatSizesInput(sizes: string[] | null | undefined): string {
  return normalizeSizes(sizes).join(", ");
}

export function defaultSizesForCategorySlug(slug?: string | null): string[] {
  if (!slug) return [];

  if (APPAREL_CATEGORY_SLUGS.has(slug)) {
    return [...DEFAULT_APPAREL_SIZES];
  }

  if (ONE_SIZE_CATEGORY_SLUGS.has(slug)) {
    return [...DEFAULT_ONE_SIZE];
  }

  return [];
}

export function resolveProductSizes(
  sizes: string[] | null | undefined,
  categorySlug?: string | null
): string[] {
  const normalized = normalizeSizes(sizes);
  if (normalized.length > 0) return normalized;
  return defaultSizesForCategorySlug(categorySlug);
}

export function cartLineKey(productId: string, size?: string) {
  return size ? `${productId}::${size}` : productId;
}
