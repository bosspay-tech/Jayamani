/**
 * Pure handler functions — one per bridge endpoint. Each takes the parsed
 * request (body string for POSTs, query + path params for GETs, pre-verified
 * signature), validates with Zod, and dispatches to the lender's PGHandlers.
 *
 * These are framework-agnostic: the web-fetch and Express adapters both
 * reuse them after normalizing the inbound request into the same shape.
 */
import { z } from 'zod';
import { BridgeError, CallbackPayloadSchema, CollectRequestSchema, CollectResultSchema, PayoutRequestSchema, PayoutResultSchema, StatusResultSchema, } from './types.js';
/** Resolve the PG handlers for a given pg_type; throw 400 when missing. */
function resolvePg(ctx, pgType) {
    const pg = ctx.handlers[pgType];
    if (!pg) {
        throw new BridgeError(400, 'PG_NOT_CONFIGURED', `Unknown pg_type: ${pgType}`);
    }
    return pg;
}
/**
 * Parse a JSON body with a Zod schema; rethrow as a 400 BridgeError on any failure.
 *
 * The signature is `<S extends z.ZodTypeAny>` rather than `<T>(schema: z.ZodType<T>)`
 * because `z.ZodType<T>` unifies `T` with the schema's *input* type, which breaks
 * when the schema uses `.transform()` / `.preprocess()` (output type drifts from
 * input). `z.infer<S>` always gives the post-validation output type, which is
 * what every caller here actually wants.
 */
function parseBody(schema, body) {
    let json;
    try {
        json = JSON.parse(body);
    }
    catch {
        throw new BridgeError(400, 'INVALID_JSON', 'Request body is not valid JSON');
    }
    try {
        return schema.parse(json);
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            const issue = err.errors[0];
            const path = issue?.path?.length ? issue.path.join('.') : 'body';
            throw new BridgeError(400, 'INVALID_REQUEST', `${path}: ${issue?.message ?? 'invalid'}`);
        }
        throw err;
    }
}
/**
 * POST /bosspay/v1/collect
 *
 * Mirrors [`class-bridge-api.php::handle_collect`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * After a successful provider call, persists the `pg_transaction_id` → BossPay
 * txn mapping so the lender's PG webhook can later look it up when forwarding
 * the async callback.
 */
export async function handleCollect(ctx, body) {
    const parsed = parseBody(CollectRequestSchema, body);
    const pg = resolvePg(ctx, parsed.pg_type);
    const raw = await pg.createCollection(parsed);
    const result = CollectResultSchema.parse(raw);
    await ctx.txnStore.set(result.pg_transaction_id, {
        txn_id: parsed.txn_id,
        pg_type: parsed.pg_type,
        callback_url: buildCallbackUrl(ctx.bosspayApiBase, parsed.pg_type, parsed.txn_id),
    });
    return result;
}
/**
 * POST /bosspay/v1/payout
 *
 * Mirrors [`class-bridge-api.php::handle_payout`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * If the lender's handlers do not implement `createPayout`, respond with 501
 * so BossPay's payout engine sees a clean "not implemented" signal.
 */
export async function handlePayout(ctx, body) {
    const parsed = parseBody(PayoutRequestSchema, body);
    const pg = resolvePg(ctx, parsed.pg_type);
    if (!pg.createPayout) {
        throw new BridgeError(501, 'PAYOUT_NOT_IMPLEMENTED', `pg_type '${parsed.pg_type}' does not implement createPayout`);
    }
    const raw = await pg.createPayout(parsed);
    return PayoutResultSchema.parse(raw);
}
/**
 * GET /bosspay/v1/status/:pgTxnId?pg_type=…
 *
 * Mirrors [`class-bridge-api.php::handle_status`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * Resolves `pg_type` in this order:
 *   1. TxnStore mapping keyed by `:pgTxnId` (primary: true PG id),
 *   2. TxnStore mapping keyed by BossPay UUID (when BossPay calls with its UUID),
 *   3. `?pg_type=` query parameter (fallback).
 */
export async function handleStatus(ctx, params) {
    let mapping = await ctx.txnStore.get(params.pgTxnId);
    let pgTxnId = params.pgTxnId;
    if (!mapping) {
        mapping = await ctx.txnStore.getByBosspayTxnId(params.pgTxnId);
    }
    const pgType = mapping?.pg_type ?? params.pgType ?? '';
    if (!pgType) {
        throw new BridgeError(400, 'PG_TYPE_UNRESOLVED', 'Cannot determine pg_type for this transaction');
    }
    const pg = resolvePg(ctx, pgType);
    const raw = await pg.checkStatus({ pg_type: pgType, pg_txn_id: pgTxnId });
    return StatusResultSchema.parse(raw);
}
/**
 * GET /bosspay/v1/health
 *
 * Mirrors [`class-bridge-api.php::handle_health`](plugins/bosspay-bridge/includes/class-bridge-api.php).
 * Reports the list of configured `pg_type` keys and whether each one's
 * `isAvailable()` resolves truthy (defaults to `true` when not provided).
 */
export async function handleHealth(ctx) {
    const pgTypes = Object.keys(ctx.handlers).filter((k) => !!ctx.handlers[k]);
    const pgStatus = {};
    await Promise.all(pgTypes.map(async (pgType) => {
        const handler = ctx.handlers[pgType];
        if (!handler) {
            pgStatus[pgType] = false;
            return;
        }
        if (!handler.isAvailable) {
            pgStatus[pgType] = true;
            return;
        }
        try {
            pgStatus[pgType] = await handler.isAvailable();
        }
        catch {
            pgStatus[pgType] = false;
        }
    }));
    return {
        status: 'ok',
        version: ctx.version,
        enabled_pgs: pgTypes,
        pg_status: pgStatus,
    };
}
/* --------------------------------------------------------------------------
 * Callback helper (invoked from lender's PG webhook via bridge.forwardCallback)
 * ------------------------------------------------------------------------ */
/** Build the canonical callback URL BossPay expects. */
export function buildCallbackUrl(apiBase, pgType, txnId) {
    const base = apiBase.replace(/\/+$/, '');
    return `${base}/callbacks/${encodeURIComponent(pgType)}/${encodeURIComponent(txnId)}`;
}
/** Validate a forward-callback payload before signing + POSTing. */
export function validateCallbackPayload(payload) {
    return CallbackPayloadSchema.parse(payload);
}
//# sourceMappingURL=handlers.js.map