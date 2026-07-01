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
/**
 * Defensive payer-name shape check — `[A-Za-z]+`, ≤24 chars.
 *
 * Authoritative sanitization happens server-side on BossPay
 * (`apps/backend/src/lib/customer-pool.ts::sanitizeName`); bridges receive
 * already-clean values and forward them verbatim to the upstream PG. This
 * Zod refinement is a contract guard: if a non-alpha character (`.`, space,
 * hyphen, …) ever reaches the bridge we drop the field rather than pass
 * dirty data to SabPaisa (which silently parks such transactions). The
 * lender's `createCollection` handler then falls back to whatever default
 * its PG-side integration uses.
 */
const sanitizedNameSchema = z
    .string()
    .max(24)
    .refine((s) => /^[A-Za-z]+$/.test(s), {
    message: 'payer name must be [A-Za-z]+ — BossPay sanitizes server-side',
});
export const CollectRequestSchema = z.object({
    pg_type: z.string().min(1),
    txn_id: z.string().min(1),
    amount: z.number().int().nonnegative(),
    merchant_id: merchantIdSchema,
    customer_email: z.string().email().or(z.literal('')),
    customer_phone: z.string().default(''),
    /**
     * Optional sanitized payer name from BossPay (≥backend 2026-04). When
     * present, the lender handler should pass these directly into the PG
     * payload (e.g. SabPaisa `payerFirstName` / `payerLastName`) without
     * re-sanitizing. Absent on older BossPay backends — handler should fall
     * back to its own default identity.
     */
    payer_first_name: sanitizedNameSchema.optional(),
    payer_last_name: sanitizedNameSchema.optional(),
    redirect_url: z.string().url(),
    /**
     * UPI-intent splash-page display hints. Used by the bridge to show a human-readable
     * VPA + payee name on the `/upi/{txnId}` splash page. NOT a feature flag anymore —
     * the authoritative VPA comes from SabPaisa's `confirmintentupiV1` response.
     */
    fixed_vpa: z.string().nullish(),
    upi_payee_name: z.string().nullish(),
    /**
     * SabPaisa direct-mint config, passed per-request so bridges remain stateless
     * across lender-merchant pairs. Captured once per pair via
     * `pnpm probe:sabpaisa --print-config` and stored on `lender_pgs` in the BossPay
     * DB. When all three are present AND the PG is SabPaisa, the bridge mints the
     * UPI-intent deeplink via SabPaisa's `confirmintentupiV1` API directly and emits
     * `upi_intent_url` on the response.
     */
    sabpaisa_client_id: z.number().int().positive().nullish(),
    sabpaisa_client_name: z.string().nullish(),
    sabpaisa_endpoint_json: z
        .object({ epId: z.number().int().positive() })
        .catchall(z.unknown())
        .nullish(),
});
/**
 * Inputs the bridge needs to (re-)mint a SabPaisa UPI-intent deeplink at
 * `/upi/{txnId}` time. Lender's `createCollection` handler returns this bag
 * whenever it wants to opt into the direct-mint UPI flow. The bridge stashes
 * it on the TxnStore keyed by `pg_transaction_id` and the BossPay `txn_id`,
 * then uses `sabpaisaDirectMint.ts` to mint on first visit and cache the
 * result for 10 minutes.
 */
export const UpiIntentMintInputsSchema = z.object({
    enc_data: z.string().min(1),
    client_code: z.string().min(1),
    client_txn_id: z.string().min(1),
    action_url: z.string().url(),
    amount_rupees: z.number().nonnegative(),
    email: z.string().default(''),
    phone: z.string().default(''),
    sabpaisa_client_id: z.number().int().positive(),
    sabpaisa_client_name: z.string().min(1),
    sabpaisa_endpoint_json: z
        .object({ epId: z.number().int().positive() })
        .catchall(z.unknown()),
    /** Splash-page display VPA (not authoritative — the real VPA is minted by SabPaisa). */
    display_vpa: z.string().nullish(),
    /** Splash-page display payee name. */
    display_payee_name: z.string().nullish(),
});
export const CollectResultSchema = z.object({
    payment_url: z.string().url(),
    pg_transaction_id: z.string().min(1),
    mode: z.enum(['redirect', 's2s']).optional(),
    /**
     * HTTPS bridge URL (e.g. `https://<bridge>/bosspay/v1/upi/{txnId}`) that drives
     * the UPI-intent direct-mint flow. Lender handlers that opt into this should
     * populate `upi_intent_mint_inputs` with the minting payload; the bridge renders
     * a splash page at this URL, mints the deeplink via `confirmintentupiV1`, and
     * redirects the top frame to `upi://pay?...`.
     */
    upi_intent_url: z.string().url().optional(),
    /** Minting payload — see `UpiIntentMintInputsSchema` for the required fields. */
    upi_intent_mint_inputs: UpiIntentMintInputsSchema.optional(),
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