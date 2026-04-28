import { Heart } from "lucide-react";
import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="product-card">
      <a className="product-image" href="#">
        {product.discount ? <span className="sale-badge">-{product.discount}%</span> : null}
        <img src={product.image} alt={product.name} loading="lazy" />
      </a>
      <h3>{product.name}</h3>
      <p className="price">{product.priceLabel}</p>
      <button className="wishlist" type="button">
        <Heart size={13} />
        Add to Wishlist
      </button>
    </article>
  );
}
