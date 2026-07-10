-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  price numeric(10, 2) not null,
  compare_at_price numeric(10, 2),
  image_url text,
  images text[] default '{}',
  sizes text[] default '{}',
  badge text,
  is_featured boolean default false,
  is_new_arrival boolean default false,
  is_popular boolean default false,
  stock int default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  created_at timestamptz default now()
);

alter table categories enable row level security;
alter table products enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages enable row level security;

drop policy if exists "Public read categories" on categories;
drop policy if exists "Public read products" on products;
drop policy if exists "Anyone can subscribe" on newsletter_subscribers;
drop policy if exists "Anyone can send contact" on contact_messages;

create policy "Public read categories" on categories for select using (true);
create policy "Public read products" on products for select using (true);
create policy "Anyone can subscribe" on newsletter_subscribers for insert with check (true);
create policy "Anyone can send contact" on contact_messages for insert with check (true);

create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_slug_idx on products(slug);
create index if not exists products_featured_idx on products(is_featured) where is_featured = true;
create index if not exists products_new_arrival_idx on products(is_new_arrival) where is_new_arrival = true;
create index if not exists products_popular_idx on products(is_popular) where is_popular = true;

-- User profiles (linked to Supabase Auth)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read own profile" on profiles;
drop policy if exists "Users can insert own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Admins manage categories" on categories;
drop policy if exists "Admins manage products" on products;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Admin policies for catalog management
create policy "Admins manage categories"
  on categories for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Admins manage products"
  on products for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

-- Make a user admin (replace email):
-- update profiles set is_admin = true where id = (select id from auth.users where email = 'you@example.com');

-- Auto-create profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Product image storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Admins upload product images" on storage.objects;
drop policy if exists "Admins update product images" on storage.objects;
drop policy if exists "Admins delete product images" on storage.objects;

create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Admins upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins update product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins delete product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from profiles where id = auth.uid() and is_admin = true
    )
  );

-- Orders and order items

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_number text not null unique,
  status text not null default 'pending',
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  billing_same_as_shipping boolean not null default true,
  billing_address text,
  billing_city text,
  billing_state text,
  billing_pincode text,
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  payment_txnid text,
  payment_id text,
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_image_url text,
  price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  size text,
  created_at timestamptz default now()
);

alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "Users read own orders" on orders;
drop policy if exists "Users create own orders" on orders;
drop policy if exists "Admins manage orders" on orders;
drop policy if exists "Users read own order items" on order_items;
drop policy if exists "Users create own order items" on order_items;
drop policy if exists "Admins manage order items" on order_items;

create policy "Users read own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Users create own orders"
  on orders for insert
  with check (auth.uid() = user_id or user_id is null);

create policy "Admins manage orders"
  on orders for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Users read own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Users create own order items"
  on order_items for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or orders.user_id is null)
    )
  );

create policy "Admins manage order items"
  on order_items for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- DollerpayX / BossPay bridge transaction mapping (service role only; no client policies)
create table if not exists public.bosspay_txns (
  pg_transaction_id text primary key,
  txn_id text not null,
  pg_type text not null,
  callback_url text not null,
  created_at timestamptz not null default now(),
  upi_intent jsonb,
  upi_minted_at bigint default 0
);

create index if not exists bosspay_txns_txn_id_idx on public.bosspay_txns (txn_id);

alter table public.bosspay_txns enable row level security;
