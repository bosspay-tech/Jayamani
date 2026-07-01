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
    /** When set, journey events are POSTed to BossPay `/bridge/events/:txnId`. */
    bridgeSecret?: string;
    /**
     * Optional resolver for the lender's bridge origin (the host that
     * AirPay's portal whitelist accepts). Used by the AirPay v4 direct
     * mint to set `Referer` and `mer_dom`. If unset, defaults to the
     * inbound `Origin`/`Host` header of the DPX mint request, which is
     * usually the WP host — but lender bridges hosted on a path-style
     * Supabase Edge URL MUST override this with their public domain.
     */
    airpayV4SourceDomain?: string;
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
export type MintAirpayV4Result = {
    ok: true;
    orderid: string;
    /**
     * Raw `upi://pay?…` deeplink when AirPay 30x'd directly to a UPI
     * intent. Empty when AirPay went to a hosted session page.
     */
    upi_intent_url: string;
    /**
     * AirPay-hosted UPI session URL (typically on
     * `payments.airpay.co.in`) when AirPay 30x'd to a confirmation
     * page. GET-able from any origin — DPX runs `mineUpiIntent` on
     * this to extract the customer's `upi://`. Empty when AirPay
     * went directly to a UPI intent.
     */
    hosted_page_url: string;
    /** Best-effort PG-side reference. May be empty when AirPay didn't echo. */
    ap_transactionid: string;
    raw: {
        status: number;
        location: string;
        body_snippet: string;
        sent_orderid: string;
    };
} | {
    ok: false;
    error: string;
    stage: 'validate' | 'oauth' | 'post' | 'parse' | 'deprecated';
    orderid: string;
    status?: number;
    body_snippet?: string;
};
/**
 * Body-only POST. DPX HMAC-signs the JSON; we validate, call
 * {@link mintAirpayV4Intent} (which does the server-side POST to AirPay
 * from the bridge's whitelisted origin), and return the parsed URLs.
 * Always 200 OK at the HTTP layer — `ok: false` lives in the JSON
 * body so the WordPress / Express / Edge starters can log and surface
 * it uniformly.
 */
export declare function handleMintAirpayV4(ctx: HandlerContext, body: string): Promise<MintAirpayV4Result>;
export type AirpayProxyResult = {
    status: number;
    body: string;
};
/**
 * Relay one AirPay request from the bridge's whitelisted IP. Returns the
 * upstream `{ status, body }` verbatim — DPX does all parsing/decryption.
 * Throws a 502 `BridgeError` for a disallowed host or upstream network
 * failure so DPX's transport maps it onto its existing `*_network` paths.
 */
export declare function handleAirpayProxy(_ctx: HandlerContext, body: string): Promise<AirpayProxyResult>;
/** Build the canonical callback URL BossPay expects. */
export declare function buildCallbackUrl(apiBase: string, pgType: string, txnId: string): string;
export interface UpiIntentRenderResult {
    /** HTML splash body — sets `window.location.href = upi://...` + meta-refresh. */
    html: string;
    /** Whether the deeplink was served from cache or freshly minted. */
    source: 'cache' | 'mint';
    /** Latency of the mint chain in ms; 0 on cache hit. */
    mintMs: number;
    /** Parsed 18-digit NPCI `tr`; `''` if SabPaisa returned a deeplink without one. */
    intentTr: string;
}
/**
 * GET /bosspay/v1/upi/:txnId
 *
 * Cache-first render of the SabPaisa UPI-intent deeplink splash. Mirrors
 * [`class-bridge-api.php::handle_upi_intent`](plugins/bosspay-bridge/includes/class-bridge-api.php)
 * (WP v1.9.1) line-for-line, including the 10-minute cache TTL that sidesteps
 * SabPaisa's single-use `sabPaisaInit` binding.
 *
 * Throws:
 *   - 404 if `txnId` has no mapping (or no UPI-intent bag stashed).
 *   - 500 if the fresh mint fails (body carries SabPaisa's snippet verbatim).
 */
export declare function handleUpiIntent(ctx: HandlerContext, params: {
    txnId: string;
}): Promise<UpiIntentRenderResult>;
/** Validate a forward-callback payload before signing + POSTing. */
export declare function validateCallbackPayload(payload: unknown): CallbackPayload;
//# sourceMappingURL=handlers.d.ts.map