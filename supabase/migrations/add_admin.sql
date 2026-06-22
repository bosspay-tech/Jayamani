-- Add is_admin to existing profiles table (run if schema was applied earlier)
alter table profiles add column if not exists is_admin boolean default false;

-- Admin policies (safe to re-run with drop if exists)
drop policy if exists "Admins manage categories" on categories;
drop policy if exists "Admins manage products" on products;

create policy "Admins manage categories"
  on categories for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));

create policy "Admins manage products"
  on products for all
  using (exists (select 1 from profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from profiles where id = auth.uid() and is_admin = true));
