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
  subtotal numeric(10, 2) not null,
  shipping numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
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
