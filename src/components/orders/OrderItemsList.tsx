import Image from "next/image";
import type { OrderItem } from "@/lib/api/orders";
import { formatPrice } from "@/lib/utils";

interface OrderItemsListProps {
  items: OrderItem[];
  className?: string;
}

export function OrderItemsList({ items, className }: OrderItemsListProps) {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No items found.</p>;
  }

  return (
    <div className={className}>
      {items.map((item) => (
        <div key={item.id} className="flex gap-4">
          <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            {item.product_image_url && (
              <Image
                src={item.product_image_url}
                alt={item.product_name}
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="flex flex-1 items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">{item.product_name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-muted-foreground">
                <span>Qty: {item.quantity}</span>
                {item.size ? (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                    Size: {item.size}
                  </span>
                ) : null}
              </div>
            </div>
            <p className="shrink-0 font-semibold">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
