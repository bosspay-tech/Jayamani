/**
 * Express adapter — a thin shim around `createWebFetchHandler` that
 * reconstructs a `Request` from `req` and writes the `Response` back to
 * `res`. Works identically on Express 4 and Express 5.
 *
 * Important: mount this on a route that does **not** consume the request
 * body (do not put `express.json()` before it), because the bridge needs
 * the raw bytes to verify the HMAC signature. Use `express.raw({ type: '* /*' })`
 * if you want a belt-and-braces guarantee.
 */
import type { RequestHandler } from 'express';
import { type WebFetchOptions } from './webFetch.js';
/** Returns an Express `RequestHandler` that delegates to the bridge. */
export declare function toExpress(opts: WebFetchOptions): RequestHandler;
//# sourceMappingURL=express.d.ts.map