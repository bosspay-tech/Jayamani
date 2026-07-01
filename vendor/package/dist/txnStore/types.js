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
export {};
//# sourceMappingURL=types.js.map