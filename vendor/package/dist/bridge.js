/**
 * Composition root — `createBossPayBridge` wires up the handlers, the txn
 * store, and the HMAC secret into a single `{ fetch, forwardCallback }`
 * object that lender applications can mount with one line of code.
 */
import { createWebFetchHandler } from './adapters/webFetch.js';
import { forwardBossPayCallback, } from './callbackForwarder.js';
export function createBossPayBridge(opts) {
    const ctx = {
        handlers: opts.handlers,
        txnStore: opts.txnStore,
        bosspayApiBase: opts.bosspayApiBase,
        version: opts.version ?? '1.0.0',
    };
    const fetch = createWebFetchHandler({ ctx, bridgeSecret: opts.bridgeSecret });
    async function forwardCallback(args) {
        return forwardBossPayCallback(args, {
            txnStore: opts.txnStore,
            bridgeSecret: opts.bridgeSecret,
            bosspayApiBase: opts.bosspayApiBase,
            ...(opts.callback?.maxAttempts !== undefined
                ? { maxAttempts: opts.callback.maxAttempts }
                : {}),
            ...(opts.callback?.initialBackoffMs !== undefined
                ? { initialBackoffMs: opts.callback.initialBackoffMs }
                : {}),
            ...(opts.callback?.timeoutMs !== undefined ? { timeoutMs: opts.callback.timeoutMs } : {}),
        });
    }
    return { fetch, forwardCallback };
}
//# sourceMappingURL=bridge.js.map