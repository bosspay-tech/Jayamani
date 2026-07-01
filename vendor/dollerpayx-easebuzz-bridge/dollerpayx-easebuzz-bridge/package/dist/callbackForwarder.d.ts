/**
 * Forwards the PG's async webhook back to BossPay at
 * `POST {apiBase}/callbacks/{pg_type}/{txn_id}` with an HMAC-signed body.
 *
 * Called from the lender's PG-specific webhook handler after the lender has
 * verified the PG's own signature. The bridge looks up the mapping stored at
 * `/collect` time (keyed by `pg_transaction_id`) to find the BossPay txn id
 * that the PG does not know about.
 */
import { type CallbackPayload } from './types.js';
import type { TxnStore } from './txnStore/types.js';
export interface ForwardCallbackOptions {
    /** PG type key — must match what was stored at `/collect` time. */
    pgType: string;
    /** The PG's transaction id (primary lookup key in the txn store). */
    pgTransactionId: string;
    /** Normalized callback payload to send to BossPay. */
    payload: CallbackPayload;
}
export interface ForwardCallbackDeps {
    txnStore: TxnStore;
    bridgeSecret: string;
    /** BossPay API base — used as a fallback when the txn store row is missing. */
    bosspayApiBase: string;
    /** Total number of attempts (including the first). Default 3. */
    maxAttempts?: number;
    /** Initial backoff in ms; doubled each retry. Default 500ms. */
    initialBackoffMs?: number;
    /** Per-attempt request timeout in ms. Default 15s. */
    timeoutMs?: number;
}
export interface ForwardCallbackResult {
    status: number;
    attempts: number;
    body: string;
}
/**
 * Signed POST with exponential-backoff retry on 5xx / network errors.
 * 2xx and 4xx are treated as terminal — BossPay's callback endpoint
 * responds 200 for both valid and "already processed" callbacks, and 4xx
 * means we mis-constructed the request (retrying won't help).
 */
export declare function forwardBossPayCallback(opts: ForwardCallbackOptions, deps: ForwardCallbackDeps): Promise<ForwardCallbackResult>;
//# sourceMappingURL=callbackForwarder.d.ts.map