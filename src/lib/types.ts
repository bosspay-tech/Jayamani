export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  images: string[];
  badge: string | null;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_popular: boolean;
  stock: number;
  created_at: string;
  categories?: Category | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
