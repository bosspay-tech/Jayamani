"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem, Product } from "@/lib/types";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "jayamani-cart-v2";
const LEGACY_STORAGE_KEY = "jayamani-cart";

type LegacyCartItem = {
  id: string;
  name: string;
  image?: string;
  unitPrice?: number;
  quantity?: number;
};

function toNumber(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeProduct(product: Product): Product | null {
  const price = toNumber(product.price);
  if (price === null) return null;

  return {
    ...product,
    price,
    stock: toNumber(product.stock) ?? 0,
  };
}

function isValidProduct(product: unknown): product is Product {
  if (typeof product !== "object" || product === null) return false;
  if (!("id" in product) || !("name" in product) || !("price" in product)) {
    return false;
  }

  const candidate = product as Product;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    toNumber(candidate.price) !== null
  );
}

function isValidCartItem(item: unknown): item is CartItem {
  if (
    typeof item !== "object" ||
    item === null ||
    !("quantity" in item) ||
    typeof (item as CartItem).quantity !== "number" ||
    (item as CartItem).quantity < 1 ||
    !isValidProduct((item as CartItem).product)
  ) {
    return false;
  }

  return true;
}

function migrateLegacyItem(item: LegacyCartItem): CartItem | null {
  if (!item.id || !item.name || typeof item.unitPrice !== "number") {
    return null;
  }

  return {
    quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
    product: {
      id: item.id,
      category_id: null,
      name: item.name,
      slug: item.id,
      description: null,
      price: item.unitPrice,
      compare_at_price: null,
      image_url: item.image ?? null,
      images: item.image ? [item.image] : [],
      badge: null,
      is_featured: false,
      is_new_arrival: false,
      is_popular: false,
      stock: 100,
      created_at: new Date().toISOString(),
    },
  };
}

function normalizeCartItem(item: unknown): CartItem | null {
  if (typeof item === "object" && item !== null && "unitPrice" in item) {
    const legacy = migrateLegacyItem(item as LegacyCartItem);
    if (!legacy) return null;
    const product = normalizeProduct(legacy.product);
    if (!product) return null;
    return { quantity: legacy.quantity, product };
  }

  if (!isValidCartItem(item)) return null;

  const cartItem = item as CartItem;
  const product = normalizeProduct(cartItem.product);
  if (!product) return null;

  return {
    quantity: cartItem.quantity,
    product,
  };
}

function parseStoredCart(raw: string): CartItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeCartItem)
      .filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  const current = localStorage.getItem(STORAGE_KEY);
  if (current) {
    return parseStoredCart(current);
  }

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return [];

  const migrated = parseStoredCart(legacy);
  if (migrated.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  }
  localStorage.removeItem(LEGACY_STORAGE_KEY);

  return migrated;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const validItems = items.filter(isValidCartItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validItems));

    if (validItems.length !== items.length) {
      setItems(validItems);
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const normalized = normalizeProduct(product);
    if (!normalized) return;

    setItems((current) => {
      const existing = current.find((item) => item.product.id === normalized.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === normalized.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { product: normalized, quantity }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((current) =>
        current.filter((item) => item.product.id !== productId)
      );
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const validItems = items.filter(
      (item) => isValidCartItem(item)
    );
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = validItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    return {
      items: validItems,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [items, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
