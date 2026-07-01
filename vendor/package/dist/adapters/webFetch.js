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
import { handleCollect, handleHealth, handlePayout, handleStatus, } from '../handlers.js';
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifyBody, verifyTimestamp, } from '../hmac.js';
import { BridgeError } from '../types.js';
const BRIDGE_PATH_RE = /\/bosspay\/v1\/(health|collect|payout|status\/([^/?#]+))\/?$/;
function matchRoute(pathname) {
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
    return null;
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
                    return jsonResponse(200, await handleCollect(ctx, bodyText));
                }
                if (match.kind === 'payout') {
                    return jsonResponse(200, await handlePayout(ctx, bodyText));
                }
                return jsonResponse(405, { error: 'Method not allowed' });
            }
            if (req.method === 'GET') {
                const timestamp = req.headers.get(TIMESTAMP_HEADER);
                if (!verifyTimestamp(timestamp, signature, bridgeSecret)) {
                    return jsonResponse(403, { error: 'Invalid signature' });
                }
                if (match.kind === 'health') {
                    return jsonResponse(200, await handleHealth(ctx));
                }
                if (match.kind === 'status' && match.pgTxnId) {
                    const pgType = url.searchParams.get('pg_type') ?? undefined;
                    return jsonResponse(200, await handleStatus(ctx, { pgTxnId: match.pgTxnId, pgType }));
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