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
export class MemoryTxnStore {
    byPgTxnId = new Map();
    byBossPayTxnId = new Map();
    ttlMs;
    constructor(opts = {}) {
        this.ttlMs = opts.ttlMs ?? 7 * 24 * 60 * 60 * 1000;
    }
    async set(pgTransactionId, data) {
        const mapping = { ...data, created_at: new Date().toISOString() };
        this.byPgTxnId.set(pgTransactionId, mapping);
        this.byBossPayTxnId.set(data.txn_id, pgTransactionId);
    }
    async get(pgTransactionId) {
        const mapping = this.byPgTxnId.get(pgTransactionId);
        if (!mapping)
            return null;
        if (this.isExpired(mapping)) {
            this.byPgTxnId.delete(pgTransactionId);
            this.byBossPayTxnId.delete(mapping.txn_id);
            return null;
        }
        return mapping;
    }
    async getByBosspayTxnId(txnId) {
        const pgTxnId = this.byBossPayTxnId.get(txnId);
        if (!pgTxnId)
            return null;
        return this.get(pgTxnId);
    }
    async setUpiIntent(txnId, snapshot) {
        const pgTxnId = this.byBossPayTxnId.get(txnId);
        if (!pgTxnId)
            return;
        const mapping = this.byPgTxnId.get(pgTxnId);
        if (!mapping || !mapping.upi_intent)
            return;
        this.byPgTxnId.set(pgTxnId, {
            ...mapping,
            upi_intent: {
                ...mapping.upi_intent,
                upi_qr_value: snapshot.upi_qr_value,
                intent_tr: snapshot.intent_tr,
                minted_at: snapshot.minted_at,
            },
        });
    }
    async delete(pgTransactionId) {
        const mapping = this.byPgTxnId.get(pgTransactionId);
        this.byPgTxnId.delete(pgTransactionId);
        if (mapping)
            this.byBossPayTxnId.delete(mapping.txn_id);
    }
    isExpired(mapping) {
        const createdAt = Date.parse(mapping.created_at);
        if (Number.isNaN(createdAt))
            return false;
        return Date.now() - createdAt > this.ttlMs;
    }
}
//# sourceMappingURL=memory.js.map