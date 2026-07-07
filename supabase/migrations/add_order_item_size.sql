-- Quick fix for checkout: store selected size on order line items
alter table public.order_items add column if not exists size text;
