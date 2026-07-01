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
import { createWebFetchHandler } from './webFetch.js';
/** Read the raw body bytes from an Express request stream. */
function readRawBody(req) {
    // If an upstream parser already hydrated a Buffer (via `express.raw(...)`),
    // reuse it — calling .on('data') again would stall forever.
    if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        return Promise.resolve(req.body);
    }
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}
function buildRequestUrl(req) {
    const host = req.headers.host ?? 'localhost';
    const proto = req.headers['x-forwarded-proto'] ?? req.protocol ?? 'http';
    return `${proto}://${host}${req.originalUrl || req.url}`;
}
function toHeadersInit(req) {
    const headers = {};
    for (const [name, value] of Object.entries(req.headers)) {
        if (value == null)
            continue;
        headers[name] = Array.isArray(value) ? value.join(', ') : String(value);
    }
    return headers;
}
/** Returns an Express `RequestHandler` that delegates to the bridge. */
export function toExpress(opts) {
    const fetchHandler = createWebFetchHandler(opts);
    return async function bridgeMiddleware(req, res, next) {
        try {
            const url = buildRequestUrl(req);
            const method = req.method.toUpperCase();
            const headers = toHeadersInit(req);
            const init = method !== 'GET' && method !== 'HEAD'
                ? { method, headers, body: new Uint8Array(await readRawBody(req)) }
                : { method, headers };
            const webReq = new Request(url, init);
            const webRes = await fetchHandler(webReq);
            res.status(webRes.status);
            webRes.headers.forEach((value, name) => {
                res.setHeader(name, value);
            });
            const text = await webRes.text();
            res.send(text);
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=express.js.map