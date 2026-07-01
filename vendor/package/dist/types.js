/**
 * Wire types for the BossPay bridge protocol.
 *
 * These shapes are pinned to the WordPress plugin
 * [`plugins/bosspay-bridge/includes/class-bridge-api.php`](plugins/bosspay-bridge/includes/class-bridge-api.php)
 * and the BossPay backend adapter
 * [`packages/pg-adapters/src/adapters/wordpress-bridge.ts`](packages/pg-adapters/src/adapters/wordpress-bridge.ts).
 * Changing any field name, case, or type here breaks compatibility with the
 * BossPay orchestration backend — it must stay byte-compatible.
 */
import { z } from 'zod';
/* --------------------------------------------------------------------------
 * /collect
 * ------------------------------------------------------------------------ */
// Accept either string or number for merchant_id and normalize to string.
// `z.preprocess(fn, innerSchema)` inferred type is the OUTPUT of the inner
// schema, so this is unambiguously `string` (unlike `.transform().pipe()`
// which has been flaky across Zod minor versions).
const merchantIdSchema = z.preprocess((v) => (typeof v === 'number' ? String(v) : v), z.string().min(1));
export const CollectRequestSchema = z.object({
    pg_type: z.string().min(1),
    txn_id: z.string().min(1),
    amount: z.number().int().nonnegative(),
    merchant_id: merchantIdSchema,
    customer_email: z.string().email().or(z.literal('')),
    customer_phone: z.string().default(''),
    redirect_url: z.string().url(),
});
export const CollectResultSchema = z.object({
    payment_url: z.string().url(),
    pg_transaction_id: z.string().min(1),
    mode: z.enum(['redirect', 's2s']).optional(),
});
/* --------------------------------------------------------------------------
 * /payout
 * ------------------------------------------------------------------------ */
export const PayoutRequestSchema = z.object({
    pg_type: z.string().min(1),
    amount: z.number().int().nonnegative(),
    merchant_id: merchantIdSchema,
    beneficiary: z.record(z.unknown()),
    reference_id: z.string().min(1),
});
export const PayoutResultSchema = z.object({
    pg_reference: z.string(),
    status: z.string(),
});
/* --------------------------------------------------------------------------
 * /status
 * ------------------------------------------------------------------------ */
/** Normalized transaction status — what BossPay expects back from /status. */
export const TxnStatusEnum = z.enum(['success', 'failed', 'pending']);
export const StatusResultSchema = z.object({
    status: TxnStatusEnum,
    pg_transaction_id: z.string(),
    amount: z.number().int().nonnegative(),
    raw_pg_response: z.record(z.unknown()).optional(),
});
/* --------------------------------------------------------------------------
 * Callback forwarded to BossPay from lender's PG webhook
 * ------------------------------------------------------------------------ */
export const CallbackPayloadSchema = z.object({
    status: z.enum(['success', 'failed']),
    pg_transaction_id: z.string().min(1),
    amount: z.number().int().nonnegative(),
    metadata: z.record(z.unknown()).optional(),
});
/* --------------------------------------------------------------------------
 * Errors
 * ------------------------------------------------------------------------ */
export class BridgeError extends Error {
    statusCode;
    code;
    constructor(statusCode, code, message) {
        super(message);
        this.name = 'BridgeError';
        this.statusCode = statusCode;
        this.code = code;
    }
}
//# sourceMappingURL=types.js.map