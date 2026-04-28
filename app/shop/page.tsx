import { ProductCard } from "@/components/product-card";
import { PageHero } from "@/components/page-hero";
import { getCategoryCounts, getShopProducts } from "@/lib/products";
import { Search } from "lucide-react";

const tags = ["ARRIVALS", "BEST", "Dress", "GLAM", "NEW", "READY", "SAREE", "SELLER", "SELLERS", "SHIP", "TO"];

export default function ShopPage() {
  const products = getShopProducts().slice(0, 12);
  const categories = getCategoryCounts();

  return (
    <main>
      <PageHero title="Shop" />
      <section className="shop-wrap container">
        <aside className="shop-sidebar">
          <label className="sidebar-search">
            <span>Search products...</span>
            <Search size={18} />
          </label>
          <h3>Categories</h3>
          <ul className="category-list">
            {categories.slice(0, 18).map((category) => (
              <li key={category.name}>
                <span>{category.name}</span>
                <em>({category.count})</em>
              </li>
            ))}
          </ul>

          <h3>Filter By</h3>
          <div className="range-line" />
          <div className="filter-row">
            <button>Filter</button>
            <span>Price: ₹0 - ₹20,000</span>
          </div>

          <h3>Color</h3>
          <ul className="category-list small">
            {["Black", "Blue", "Maroon", "Orange", "Red", "White"].map((color, index) => (
              <li key={color}>
                <span>{color}</span>
                <em>({index + 3})</em>
              </li>
            ))}
          </ul>

          <h3>Product Tags</h3>
          <div className="tag-cloud">
            {tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </aside>

        <div className="shop-main">
          <div className="shop-toolbar">
            <span>Showing 1-12 of 566 results</span>
            <select aria-label="Sort products">
              <option>Default sorting</option>
              <option>Sort by popularity</option>
              <option>Sort by latest</option>
            </select>
          </div>
          <div className="shop-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <nav className="pagination" aria-label="Pagination">
            <strong>1</strong>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>...</span>
            <span>46</span>
            <span>47</span>
            <span>48</span>
            <span>NEXT</span>
          </nav>
        </div>
      </section>
    </main>
  );
}
