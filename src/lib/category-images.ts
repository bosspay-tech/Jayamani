export const categoryFallbackPhotos: Record<string, string> = {
  sarees:
    "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800",
  "t-shirts":
    "https://images.pexels.com/photos/1656687/pexels-photo-1656687.jpeg?auto=compress&cs=tinysrgb&w=800",
  jeans:
    "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=800",
  "ethnic-wear":
    "https://images.pexels.com/photos/1927771/pexels-photo-1927771.jpeg?auto=compress&cs=tinysrgb&w=800",
};

export function getCategoryImage(
  slug: string,
  imageUrl?: string | null
) {
  if (imageUrl && !imageUrl.includes("unsplash.com")) {
    return imageUrl;
  }
  return categoryFallbackPhotos[slug] ?? categoryFallbackPhotos.sarees;
}
