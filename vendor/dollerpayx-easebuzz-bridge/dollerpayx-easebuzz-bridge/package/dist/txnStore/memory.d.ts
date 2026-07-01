import type { TxnMapping, TxnStore } from './types.js';
/**
 * In-process `TxnStore` with TTL-based expiry. Suitable for single-instance
 * development servers; **not** suitable for Supabase Edge Functions (invoked
 * in ephemeral workers that do not share memory) or any horizontally scaled
 * deployment — mappings created on one instance will not be visible to
 * another, which breaks callback forwarding.
 *
 * TTL defaults to 7 days to match the WP plugin's cleanup cadence
 * (`class-txn-store.php::cleanup`).
 */
export declare class MemoryTxnStore implements TxnStore {
    private readonly byPgTxnId;
    private readonly byBossPayTxnId;
    private readonly ttlMs;
    constructor(opts?: {
        ttlMs?: number;
    });
    set(pgTransactionId: string, data: Omit<TxnMapping, 'created_at'>): Promise<void>;
    get(pgTransactionId: string): Promise<TxnMapping | null>;
    getByBosspayTxnId(txnId: string): Promise<TxnMapping | null>;
    setUpiIntent(txnId: string, snapshot: {
        upi_qr_value: string;
        intent_tr: string;
        minted_at: number;
    }): Promise<void>;
    delete(pgTransactionId: string): Promise<void>;
    private isExpired;
}
//# sourceMappingURL=memory.d.ts.map