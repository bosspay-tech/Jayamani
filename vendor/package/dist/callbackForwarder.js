/**
 * Forwards the PG's async webhook back to BossPay at
 * `POST {apiBase}/callbacks/{pg_type}/{txn_id}` with an HMAC-signed body.
 *
 * Called from the lender's PG-specific webhook handler after the lender has
 * verified the PG's own signature. The bridge looks up the mapping stored at
 * `/collect` time (keyed by `pg_transaction_id`) to find the BossPay txn id
 * that the PG does not know about.
 */
import { signBody, SIGNATURE_HEADER } from './hmac.js';
import { BridgeError } from './types.js';
import { validateCallbackPayload, buildCallbackUrl } from './handlers.js';
/**
 * Signed POST with exponential-backoff retry on 5xx / network errors.
 * 2xx and 4xx are treated as terminal — BossPay's callback endpoint
 * responds 200 for both valid and "already processed" callbacks, and 4xx
 * means we mis-constructed the request (retrying won't help).
 */
export async function forwardBossPayCallback(opts, deps) {
    const payload = validateCallbackPayload(opts.payload);
    const mapping = await deps.txnStore.get(opts.pgTransactionId);
    if (!mapping) {
        throw new BridgeError(404, 'TXN_MAPPING_NOT_FOUND', `No txn mapping for pg_transaction_id ${opts.pgTransactionId}. ` +
            `Was /collect called first?`);
    }
    const url = mapping.callback_url ||
        buildCallbackUrl(deps.bosspayApiBase, mapping.pg_type, mapping.txn_id);
    const body = JSON.stringify(payload);
    const signature = signBody(body, deps.bridgeSecret);
    const maxAttempts = deps.maxAttempts ?? 3;
    const initialBackoffMs = deps.initialBackoffMs ?? 500;
    const timeoutMs = deps.timeoutMs ?? 15_000;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        [SIGNATURE_HEADER]: signature,
                    },
                    body,
                    signal: controller.signal,
                });
                const text = await res.text();
                if (res.status >= 500) {
                    lastError = new Error(`BossPay returned ${res.status}: ${text}`);
                }
                else {
                    return { status: res.status, attempts: attempt, body: text };
                }
            }
            finally {
                clearTimeout(timer);
            }
        }
        catch (err) {
            lastError = err;
        }
        if (attempt < maxAttempts) {
            const delay = initialBackoffMs * 2 ** (attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw new BridgeError(502, 'CALLBACK_FORWARD_FAILED', `Failed to forward callback to ${url} after ${maxAttempts} attempts: ` +
        (lastError instanceof Error ? lastError.message : String(lastError)));
}
//# sourceMappingURL=callbackForwarder.js.map