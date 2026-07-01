/**
 * Framework-free `Request -> Response` handler for the bridge.
 *
 * One implementation covers every runtime that speaks the Fetch API:
 *   - Supabase Edge Functions (Deno)
 *   - Cloudflare Workers
 *   - Next.js App Router route handlers (Node + Edge)
 *   - Bun.serve
 *   - Deno.serve
 *
 * Path matching is **suffix-based** so a single bridge can be mounted under
 * any base URL:
 *   - `/bosspay/v1/{collect|payout|status/:id|health}` (Node / Express default)
 *   - `/wp-json/bosspay/v1/{...}` (matches the WP plugin URL exactly — what
 *     BossPay's `WordPressBridgeAdapter` hits today)
 *   - `/functions/v1/bosspay/bosspay/v1/{...}` (Supabase Edge default path)
 *
 * Any request whose pathname ends with `/bosspay/v1/...` (including the WP
 * `/wp-json/bosspay/v1/...` prefix) will match the expected route.
 */
import { handleAirpayProxy, handleCollect, handleHealth, handleMintAirpayV4, handlePayout, handleStatus, handleUpiIntent, } from '../handlers.js';
import { emitClientBeacon } from '../bossPayEvents.js';
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifyBody, verifyTimestamp, } from '../hmac.js';
import { BridgeError } from '../types.js';
// `upi/:txnId` is intentionally public (no HMAC check below) — it's a customer-
// facing splash page and the txnId is a UUID that's already scoped per
// transaction. The sensitive bit (encData / SabPaisa creds) lives on the
// TxnStore server-side.
const BRIDGE_PATH_RE = /\/bosspay\/v1\/(health|collect|payout|status\/([^/?#]+)|upi\/([^/?#]+))\/?$/;
const UPI_BEACON_RE = /\/bosspay\/v1\/upi\/([^/?#]+)\/beacon\/?$/;
// Poll-first AirPay v4 direct-mint endpoint (ADR-021). Lives under its
// own namespace `dpx-airpay/v1` so it's clearly separate from the
// legacy `bosspay/v1/collect` form-capture path. HMAC-protected,
// JSON body with credentials + buyer details, returns
// `{ ok, hosted_page_url, upi_intent_url, ap_transactionid }`.
const MINT_AIRPAY_V4_RE = /\/dpx-airpay\/v1\/mint-airpay-v4\/?$/;
// AirPay egress forward-proxy (ADR-024). HMAC-protected, JSON body
// `{ url, method, headers, body, redirect, timeout_ms }`, returns
// `{ status, body }`. Host-allow-listed to `*.airpay.co.in` server-side.
const AIRPAY_PROXY_RE = /\/dpx-airpay\/v1\/proxy\/?$/;
function matchRoute(pathname) {
    if (MINT_AIRPAY_V4_RE.test(pathname)) {
        return { kind: 'mint_airpay_v4' };
    }
    if (AIRPAY_PROXY_RE.test(pathname)) {
        return { kind: 'airpay_proxy' };
    }
    const beacon = UPI_BEACON_RE.exec(pathname);
    if (beacon?.[1]) {
        return { kind: 'upi_beacon', txnId: decodeURIComponent(beacon[1]) };
    }
    const m = BRIDGE_PATH_RE.exec(pathname);
    if (!m)
        return null;
    const leaf = m[1];
    if (leaf === 'health' || leaf === 'collect' || leaf === 'payout') {
        return { kind: leaf };
    }
    if (leaf?.startsWith('status/') && m[2]) {
        return { kind: 'status', pgTxnId: decodeURIComponent(m[2]) };
    }
    if (leaf?.startsWith('upi/') && m[3]) {
        return { kind: 'upi', txnId: decodeURIComponent(m[3]) };
    }
    return null;
}
function htmlResponse(status, html) {
    return new Response(html, {
        status,
        headers: {
            'content-type': 'text/html; charset=utf-8',
            // Splash pages must not be cached by intermediaries — a stale mint would
            // keep NPCI clocks ticking past the intent TTL.
            'cache-control': 'no-store, private',
        },
    });
}
function jsonResponse(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8' },
    });
}
function errorResponse(err) {
    if (err instanceof BridgeError) {
        return jsonResponse(err.statusCode, { error: err.message, code: err.code });
    }
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse(500, { error: message });
}
/** Build the `(req) => Promise<Response>` callback for the bridge. */
export function createWebFetchHandler(opts) {
    const { ctx, bridgeSecret } = opts;
    const ctxWithSecret = { ...ctx, bridgeSecret };
    return async function fetchHandler(req) {
        const url = new URL(req.url);
        const match = matchRoute(url.pathname);
        if (!match)
            return jsonResponse(404, { error: 'Not found' });
        const signature = req.headers.get(SIGNATURE_HEADER);
        try {
            if (req.method === 'POST') {
                const bodyText = await req.text();
                if (!verifyBody(bodyText, signature, bridgeSecret)) {
                    return jsonResponse(403, { error: 'Invalid signature' });
                }
                if (match.kind === 'collect') {
                    return jsonResponse(200, await handleCollect(ctxWithSecret, bodyText));
                }
                if (match.kind === 'payout') {
                    return jsonResponse(200, await handlePayout(ctxWithSecret, bodyText));
                }
                if (match.kind === 'mint_airpay_v4') {
                    return jsonResponse(200, await handleMintAirpayV4(ctxWithSecret, bodyText));
                }
                if (match.kind === 'airpay_proxy') {
                    return jsonResponse(200, await handleAirpayProxy(ctxWithSecret, bodyText));
                }
                return jsonResponse(405, { error: 'Method not allowed' });
            }
            if (req.method === 'GET') {
                if (match.kind === 'upi_beacon' && match.txnId) {
                    emitClientBeacon({
                        bosspayApiBase: ctx.bosspayApiBase,
                        bridgeSecret,
                        txnId: match.txnId,
                        e: url.searchParams.get('e') ?? '',
                        d: url.searchParams.get('d'),
                    });
                    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
                }
                // /upi/:txnId is a public customer-facing splash; no HMAC (the customer
                // browser can't carry our shared secret). All other GETs still require
                // the signed timestamp header.
                if (match.kind === 'upi' && match.txnId) {
                    const render = await handleUpiIntent(ctxWithSecret, { txnId: match.txnId });
                    return htmlResponse(200, render.html);
                }
                const timestamp = req.headers.get(TIMESTAMP_HEADER);
                if (!verifyTimestamp(timestamp, signature, bridgeSecret)) {
                    return jsonResponse(403, { error: 'Invalid signature' });
                }
                if (match.kind === 'health') {
                    return jsonResponse(200, await handleHealth(ctxWithSecret));
                }
                if (match.kind === 'status' && match.pgTxnId) {
                    const pgType = url.searchParams.get('pg_type') ?? undefined;
                    return jsonResponse(200, await handleStatus(ctxWithSecret, { pgTxnId: match.pgTxnId, pgType }));
                }
                return jsonResponse(405, { error: 'Method not allowed' });
            }
            return jsonResponse(405, { error: 'Method not allowed' });
        }
        catch (err) {
            return errorResponse(err);
        }
    };
}
//# sourceMappingURL=webFetch.js.map