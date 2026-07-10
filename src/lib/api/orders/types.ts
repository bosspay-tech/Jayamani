export interface OrderItemInput {
  productId: string;
  productSlug?: string;
  quantity: number;
  size?: string;
}

export interface CreateOrderBody {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  state: string;
  pincode: string;
  billingSameAsShipping?: boolean;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPincode?: string;
  items: OrderItemInput[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string | null;
  price: number;
  quantity: number;
  size?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  state: string;
  pincode: string;
  billing_same_as_shipping?: boolean;
  billing_address?: string | null;
  billing_city?: string | null;
  billing_state?: string | null;
  billing_pincode?: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  created_at: string;
  order_items?: OrderItem[];
}
