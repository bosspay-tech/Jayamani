-- Add optional sizes array to products (for apparel sizing)
alter table public.products add column if not exists sizes text[] default '{}';

-- Store selected size on each order line item
alter table public.order_items add column if not exists size text;

-- Backfill default sizes for existing products without sizes
update public.products p
set sizes = array['Free Size']
from public.categories c
where p.category_id = c.id
  and c.slug in ('sarees', 'ethnic-wear')
  and coalesce(array_length(p.sizes, 1), 0) = 0;

update public.products p
set sizes = array['S', 'M', 'L', 'XL', 'XXL']
from public.categories c
where p.category_id = c.id
  and c.slug in ('t-shirts', 'jeans')
  and coalesce(array_length(p.sizes, 1), 0) = 0;
