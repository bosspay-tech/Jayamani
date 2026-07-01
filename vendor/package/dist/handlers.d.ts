/**
 * Pure handler functions — one per bridge endpoint. Each takes the parsed
 * request (body string for POSTs, query + path params for GETs, pre-verified
 * signature), validates with Zod, and dispatches to the lender's PGHandlers.
 *
 * These are framework-agnostic: the web-fetch and Express adapters both
 * reuse them after normalizing the inbound request into the same shape.
 */
import { type BridgeHandlers, type CallbackPayload, type CollectResult, type HealthResult, type PayoutResult, type StatusResult } from './types.js';
import type { TxnStore } from './txnStore/types.js';
export interface HandlerContext {
    handlers: BridgeHandlers;
    txnStore: TxnStore;
    /** BossPay API base (e.g. `https://api.bosspay24.com`). Used to build `callback_url`. */
    bosspayApiBase: string;
    /** Package version exposed by `/health`. */
    version: string;
}
/**
 * POST /bosspay/v1/collect
 *
 * Mirrors [`class-bridge-api.php::handle_collect`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * After a successful provider call, persists the `pg_transaction_id` → BossPay
 * txn mapping so the lender's PG webhook can later look it up when forwarding
 * the async callback.
 */
export declare function handleCollect(ctx: HandlerContext, body: string): Promise<CollectResult>;
/**
 * POST /bosspay/v1/payout
 *
 * Mirrors [`class-bridge-api.php::handle_payout`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * If the lender's handlers do not implement `createPayout`, respond with 501
 * so BossPay's payout engine sees a clean "not implemented" signal.
 */
export declare function handlePayout(ctx: HandlerContext, body: string): Promise<PayoutResult>;
/**
 * GET /bosspay/v1/status/:pgTxnId?pg_type=…
 *
 * Mirrors [`class-bridge-api.php::handle_status`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * Resolves `pg_type` in this order:
 *   1. TxnStore mapping keyed by `:pgTxnId` (primary: true PG id),
 *   2. TxnStore mapping keyed by BossPay UUID (when BossPay calls with its UUID),
 *   3. `?pg_type=` query parameter (fallback).
 */
export declare function handleStatus(ctx: HandlerContext, params: {
    pgTxnId: string;
    pgType?: string;
}): Promise<StatusResult>;
/**
 * GET /bosspay/v1/health
 *
 * Mirrors [`class-bridge-api.php::handle_health`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * Reports the list of configured `pg_type` keys and whether each one's
 * `isAvailable()` resolves truthy (defaults to `true` when not provided).
 */
export declare function handleHealth(ctx: HandlerContext): Promise<HealthResult>;
/** Build the canonical callback URL BossPay expects. */
export declare function buildCallbackUrl(apiBase: string, pgType: string, txnId: string): string;
/** Validate a forward-callback payload before signing + POSTing. */
export declare function validateCallbackPayload(payload: unknown): CallbackPayload;
//# sourceMappingURL=handlers.d.ts.map