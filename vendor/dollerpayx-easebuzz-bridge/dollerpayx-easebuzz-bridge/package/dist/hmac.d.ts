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
export declare const SIGNATURE_HEADER = "x-bosspay-bridge-signature";
export declare const TIMESTAMP_HEADER = "x-bosspay-timestamp";
/** Match WordPress `trim()` so accidental whitespace in the pasted secret doesn't poison HMAC. */
export declare function normalizeSecret(secret: string): string;
/** Sign an arbitrary payload string (raw body, or timestamp) with HMAC-SHA256 hex. */
export declare function sign(payload: string, secret: string): string;
/** Sign the raw JSON body for POST endpoints. */
export declare function signBody(body: string, secret: string): string;
/** Sign the timestamp string for GET endpoints. */
export declare function signTimestamp(timestamp: string, secret: string): string;
/**
 * Timing-safe signature check. Returns false for any malformed input rather
 * than throwing — callers already know they want a boolean gate.
 */
export declare function verify(payload: string, receivedSignature: string | undefined | null, secret: string): boolean;
/** Verify a POST request by its raw body. */
export declare function verifyBody(body: string, receivedSignature: string | undefined | null, secret: string): boolean;
/** Verify a GET request by its timestamp header. */
export declare function verifyTimestamp(timestamp: string | undefined | null, receivedSignature: string | undefined | null, secret: string): boolean;
//# sourceMappingURL=hmac.d.ts.map