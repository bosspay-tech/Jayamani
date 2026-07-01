/**
 * Easebuzz UPI-intent mint + status + webhook verification for the DollerpayX
 * bridge.
 *
 * Easebuzz is a plaintext JSON/REST PG (no encrypted SPA, no HTML scraping).
 * The `upi://pay?...` deeplink is produced by a two-call server-to-server
 * chain, both driven from THIS bridge host (the lender's Easebuzz merchant
 * key/salt live here, never on the DollerpayX backend):
 *
 *   1. POST `${payBase}/payment/initiateLink`         → `access_key`
 *      (application/x-www-form-urlencoded, SHA-512 request hash)
 *   2. POST `${payBase}/webservice/submitInitiatePayment/` → `qr_link`
 *      (multipart/form-data, `paymentoption=upiview` + `upiQR=true`)
 *
 * Status is pulled with the Transaction (retrieve) API; the async S2S webhook
 * (configured in the Easebuzz dashboard → Account Settings → Webhook) is
 * verified with the PayU-style reverse hash and forwarded to DollerpayX.
 *
 * All hash sequences mirror the official `paywitheasebuzz-php-lib`:
 *   - request : key|txnid|amount|productinfo|firstname|email|udf1..udf10|salt
 *   - retrieve: key|txnid|amount|email|phone|salt
 *   - reverse : salt|status|udf10..udf1|email|firstname|productinfo|amount|txnid|key
 */
import type { PGHandlers, TxnStatus } from './types.js';
export type EasebuzzEnv = 'test' | 'prod';
export interface EasebuzzConfig {
    /** Easebuzz merchant key (e.g. `I2CZJPWSVZ`). */
    key: string;
    /** Easebuzz merchant salt — never logged. */
    salt: string;
    /** `prod` → live endpoints, `test` → sandbox endpoints. */
    env: EasebuzzEnv;
    /** Productinfo string sent on every collect. Defaults to `DollerpayX Collection`. */
    productinfo?: string;
}
/** Request hash for `initiateLink` (PayU-style forward hash). */
export declare function buildInitiateHash(params: Record<string, string>, salt: string): string;
/** Request hash for the Transaction (retrieve) API. */
export declare function buildRetrieveHash(params: {
    key: string;
    txnid: string;
    amount: string;
    email: string;
    phone: string;
}, salt: string): string;
/**
 * Reverse hash for response / webhook verification. `payload` is the raw
 * Easebuzz response object (form-decoded webhook fields or retrieve `msg`).
 */
export declare function buildReverseHash(payload: Record<string, string>, salt: string): string;
/** Timing-independent-enough hex compare (lengths are fixed sha512 hex). */
export declare function verifyEasebuzzReverseHash(payload: Record<string, string>, salt: string): boolean;
/**
 * Build the Easebuzz `txnid` for a DollerpayX transaction. Easebuzz requires a
 * merchant-unique alphanumeric id; the DPX UUID (36 chars, dashes) is unsuitable
 * so we derive a compact, unique value and return it as the bridge
 * `pg_transaction_id`. The same value is what Easebuzz echoes in its webhook,
 * so webhook → DPX txn resolution stays stable.
 */
export declare function makeEasebuzzTxnId(dpxTxnId: string): string;
interface InitiateResult {
    ok: boolean;
    accessKey?: string;
    paymentUrl?: string;
    error?: string;
    raw?: unknown;
}
/** Step 1 — POST `/payment/initiateLink` → `access_key` + hosted payment URL. */
export declare function initiateEasebuzzLink(input: {
    config: EasebuzzConfig;
    txnid: string;
    amount: string;
    firstname: string;
    email: string;
    phone: string;
    productinfo: string;
}): Promise<InitiateResult>;
interface SubmitResult {
    ok: boolean;
    upiIntent?: string;
    error?: string;
    raw?: unknown;
}
/**
 * Step 2 — POST `/webservice/submitInitiatePayment/` (multipart) → `qr_link`
 * (`upi://pay?...`). Empty `upiVA` + `upiQR=true` selects the intent/QR path.
 */
export declare function submitEasebuzzInitiatePayment(input: {
    config: EasebuzzConfig;
    accessKey: string;
}): Promise<SubmitResult>;
export interface EasebuzzMintResult {
    ok: boolean;
    /** Hosted Easebuzz payment URL (persisted by DPX; never shown to merchant). */
    paymentUrl?: string;
    /** Raw `upi://pay?...` deeplink. */
    upiIntent?: string;
    /** Easebuzz merchant `txnid` (returned to DPX as `pg_transaction_id`). */
    txnid?: string;
    error?: string;
}
/** Full mint chain: initiateLink → submitInitiatePayment. */
export declare function mintEasebuzzUpiIntent(input: {
    config: EasebuzzConfig;
    txnid: string;
    amount: string;
    firstname: string;
    email: string;
    phone: string;
    productinfo: string;
}): Promise<EasebuzzMintResult>;
/** Map an Easebuzz transaction-status string onto the bridge's normalized enum. */
export declare function mapEasebuzzStatus(raw: string): TxnStatus;
/** Transaction (retrieve) API — pull the authoritative status for a `txnid`. */
export declare function retrieveEasebuzzTransaction(input: {
    config: EasebuzzConfig;
    txnid: string;
    amount: string;
    email: string;
    phone: string;
}): Promise<{
    ok: boolean;
    statusText?: string;
    amountPaisa?: number;
    raw?: unknown;
    error?: string;
}>;
/**
 * Build the lender's `easebuzz` PGHandlers for `@dpx/bridge-node`.
 *
 * `createCollection` mints the UPI intent synchronously and returns it on
 * `upi_intent_url`, so DollerpayX classifies the PG as `collection_url_type:
 * 'deeplink'` and trusts the deeplink directly (no splash-page mining).
 *
 * `checkStatus` calls the Transaction (retrieve) API. It needs the exact
 * `amount`/`email`/`phone` used at initiate time to satisfy the retrieve hash;
 * those are kept in an in-process map populated by `createCollection`. For
 * single-instance lender bridges (the common deployment) this is sufficient;
 * the dashboard webhook is the authoritative push path and needs no stored
 * state because the reverse-hash payload carries every field.
 */
export declare function createEasebuzzHandlers(config: EasebuzzConfig): PGHandlers;
export interface EasebuzzWebhookForwardResult {
    /** `forwarded` → pushed to DPX; `ignored` → non-terminal status, no-op. */
    outcome: 'forwarded' | 'ignored';
    status: TxnStatus;
    txnid: string;
}
/**
 * Verify an Easebuzz S2S webhook (form-decoded into `payload`) and forward the
 * terminal outcome to DollerpayX via `forwardCallback` (the bridge's
 * `forwardBossPayCallback`). Throws on a hash mismatch so the caller returns a
 * non-200 and Easebuzz retries. Non-terminal (`pending`) webhooks are ignored.
 */
export declare function handleEasebuzzWebhook(payload: Record<string, string>, deps: {
    salt: string;
    forwardCallback: (args: {
        pgType: string;
        pgTransactionId: string;
        payload: {
            status: 'success' | 'failed';
            pg_transaction_id: string;
            amount: number;
            metadata?: Record<string, unknown>;
        };
    }) => Promise<unknown>;
}): Promise<EasebuzzWebhookForwardResult>;
export {};
//# sourceMappingURL=easebuzzMint.d.ts.map