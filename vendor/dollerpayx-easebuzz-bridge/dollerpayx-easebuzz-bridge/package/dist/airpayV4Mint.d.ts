/**
 * AirPay v4 mint — Node edition — DEPRECATED (ADR-022, @dpx/bridge-node
 * 3.3.0, 2026-05-28).
 *
 * ----------------------------------------------------------------------
 *  THIS BRIDGE-SIDE MINT FUNCTION IS A NO-OP. AirPay v4 mint moved to
 *  the DPX backend, which performs the full 3-stage AirPay SPA replay
 *  against `payments.airpay.co.in` server-to-server. WP / Node / Python
 *  lender bridges play NO role in AirPay mint anymore. Status polling
 *  (the `/api/verify` call) also runs on the DPX backend — no bridge
 *  involvement is required for any AirPay code path.
 * ----------------------------------------------------------------------
 *
 * Why the function stays exported (rather than being deleted):
 *   1. Backward-compat for lenders who pinned an older `@dpx/bridge-node`
 *      release and may import the name. They get a clear runtime error
 *      pointing them at the migration instead of a less-helpful
 *      `TypeError: mintAirpayV4Intent is not a function`.
 *   2. The type exports (`AirpayV4MintCreds`, `AirpayV4MintBuyer`,
 *      `AirpayV4MintInputs`, `AirpayV4MintOk`, `AirpayV4MintErr`,
 *      `AirpayV4MintResult`) remain stable so downstream TS code keeps
 *      type-checking during their bump.
 *
 * Migration:
 *   - Delete any lender-side wiring that called `mintAirpayV4Intent`.
 *     AirPay-routed transactions are now driven entirely from the DPX
 *     backend; the bridge has nothing to do with AirPay mint or
 *     verification.
 *
 * See `docs/DECISIONS.md` (ADR-022) and `apps/backend/src/lib/
 * airpay-v4-spa-replay.ts` in the DPX backend repository for the
 * authoritative implementation.
 */
export interface AirpayV4MintCreds {
    /** Numeric AirPay merchant id (e.g. `352901`). */
    merchantId: string;
    /** AirPay portal Username. */
    username: string;
    /** AirPay portal Password. */
    password: string;
    /** AirPay portal Secret / API Key. */
    secret: string;
    /** AirPay portal OAuth Client ID. */
    clientId: string;
    /** AirPay portal OAuth Client Secret. */
    clientSecret: string;
}
export interface AirpayV4MintBuyer {
    orderid: string;
    amountInr: string;
    email: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    chmod?: string;
}
export interface AirpayV4MintInputs {
    creds: AirpayV4MintCreds;
    buyer: AirpayV4MintBuyer;
    sourceDomain: string;
    oauthCache?: {
        get: (cacheKey: string) => Promise<string | undefined>;
        set: (cacheKey: string, token: string, ttlSeconds: number) => Promise<void>;
    };
    timeoutMs?: number;
    baseUrls?: {
        kraken?: string;
        payments?: string;
    };
}
export type AirpayV4MintOk = {
    ok: true;
    hostedPageUrl: string;
    upiIntentUrl: string;
    apTransactionId: string;
    raw: {
        status: number;
        location: string;
        bodySnippet: string;
        sentOrderid: string;
    };
};
export type AirpayV4MintFail = {
    ok: false;
    stage: 'deprecated' | 'validate' | 'oauth' | 'post' | 'parse';
    error: string;
    status?: number;
    bodySnippet?: string;
    raw?: Record<string, unknown>;
};
/** Back-compat alias for the pre-3.3.0 `AirpayV4MintErr` name. */
export type AirpayV4MintErr = AirpayV4MintFail;
export type AirpayV4MintResult = AirpayV4MintOk | AirpayV4MintFail;
/**
 * DEPRECATED — see file header. Returns a structured failure pointing
 * to ADR-022. Does NOT touch the network. Safe to call from CI without
 * any AirPay credentials.
 */
export declare function mintAirpayV4Intent(_inputs: AirpayV4MintInputs): Promise<AirpayV4MintResult>;
//# sourceMappingURL=airpayV4Mint.d.ts.map