import type { SupabaseClient } from '@supabase/supabase-js';
import type { TxnMapping, TxnStore } from './types.js';
export interface SupabaseTxnStoreOptions {
    /** Pre-constructed Supabase client (service role key — bridge runs server-side). */
    client: SupabaseClient;
    /** Override the table name if the lender's schema uses a different one. */
    table?: string;
}
/**
 * Postgres-backed `TxnStore` using `@supabase/supabase-js`. Safe for
 * serverless / edge deployments because every call reads/writes the
 * shared database row — no in-process state.
 *
 * Construct with the **service role key**; the table is not intended to be
 * exposed to the client.
 */
export declare class SupabaseTxnStore implements TxnStore {
    private readonly client;
    private readonly table;
    constructor(opts: SupabaseTxnStoreOptions);
    set(pgTransactionId: string, data: Omit<TxnMapping, 'created_at'>): Promise<void>;
    get(pgTransactionId: string): Promise<TxnMapping | null>;
    getByBosspayTxnId(txnId: string): Promise<TxnMapping | null>;
    setUpiIntent(txnId: string, snapshot: {
        upi_qr_value: string;
        intent_tr: string;
        minted_at: number;
    }): Promise<void>;
    delete(pgTransactionId: string): Promise<void>;
    private toMapping;
}
//# sourceMappingURL=supabase.d.ts.map