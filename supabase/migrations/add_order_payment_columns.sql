-- Run in Supabase SQL Editor if orders table already exists
alter table orders add column if not exists payment_txnid text;
alter table orders add column if not exists payment_id text;
