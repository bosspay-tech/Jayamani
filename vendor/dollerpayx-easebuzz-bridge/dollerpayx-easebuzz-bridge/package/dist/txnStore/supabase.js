/**
 * Expected schema (see `starters/supabase-edge/supabase/migrations/0001_bosspay_txns.sql`
 * and the follow-up `0002_bosspay_txns_upi_intent.sql` for the UPI-intent columns):
 *
 *   create table public.bosspay_txns (
 *     pg_transaction_id text primary key,
 *     txn_id           text not null,
 *     pg_type          text not null,
 *     callback_url     text not null,
 *     created_at       timestamptz not null default now(),
 *     upi_intent       jsonb,   -- mint inputs + cached {upi_qr_value, intent_tr, minted_at}
 *     upi_minted_at    bigint   -- epoch seconds; 0 = never
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
        const row = {
            pg_transaction_id: pgTransactionId,
            txn_id: data.txn_id,
            pg_type: data.pg_type,
            callback_url: data.callback_url,
        };
        if (data.upi_intent) {
            row['upi_intent'] = data.upi_intent;
            row['upi_minted_at'] = data.upi_intent.minted_at;
        }
        const { error } = await this.client.from(this.table).upsert(row, {
            onConflict: 'pg_transaction_id',
        });
        if (error) {
            throw new Error(`SupabaseTxnStore.set failed: ${error.message}`);
        }
    }
    async get(pgTransactionId) {
        const { data, error } = await this.client
            .from(this.table)
            .select('pg_transaction_id, txn_id, pg_type, callback_url, created_at, upi_intent')
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
            .select('pg_transaction_id, txn_id, pg_type, callback_url, created_at, upi_intent')
            .eq('txn_id', txnId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) {
            throw new Error(`SupabaseTxnStore.getByBosspayTxnId failed: ${error.message}`);
        }
        return data ? this.toMapping(data) : null;
    }
    async setUpiIntent(txnId, snapshot) {
        // We merge into the existing `upi_intent` jsonb rather than overwriting it so
        // the mint inputs (encData, client_txn_id, etc.) survive a fresh mint. We do
        // this in-process because Supabase-JS does not expose a jsonb_set helper.
        const mapping = await this.getByBosspayTxnId(txnId);
        if (!mapping || !mapping.upi_intent)
            return;
        const updated = {
            ...mapping.upi_intent,
            upi_qr_value: snapshot.upi_qr_value,
            intent_tr: snapshot.intent_tr,
            minted_at: snapshot.minted_at,
        };
        const { error } = await this.client
            .from(this.table)
            .update({
            upi_intent: updated,
            upi_minted_at: snapshot.minted_at,
        })
            .eq('txn_id', txnId);
        if (error) {
            throw new Error(`SupabaseTxnStore.setUpiIntent failed: ${error.message}`);
        }
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
        const base = {
            txn_id: String(row['txn_id'] ?? ''),
            pg_type: String(row['pg_type'] ?? ''),
            callback_url: String(row['callback_url'] ?? ''),
            created_at: String(row['created_at'] ?? new Date().toISOString()),
        };
        const upiIntent = row['upi_intent'];
        if (upiIntent && typeof upiIntent === 'object') {
            base.upi_intent = upiIntent;
        }
        return base;
    }
}
//# sourceMappingURL=supabase.js.map