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
    redirect_url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    pg_type: string;
    txn_id: string;
    amount: number;
    merchant_id: string;
    customer_email: string;
    customer_phone: string;
    redirect_url: string;
}, {
    pg_type: string;
    txn_id: string;
    amount: number;
    customer_email: string;
    redirect_url: string;
    merchant_id?: unknown;
    customer_phone?: string | undefined;
}>;
export type CollectRequest = z.infer<typeof CollectRequestSchema>;
export declare const CollectResultSchema: z.ZodObject<{
    payment_url: z.ZodString;
    pg_transaction_id: z.ZodString;
    mode: z.ZodOptional<z.ZodEnum<["redirect", "s2s"]>>;
}, "strip", z.ZodTypeAny, {
    payment_url: string;
    pg_transaction_id: string;
    mode?: "redirect" | "s2s" | undefined;
}, {
    payment_url: string;
    pg_transaction_id: string;
    mode?: "redirect" | "s2s" | undefined;
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