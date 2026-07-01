/**
 * AirPay UPI-intent direct-mint helper — Node edition.
 *
 * Mirrors [`plugins/dollerpayx-bridge/includes/class-airpay-handler.php`](plugins/dollerpayx-bridge/includes/class-airpay-handler.php)
 * (`direct_mint_upi_intent`) line-for-line. Three POSTs to AirPay, a static
 * SPA-bundle cipher, and a JWT chain:
 *
 *   1. **Stage A** — POST `/pay/v4/index.php?token=<endpoint_token>` with the
 *      `merchant_id` + `encdata` + `checksum` + `privatekey` form fields the
 *      AirPay WC plugin already builds. Response is HTML (NOT a 302); the
 *      initial Bearer JWT lives at `<body data-token="…">`.
 *   2. **Stage B** — POST `/pay/payment_api.php` with
 *      `Authorization: Bearer <Stage-A token>` and an encrypted body of
 *      `{api_action:"config", is_mobile:true, api_type:"web"}`. The decrypted
 *      response carries a refreshed `response.token` used by Stage C.
 *   3. **Stage C** — POST `/pay/payment_api.php` with
 *      `Authorization: Bearer <Stage-B token>` and an encrypted body of
 *      `{api_action:"payment", chmod:"upi", action:"makePayment",
 *        sub_mode:"intent", customer_mobile_code, customer_mobile,
 *        upi_app:"other", api_type:"web"}`. The decrypted response holds the
 *      `upi://pay?…` deeplink at `response.next_action.url`.
 *
 * The cipher used for `encRequest` / `encResponse` is recovered from AirPay's
 * SPA bundle (chunks_37.js lines 1788-1792 — see
 * docs/AIRPAY-OFFLINE-DECOMPILE.md). Definition:
 *
 *   m = [1, 9, 18, 16, 1, 25]
 *   encrypt(plain): reverse plain, then byte[i] += m[i % 6] (mod 256), base64.
 *   decrypt(b64):   base64-decode, then byte[i] -= m[i % 6] (mod 256), reverse.
 *
 * The key is hardcoded in AirPay's SPA — same constant for every merchant on
 * the platform — so no per-MID configuration is required.
 *
 * No external deps; uses the platform `fetch` (Node 18+, Bun, Deno, Workers).
 */
export interface AirPayDirectMintInputs {
    /** AirPay v4 init endpoint with `?token=<endpoint_token>` query string. */
    initUrl: string;
    /** Numeric AirPay merchant id (e.g. `350435`). */
    merchantId: string;
    /** `encdata` value the AirPay WC plugin generates for the WC order. */
    encdata: string;
    /** SHA-256 checksum the AirPay WC plugin generates alongside `encdata`. */
    checksum: string;
    /** 64-char hex `privatekey` the AirPay WC plugin generates per session. */
    privatekey: string;
    /** `chmod` value (often empty). Pass through verbatim from the WC plugin. */
    chmod?: string;
    /** Customer's 10-digit mobile (digits only). Echoed into UPI deeplink. */
    customerMobile: string;
    /** Default `'91'` (India). Override only for non-IN AirPay deployments. */
    customerMobileCode?: string;
    /** HTTP timeout per stage in ms. Default 8000. */
    timeoutMs?: number;
}
export type AirPayDirectMintResult = {
    ok: true;
    /** Raw `upi://pay?…` deeplink as returned by AirPay. */
    upiQrValue: string;
    /** Parsed `tr` query param; `''` if not parseable. */
    intentTr: string;
    /** AirPay-side reference (the `tr` is suitable for merchant lookup). */
    pgTransactionId: string;
    /** Epoch seconds at which the mint completed. */
    mintedAt: number;
    /** End-to-end latency of all three stages in ms. */
    latencyMs: number;
} | {
    ok: false;
    /** Where it failed. */
    stage: 'init' | 'bootstrap' | 'upi_intent_select';
    error: string;
    /** Captured encResponses for offline cipher analysis on failure. */
    encResponses?: string[];
};
/**
 * Encrypt an AirPay payment_api payload. Exported for unit tests; not part of
 * the public bridge surface.
 */
export declare function airpaySessionEncrypt(plaintext: string): string;
/**
 * Decrypt an AirPay payment_api response. Returns `''` on any decode error
 * (caller treats empty string as a session-decrypt failure).
 */
export declare function airpaySessionDecrypt(b64: string): string;
/**
 * Extract the initial Bearer JWT from `<body data-token="…">` in the HTML
 * AirPay returns from the Stage-A POST. Exported for unit tests.
 */
export declare function extractDataToken(html: string): string;
/**
 * Drive the full AirPay UPI-intent mint server-side. Pure function; safe to
 * call from any runtime with `fetch` (Node 18+, Bun, Deno, Workers).
 */
export declare function directMintAirpayUpiIntent(inputs: AirPayDirectMintInputs): Promise<AirPayDirectMintResult>;
//# sourceMappingURL=airpayDirectMint.d.ts.map