/**
 * Composition root — `createBossPayBridge` wires up the handlers, the txn
 * store, and the HMAC secret into a single `{ fetch, forwardCallback }`
 * object that lender applications can mount with one line of code.
 */
import { type ForwardCallbackOptions, type ForwardCallbackResult } from './callbackForwarder.js';
import type { BridgeHandlers } from './types.js';
import type { TxnStore } from './txnStore/types.js';
export interface CreateBridgeOptions {
    /** Shared secret configured as `lender_pgs.credentials.bridge_secret` on BossPay. */
    bridgeSecret: string;
    /** BossPay API base, e.g. `https://api.bosspay24.com`. No trailing slash required. */
    bosspayApiBase: string;
    /** Lender's PG handlers, keyed by `pg_type`. */
    handlers: BridgeHandlers;
    /** Persistent txn mapping store (Supabase for production, memory for dev). */
    txnStore: TxnStore;
    /** Package/instance version string returned by `/health`. */
    version?: string;
    /** Callback retry tuning — forwarded to `forwardBossPayCallback`. */
    callback?: {
        maxAttempts?: number;
        initialBackoffMs?: number;
        timeoutMs?: number;
    };
    /**
     * Public origin of THIS bridge host as it appears on AirPay's portal-
     * whitelisted domains list (e.g. `'https://luxeria.in'`). Used by the
     * `/dpx-airpay/v1/mint-airpay-v4` handler to set the `Referer` header
     * and base64-encode `mer_dom` on the Simple Transaction POST. AirPay
     * rejects mints whose Referer / mer_dom don't match the portal config,
     * so this MUST be set when serving AirPay collects.
     */
    airpayV4SourceDomain?: string;
}
export interface BossPayBridge {
    /** Web-fetch handler: `(req: Request) => Promise<Response>`. */
    fetch: (req: Request) => Promise<Response>;
    /** Forward a PG webhook back to BossPay with HMAC signing + retry. */
    forwardCallback: (opts: ForwardCallbackOptions) => Promise<ForwardCallbackResult>;
}
export declare function createBossPayBridge(opts: CreateBridgeOptions): BossPayBridge;
//# sourceMappingURL=bridge.d.ts.map