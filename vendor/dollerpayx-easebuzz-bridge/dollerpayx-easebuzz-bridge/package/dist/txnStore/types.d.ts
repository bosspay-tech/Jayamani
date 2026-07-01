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
/**
 * Snapshot of the SabPaisa UPI-intent mint: inputs required to re-mint on cache
 * miss + the cached deeplink so we can serve /upi/{txnId} in <20ms on repeat
 * visits. SabPaisa's `sabPaisaInit` is single-use per encData, so we MUST cache
 * (see WP v1.9.1 retrospective).
 */
export interface UpiIntentRecord {
    /** Inputs for the two-POST mint chain — see `UpiIntentMintInputsSchema`. */
    inputs: {
        enc_data: string;
        client_code: string;
        client_txn_id: string;
        action_url: string;
        amount_rupees: number;
        email: string;
        phone: string;
        sabpaisa_client_id: number;
        sabpaisa_client_name: string;
        sabpaisa_endpoint_json: Record<string, unknown> & {
            epId: number;
        };
        display_vpa?: string | null;
        display_payee_name?: string | null;
    };
    /** Cached `upi://pay?...` deeplink; empty string when not yet minted. */
    upi_qr_value: string;
    /** Parsed 18-digit `tr` query param from the deeplink. */
    intent_tr: string;
    /** Epoch seconds of last successful mint. 0 when never minted. */
    minted_at: number;
}
export interface TxnMapping {
    /** BossPay transaction id (UUID from `transactions.txn_id`). */
    txn_id: string;
    /** PG type key (must match `lender_pgs.pg_type`, e.g. `sabpaisa`). */
    pg_type: string;
    /** Absolute URL to POST the PG callback to (`{apiBase}/callbacks/{pg}/{txn_id}`). */
    callback_url: string;
    /** ISO-8601 creation timestamp — used by cleanup and debugging. */
    created_at: string;
    /** Optional UPI-intent mint cache. Present only when lender opts in. */
    upi_intent?: UpiIntentRecord;
}
export interface TxnStore {
    /** Upsert a mapping keyed by `pg_transaction_id`. */
    set(pgTransactionId: string, data: Omit<TxnMapping, 'created_at'>): Promise<void>;
    /** Look up by `pg_transaction_id` (primary key). */
    get(pgTransactionId: string): Promise<TxnMapping | null>;
    /** Look up by BossPay `txn_id` (secondary index). */
    getByBosspayTxnId(txnId: string): Promise<TxnMapping | null>;
    /**
     * Persist a fresh UPI-intent mint (deeplink + tr + timestamp) on an existing
     * mapping, keyed by BossPay `txn_id` (customer-facing id). Implementations
     * MUST atomically update the row when present and no-op when the mapping is
     * missing. Optional — stores that do not support UPI-intent caching can omit.
     */
    setUpiIntent?(txnId: string, snapshot: {
        upi_qr_value: string;
        intent_tr: string;
        minted_at: number;
    }): Promise<void>;
    /** Delete a single mapping. Optional — useful for tests. */
    delete?(pgTransactionId: string): Promise<void>;
}
//# sourceMappingURL=types.d.ts.map