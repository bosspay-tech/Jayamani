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
export declare const CollectRequestSchema: z.ZodObject<{
    pg_type: z.ZodString;
    txn_id: z.ZodString;
    amount: z.ZodNumber;
    merchant_id: z.ZodEffects<z.ZodString, string, unknown>;
    customer_email: z.ZodUnion<[z.ZodString, z.ZodLiteral<"">]>;
    customer_phone: z.ZodDefault<z.ZodString>;
    /**
     * Optional sanitized payer name from BossPay (≥backend 2026-04). When
     * present, the lender handler should pass these directly into the PG
     * payload (e.g. SabPaisa `payerFirstName` / `payerLastName`) without
     * re-sanitizing. Absent on older BossPay backends — handler should fall
     * back to its own default identity.
     */
    payer_first_name: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    payer_last_name: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    redirect_url: z.ZodString;
    /**
     * UPI-intent splash-page display hints. Used by the bridge to show a human-readable
     * VPA + payee name on the `/upi/{txnId}` splash page. NOT a feature flag anymore —
     * the authoritative VPA comes from SabPaisa's `confirmintentupiV1` response.
     */
    fixed_vpa: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    upi_payee_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /**
     * SabPaisa direct-mint config, passed per-request so bridges remain stateless
     * across lender-merchant pairs. Captured once per pair via
     * `pnpm probe:sabpaisa --print-config` and stored on `lender_pgs` in the BossPay
     * DB. When all three are present AND the PG is SabPaisa, the bridge mints the
     * UPI-intent deeplink via SabPaisa's `confirmintentupiV1` API directly and emits
     * `upi_intent_url` on the response.
     */
    sabpaisa_client_id: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    sabpaisa_client_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    sabpaisa_endpoint_json: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        epId: z.ZodNumber;
    }, "strip", z.ZodUnknown, z.objectOutputType<{
        epId: z.ZodNumber;
    }, z.ZodUnknown, "strip">, z.objectInputType<{
        epId: z.ZodNumber;
    }, z.ZodUnknown, "strip">>>>;
}, "strip", z.ZodTypeAny, {
    pg_type: string;
    txn_id: string;
    amount: number;
    merchant_id: string;
    customer_email: string;
    customer_phone: string;
    redirect_url: string;
    payer_first_name?: string | undefined;
    payer_last_name?: string | undefined;
    fixed_vpa?: string | null | undefined;
    upi_payee_name?: string | null | undefined;
    sabpaisa_client_id?: number | null | undefined;
    sabpaisa_client_name?: string | null | undefined;
    sabpaisa_endpoint_json?: z.objectOutputType<{
        epId: z.ZodNumber;
    }, z.ZodUnknown, "strip"> | null | undefined;
}, {
    pg_type: string;
    txn_id: string;
    amount: number;
    customer_email: string;
    redirect_url: string;
    merchant_id?: unknown;
    customer_phone?: string | undefined;
    payer_first_name?: string | undefined;
    payer_last_name?: string | undefined;
    fixed_vpa?: string | null | undefined;
    upi_payee_name?: string | null | undefined;
    sabpaisa_client_id?: number | null | undefined;
    sabpaisa_client_name?: string | null | undefined;
    sabpaisa_endpoint_json?: z.objectInputType<{
        epId: z.ZodNumber;
    }, z.ZodUnknown, "strip"> | null | undefined;
}>;
export type CollectRequest = z.infer<typeof CollectRequestSchema>;
/**
 * Inputs the bridge needs to (re-)mint a SabPaisa UPI-intent deeplink at
 * `/upi/{txnId}` time. Lender's `createCollection` handler returns this bag
 * whenever it wants to opt into the direct-mint UPI flow. The bridge stashes
 * it on the TxnStore keyed by `pg_transaction_id` and the BossPay `txn_id`,
 * then uses `sabpaisaDirectMint.ts` to mint on first visit and cache the
 * result for 10 minutes.
 */
export declare const UpiIntentMintInputsSchema: z.ZodObject<{
    enc_data: z.ZodString;
    client_code: z.ZodString;
    client_txn_id: z.ZodString;
    action_url: z.ZodString;
    amount_rupees: z.ZodNumber;
    email: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodString>;
    sabpaisa_client_id: z.ZodNumber;
    sabpaisa_client_name: z.ZodString;
    sabpaisa_endpoint_json: z.ZodObject<{
        epId: z.ZodNumber;
    }, "strip", z.ZodUnknown, z.objectOutputType<{
        epId: z.ZodNumber;
    }, z.ZodUnknown, "strip">, z.objectInputType<{
        epId: z.ZodNumber;
    }, z.ZodUnknown, "strip">>;
    /** Splash-page display VPA (not authoritative — the real VPA is minted by SabPaisa). */
    display_vpa: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    /** Splash-page display payee name. */
    display_payee_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    sabpaisa_client_id: number;
    sabpaisa_client_name: string;
    sabpaisa_endpoint_json: {
        epId: number;
    } & {
        [k: string]: unknown;
    };
    enc_data: string;
    client_code: string;
    client_txn_id: string;
    action_url: string;
    amount_rupees: number;
    email: string;
    phone: string;
    display_vpa?: string | null | undefined;
    display_payee_name?: string | null | undefined;
}, {
    sabpaisa_client_id: number;
    sabpaisa_client_name: string;
    sabpaisa_endpoint_json: {
        epId: number;
    } & {
        [k: string]: unknown;
    };
    enc_data: string;
    client_code: string;
    client_txn_id: string;
    action_url: string;
    amount_rupees: number;
    email?: string | undefined;
    phone?: string | undefined;
    display_vpa?: string | null | undefined;
    display_payee_name?: string | null | undefined;
}>;
export type UpiIntentMintInputs = z.infer<typeof UpiIntentMintInputsSchema>;
export declare const CollectResultSchema: z.ZodObject<{
    payment_url: z.ZodString;
    pg_transaction_id: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<["redirect", "s2s"]>>;
    /**
     * HTTPS bridge URL (e.g. `https://<bridge>/bosspay/v1/upi/{txnId}`) that drives
     * the UPI-intent direct-mint flow. Lender handlers that opt into this should
     * populate `upi_intent_mint_inputs` with the minting payload; the bridge renders
     * a splash page at this URL, mints the deeplink via `confirmintentupiV1`, and
     * redirects the top frame to `upi://pay?...`.
     */
    upi_intent_url: z.ZodOptional<z.ZodString>;
    /** Minting payload — see `UpiIntentMintInputsSchema` for the required fields. */
    upi_intent_mint_inputs: z.ZodOptional<z.ZodObject<{
        enc_data: z.ZodString;
        client_code: z.ZodString;
        client_txn_id: z.ZodString;
        action_url: z.ZodString;
        amount_rupees: z.ZodNumber;
        email: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodString>;
        sabpaisa_client_id: z.ZodNumber;
        sabpaisa_client_name: z.ZodString;
        sabpaisa_endpoint_json: z.ZodObject<{
            epId: z.ZodNumber;
        }, "strip", z.ZodUnknown, z.objectOutputType<{
            epId: z.ZodNumber;
        }, z.ZodUnknown, "strip">, z.objectInputType<{
            epId: z.ZodNumber;
        }, z.ZodUnknown, "strip">>;
        /** Splash-page display VPA (not authoritative — the real VPA is minted by SabPaisa). */
        display_vpa: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        /** Splash-page display payee name. */
        display_payee_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        sabpaisa_client_id: number;
        sabpaisa_client_name: string;
        sabpaisa_endpoint_json: {
            epId: number;
        } & {
            [k: string]: unknown;
        };
        enc_data: string;
        client_code: string;
        client_txn_id: string;
        action_url: string;
        amount_rupees: number;
        email: string;
        phone: string;
        display_vpa?: string | null | undefined;
        display_payee_name?: string | null | undefined;
    }, {
        sabpaisa_client_id: number;
        sabpaisa_client_name: string;
        sabpaisa_endpoint_json: {
            epId: number;
        } & {
            [k: string]: unknown;
        };
        enc_data: string;
        client_code: string;
        client_txn_id: string;
        action_url: string;
        amount_rupees: number;
        email?: string | undefined;
        phone?: string | undefined;
        display_vpa?: string | null | undefined;
        display_payee_name?: string | null | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    payment_url: string;
    pg_transaction_id: string;
    mode?: "redirect" | "s2s" | undefined;
    upi_intent_url?: string | undefined;
    upi_intent_mint_inputs?: {
        sabpaisa_client_id: number;
        sabpaisa_client_name: string;
        sabpaisa_endpoint_json: {
            epId: number;
        } & {
            [k: string]: unknown;
        };
        enc_data: string;
        client_code: string;
        client_txn_id: string;
        action_url: string;
        amount_rupees: number;
        email: string;
        phone: string;
        display_vpa?: string | null | undefined;
        display_payee_name?: string | null | undefined;
    } | undefined;
}, {
    payment_url: string;
    pg_transaction_id: string;
    mode?: "redirect" | "s2s" | undefined;
    upi_intent_url?: string | undefined;
    upi_intent_mint_inputs?: {
        sabpaisa_client_id: number;
        sabpaisa_client_name: string;
        sabpaisa_endpoint_json: {
            epId: number;
        } & {
            [k: string]: unknown;
        };
        enc_data: string;
        client_code: string;
        client_txn_id: string;
        action_url: string;
        amount_rupees: number;
        email?: string | undefined;
        phone?: string | undefined;
        display_vpa?: string | null | undefined;
        display_payee_name?: string | null | undefined;
    } | undefined;
}>;
export type CollectResult = z.infer<typeof CollectResultSchema>;
export declare const PayoutRequestSchema: z.ZodObject<{
    pg_type: z.ZodString;
    amount: z.ZodNumber;
    merchant_id: z.ZodEffects<z.ZodString, string, unknown>;
    beneficiary: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    reference_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pg_type: string;
    amount: number;
    merchant_id: string;
    beneficiary: Record<string, unknown>;
    reference_id: string;
}, {
    pg_type: string;
    amount: number;
    beneficiary: Record<string, unknown>;
    reference_id: string;
    merchant_id?: unknown;
}>;
export type PayoutRequest = z.infer<typeof PayoutRequestSchema>;
export declare const PayoutResultSchema: z.ZodObject<{
    pg_reference: z.ZodString;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    pg_reference: string;
}, {
    status: string;
    pg_reference: string;
}>;
export type PayoutResult = z.infer<typeof PayoutResultSchema>;
/** Normalized transaction status — what BossPay expects back from /status. */
export declare const TxnStatusEnum: z.ZodEnum<["success", "failed", "pending"]>;
export type TxnStatus = z.infer<typeof TxnStatusEnum>;
export interface StatusRequest {
    pg_type: string;
    pg_txn_id: string;
}
export declare const StatusResultSchema: z.ZodObject<{
    status: z.ZodEnum<["success", "failed", "pending"]>;
    pg_transaction_id: z.ZodString;
    amount: z.ZodNumber;
    raw_pg_response: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status: "success" | "failed" | "pending";
    amount: number;
    pg_transaction_id: string;
    raw_pg_response?: Record<string, unknown> | undefined;
}, {
    status: "success" | "failed" | "pending";
    amount: number;
    pg_transaction_id: string;
    raw_pg_response?: Record<string, unknown> | undefined;
}>;
export type StatusResult = z.infer<typeof StatusResultSchema>;
export interface HealthResult {
    status: 'ok';
    version: string;
    enabled_pgs: string[];
    pg_status: Record<string, boolean>;
}
export declare const CallbackPayloadSchema: z.ZodObject<{
    status: z.ZodEnum<["success", "failed"]>;
    pg_transaction_id: z.ZodString;
    amount: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status: "success" | "failed";
    amount: number;
    pg_transaction_id: string;
    metadata?: Record<string, unknown> | undefined;
}, {
    status: "success" | "failed";
    amount: number;
    pg_transaction_id: string;
    metadata?: Record<string, unknown> | undefined;
}>;
export type CallbackPayload = z.infer<typeof CallbackPayloadSchema>;
/**
 * One set of handlers per PG type (e.g. `sabpaisa`, `airpay`). The lender
 * implements these against their existing PG integration — they are the only
 * functions the lender needs to write.
 *
 * All handlers receive already-validated inputs and may throw to signal a
 * provider-side failure; the bridge translates thrown errors into a 500 with
 * the error message in the response body (matching the WP plugin behavior).
 */
export interface PGHandlers {
    /** Create a collection (payment) at the PG; return redirect URL + PG's txn id. */
    createCollection: (req: CollectRequest) => Promise<CollectResult>;
    /** Query the PG for the current status of a previously-created transaction. */
    checkStatus: (req: StatusRequest) => Promise<StatusResult>;
    /** Optional: initiate a payout/disbursement at the PG. Omit for collection-only PGs. */
    createPayout?: (req: PayoutRequest) => Promise<PayoutResult>;
    /**
     * Optional: return `true` if this PG is reachable / configured. Used by
     * `/health` to populate `pg_status`. Defaults to `true` if omitted.
     */
    isAvailable?: () => Promise<boolean>;
}
/** Map of `pg_type` → handlers. Keys must match `lender_pgs.pg_type` in BossPay. */
export type BridgeHandlers = Record<string, PGHandlers | undefined>;
export declare class BridgeError extends Error {
    readonly statusCode: number;
    readonly code: string;
    constructor(statusCode: number, code: string, message: string);
}
//# sourceMappingURL=types.d.ts.map