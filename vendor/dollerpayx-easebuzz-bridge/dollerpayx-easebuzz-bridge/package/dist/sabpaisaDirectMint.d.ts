/**
 * SabPaisa UPI-intent direct-mint helper — Node edition.
 *
 * Mirrors [`plugins/bosspay-bridge/includes/class-sabpaisa-handler.php`](plugins/bosspay-bridge/includes/class-sabpaisa-handler.php)
 * (`direct_mint_upi_intent`) line-for-line. Two POSTs to SabPaisa:
 *
 *   1. GET/POST `/SabPaisa/sabPaisaInit?v=1` — seeds a `JSESSIONID` cookie and
 *      registers the transaction slot. SabPaisa binds `encData` + `clientTxnId`
 *      to the session on this call; a second POST with the same payload is
 *      rejected with HTTP 500 + a generic HTML body.
 *   2. POST `/rest/intent/confirmintentupiV1` with the session cookie — mints
 *      the NPCI-registered `upi://pay?...` deeplink and returns it as JSON.
 *
 * The returned deeplink typically carries SabPaisa's routing VPA (e.g.
 * `DIGI84.SBP@ypbiz`) as `pa` and an 18-digit numeric `tr` that NPCI recognizes
 * for reconciliation. Caller must cache this per order for at least 10 minutes
 * to avoid re-triggering the single-use `sabPaisaInit` binding.
 *
 * No external deps; uses the platform `fetch` (Node 18+, Bun, Deno, Workers).
 */
export interface DirectMintInputs {
    /**
     * SabPaisa init endpoint that consumes `encData` + `clientCode` on first POST.
     * Production: `https://securepay.sabpaisa.in/SabPaisa/sabPaisaInit?v=1`.
     */
    initUrl: string;
    /** Raw `encData` hex as built by the lender's SabPaisa integration. */
    encData: string;
    /** SabPaisa `clientCode` (e.g. `DIGI84`). */
    clientCode: string;
    /** Per-order transaction identifier (e.g. `<wc_order_id>_<DDMMHHMM>`). */
    clientTxnId: string;
    /** Transaction amount in rupees (INR). Converted to 2dp + paisa on the wire. */
    amountRupees: number;
    /** Customer email — required by SabPaisa; `''` acceptable for guest checkouts. */
    email: string;
    /** Customer phone — required by SabPaisa; `''` acceptable for guest checkouts. */
    phone: string;
    /** SabPaisa merchant numeric id (e.g. 23998 for DIGI84). From `lender_pgs.sabpaisa_client_id`. */
    clientId: number;
    /** Merchant legal name (e.g. `DIGI ECOM SHIFT PRIVATE LIMITED`). From `lender_pgs.sabpaisa_client_name`. */
    clientName: string;
    /** UPI endpoint JSON (must contain numeric `epId`). From `lender_pgs.sabpaisa_endpoint_json`. */
    endpointJson: Record<string, unknown> & {
        epId: number;
    };
    /** HTTP timeout per POST in ms. Default 8000. */
    timeoutMs?: number;
}
export type DirectMintResult = {
    ok: true;
    /** Raw `upi://pay?...` deeplink as returned by SabPaisa. */
    upiQrValue: string;
    /** Parsed `tr` query param (18-digit NPCI reference); `''` if not parseable. */
    intentTr: string;
    /** Epoch seconds at which the mint completed (for cache-freshness checks). */
    mintedAt: number;
    /** End-to-end latency of the two POSTs in ms. */
    latencyMs: number;
} | {
    ok: false;
    error: string;
};
/**
 * Exported for unit-test coverage; not part of the public bridge surface.
 * Tests pin the `/SabPaisa/` prefix preservation behaviour because SabPaisa
 * silently answers a missing prefix with a 404 HTML page.
 */
export declare function parseConfirmIntentUrl(initUrl: string): string;
/** Two-POST chain. Pure function; safe to call from any runtime. */
export declare function directMintUpiIntent(inputs: DirectMintInputs): Promise<DirectMintResult>;
//# sourceMappingURL=sabpaisaDirectMint.d.ts.map