/**
 * TxnStore — persistent mapping `pg_transaction_id` → BossPay txn metadata.
 *
 * Mirrors the WP plugin's [`class-txn-store.php`](plugins/bosspay-bridge/includes/class-txn-store.php).
 * Written on `/collect` after the lender returns a `pg_transaction_id`;
 * consulted by `forwardBossPayCallback` when the PG sends its async callback
 * (the callback only carries the PG's id, not the BossPay `txn_id`).
 *
 * Also supports reverse lookup by `txn_id` (BossPay UUID) so `/status`
 * requests made with either identifier resolve correctly.
 */
export interface TxnMapping {
    /** BossPay transaction id (UUID from `transactions.txn_id`). */
    txn_id: string;
    /** PG type key (must match `lender_pgs.pg_type`, e.g. `sabpaisa`). */
    pg_type: string;
    /** Absolute URL to POST the PG callback to (`{apiBase}/callbacks/{pg}/{txn_id}`). */
    callback_url: string;
    /** ISO-8601 creation timestamp — used by cleanup and debugging. */
    created_at: string;
}
export interface TxnStore {
    /** Upsert a mapping keyed by `pg_transaction_id`. */
    set(pgTransactionId: string, data: Omit<TxnMapping, 'created_at'>): Promise<void>;
    /** Look up by `pg_transaction_id` (primary key). */
    get(pgTransactionId: string): Promise<TxnMapping | null>;
    /** Look up by BossPay `txn_id` (secondary index). */
    getByBosspayTxnId(txnId: string): Promise<TxnMapping | null>;
    /** Delete a single mapping. Optional — useful for tests. */
    delete?(pgTransactionId: string): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map