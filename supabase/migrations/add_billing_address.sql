-- Billing address on orders (optional separate from delivery/shipping address)
alter table public.orders add column if not exists billing_same_as_shipping boolean not null default true;
alter table public.orders add column if not exists billing_address text;
alter table public.orders add column if not exists billing_city text;
alter table public.orders add column if not exists billing_state text;
alter table public.orders add column if not exists billing_pincode text;
