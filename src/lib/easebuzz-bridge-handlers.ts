import type {
  CollectRequest,
  CollectResult,
  PGHandlers,
  StatusRequest,
  StatusResult,
} from "@dpx/bridge-node";
import type { EasebuzzConfig } from "@dpx/bridge-node";
import { initiateEasebuzzPayment } from "@/lib/easebuzz/client";
import {
  normalizeEasebuzzStatusResponse,
  resolveBridgeEasebuzzStatus,
  retrieveEasebuzzTransactionByTxnId,
} from "@/lib/easebuzz/status";
import { getSiteUrl } from "@/lib/site-url";

function trimEnv(value: string | undefined): string {
  return (value ?? "").trim().replace(/^["']|["']$/g, "");
}

function resolveBridgeOrigin(): string {
  const siteUrl = trimEnv(process.env.SITE_URL) || trimEnv(process.env.NEXT_PUBLIC_SITE_URL);
  if (siteUrl) {
    return siteUrl.replace(/\/+$/, "");
  }
  return getSiteUrl();
}

function normalizeBridgePhone(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length > 10) return digits.slice(-10);
  return digits || "9999999999";
}

function ensureBridgeEmail(raw: string): string {
  const trimmed = (raw ?? "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    ? trimmed
    : "customer@jayamanicollections.com";
}

function ensureBridgeName(req: CollectRequest): string {
  const fromPayer = req.payer_first_name?.replace(/[^A-Za-z]/g, "");
  if (fromPayer) return fromPayer;
  const fromEmail = req.customer_email?.split("@")[0]?.replace(/[^A-Za-z]/g, "");
  return fromEmail || "Customer";
}

/**
 * Easebuzz handlers for DollerpayX / WordPress bridge collect.
 * Redirect mode with surl/furl on this host (same pattern as educazi2).
 */
export function createJayamaniEasebuzzHandlers(config: EasebuzzConfig): PGHandlers {
  const productinfo = config.productinfo ?? "Jayamani Collections Payment";

  return {
    createCollection: async (req: CollectRequest): Promise<CollectResult> => {
      const txnid = req.txn_id;
      const amount = req.amount / 100;
      const email = ensureBridgeEmail(req.customer_email);
      const phone = normalizeBridgePhone(req.customer_phone);
      const firstname = ensureBridgeName(req);
      const origin = resolveBridgeOrigin();
      const surl = `${origin}/api/easebuzz/return?outcome=success`;
      const furl = `${origin}/api/easebuzz/return?outcome=failed`;

      const result = await initiateEasebuzzPayment({
        txnid,
        amount,
        productinfo: `Order ${txnid}`,
        firstname,
        email,
        phone,
        surl,
        furl,
        udf1: txnid,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        payment_url: result.paymentUrl,
        pg_transaction_id: txnid,
        mode: "redirect",
      };
    },

    checkStatus: async (req: StatusRequest): Promise<StatusResult> => {
      const result = await retrieveEasebuzzTransactionByTxnId(req.pg_txn_id);
      const normalized = normalizeEasebuzzStatusResponse(result, req.pg_txn_id);

      if (!normalized.success || !normalized.data.length) {
        return { status: "pending", pg_transaction_id: req.pg_txn_id, amount: 0 };
      }

      const row = normalized.data[0] as {
        status?: string;
        amount?: unknown;
        raw?: Record<string, unknown>;
      };
      const amountPaisa = Math.max(0, Math.round(Number(row.amount ?? 0) * 100));

      return {
        status: resolveBridgeEasebuzzStatus(String(row.status ?? "")),
        pg_transaction_id: req.pg_txn_id,
        amount: amountPaisa,
        ...(row.raw ? { raw_pg_response: row.raw } : {}),
      };
    },

    isAvailable: async () => Boolean(config.key && config.salt),
  };
}
