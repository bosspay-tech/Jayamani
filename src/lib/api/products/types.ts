export interface ProductBody {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  compare_at_price?: number | null;
  image_url?: string;
  badge?: string | null;
  category_id?: string | null;
  sizes?: string[] | string;
  is_featured?: boolean;
  is_new_arrival?: boolean;
  is_popular?: boolean;
  stock?: number;
}

export interface ProductUpdateBody extends Partial<ProductBody> {}
