-- DollerpayX / WordPress bridge transaction mapping (used by @dpx/bridge-node SupabaseTxnStore)
create table if not exists public.bosspay_txns (
  pg_transaction_id text primary key,
  txn_id text not null,
  pg_type text not null,
  callback_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists bosspay_txns_txn_id_idx on public.bosspay_txns (txn_id);
