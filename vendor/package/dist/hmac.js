/**
 * HMAC sign + verify helpers — byte-for-byte compatible with the WordPress
 * bridge plugin's [`class-hmac.php`](plugins/bosspay-bridge/includes/class-hmac.php)
 * and BossPay's [`packages/pg-adapters/src/adapters/wordpress-bridge.ts`](packages/pg-adapters/src/adapters/wordpress-bridge.ts).
 *
 * Contract:
 *   - Algorithm:       HMAC-SHA256, hex digest
 *   - Header:          `X-BossPay-Bridge-Signature`
 *   - POST endpoints:  sign the raw JSON request body
 *   - GET endpoints:   sign the `X-BossPay-Timestamp` header value
 *   - Secret:          lender-owned shared secret; trim whitespace on both sides
 *     (matches WP plugin's `trim()` on the option value).
 *   - Comparison:      constant-time over hex-decoded byte arrays.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
export const SIGNATURE_HEADER = 'x-bosspay-bridge-signature';
export const TIMESTAMP_HEADER = 'x-bosspay-timestamp';
/** Match WordPress `trim()` so accidental whitespace in the pasted secret doesn't poison HMAC. */
export function normalizeSecret(secret) {
    return secret.trim();
}
/** Sign an arbitrary payload string (raw body, or timestamp) with HMAC-SHA256 hex. */
export function sign(payload, secret) {
    return createHmac('sha256', normalizeSecret(secret)).update(payload).digest('hex');
}
/** Sign the raw JSON body for POST endpoints. */
export function signBody(body, secret) {
    return sign(body, secret);
}
/** Sign the timestamp string for GET endpoints. */
export function signTimestamp(timestamp, secret) {
    return sign(timestamp, secret);
}
/**
 * Timing-safe signature check. Returns false for any malformed input rather
 * than throwing — callers already know they want a boolean gate.
 */
export function verify(payload, receivedSignature, secret) {
    if (!receivedSignature)
        return false;
    const expected = sign(payload, secret);
    try {
        const a = Buffer.from(expected, 'hex');
        const b = Buffer.from(receivedSignature, 'hex');
        if (a.length === 0 || a.length !== b.length)
            return false;
        return timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
    }
    catch {
        return false;
    }
}
/** Verify a POST request by its raw body. */
export function verifyBody(body, receivedSignature, secret) {
    return verify(body, receivedSignature, secret);
}
/** Verify a GET request by its timestamp header. */
export function verifyTimestamp(timestamp, receivedSignature, secret) {
    if (!timestamp)
        return false;
    return verify(timestamp, receivedSignature, secret);
}
//# sourceMappingURL=hmac.js.map