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
import { type HandlerContext } from '../handlers.js';
export interface WebFetchOptions {
    ctx: HandlerContext;
    bridgeSecret: string;
}
/** Build the `(req) => Promise<Response>` callback for the bridge. */
export declare function createWebFetchHandler(opts: WebFetchOptions): (req: Request) => Promise<Response>;
//# sourceMappingURL=webFetch.d.ts.map