/**
 * Expected schema (see `starters/supabase-edge/supabase/migrations/0001_bosspay_txns.sql`):
 *
 *   create table public.bosspay_txns (
 *     pg_transaction_id text primary key,
 *     txn_id           text not null,
 *     pg_type          text not null,
 *     callback_url     text not null,
 *     created_at       timestamptz not null default now()
 *   );
 *   create index bosspay_txns_txn_id_idx on public.bosspay_txns (txn_id);
 */
const DEFAULT_TABLE = 'bosspay_txns';
/**
 * Postgres-backed `TxnStore` using `@supabase/supabase-js`. Safe for
 * serverless / edge deployments because every call reads/writes the
 * shared database row — no in-process state.
 *
 * Construct with the **service role key**; the table is not intended to be
 * exposed to the client.
 */
export class SupabaseTxnStore {
    client;
    table;
    constructor(opts) {
        this.client = opts.client;
        this.table = opts.table ?? DEFAULT_TABLE;
    }
    async set(pgTransactionId, data) {
        const { error } = await this.client.from(this.table).upsert({
            pg_transaction_id: pgTransactionId,
            txn_id: data.txn_id,
            pg_type: data.pg_type,
            callback_url: data.callback_url,
        }, { onConflict: 'pg_transaction_id' });
        if (error) {
            throw new Error(`SupabaseTxnStore.set failed: ${error.message}`);
        }
    }
    async get(pgTransactionId) {
        const { data, error } = await this.client
            .from(this.table)
            .select('pg_transaction_id, txn_id, pg_type, callback_url, created_at')
            .eq('pg_transaction_id', pgTransactionId)
            .maybeSingle();
        if (error) {
            throw new Error(`SupabaseTxnStore.get failed: ${error.message}`);
        }
        return data ? this.toMapping(data) : null;
    }
    async getByBosspayTxnId(txnId) {
        const { data, error } = await this.client
            .from(this.table)
            .select('pg_transaction_id, txn_id, pg_type, callback_url, created_at')
            .eq('txn_id', txnId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) {
            throw new Error(`SupabaseTxnStore.getByBosspayTxnId failed: ${error.message}`);
        }
        return data ? this.toMapping(data) : null;
    }
    async delete(pgTransactionId) {
        const { error } = await this.client
            .from(this.table)
            .delete()
            .eq('pg_transaction_id', pgTransactionId);
        if (error) {
            throw new Error(`SupabaseTxnStore.delete failed: ${error.message}`);
        }
    }
    toMapping(row) {
        return {
            txn_id: String(row['txn_id'] ?? ''),
            pg_type: String(row['pg_type'] ?? ''),
            callback_url: String(row['callback_url'] ?? ''),
            created_at: String(row['created_at'] ?? new Date().toISOString()),
        };
    }
}
//# sourceMappingURL=supabase.js.map