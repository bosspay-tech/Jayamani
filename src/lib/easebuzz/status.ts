import { createHash } from "crypto";
import { getEasebuzzConfig } from "./config";

export type EasebuzzTransactionRow = {
  txnid: string;
  status: string;
  amount: string;
  email?: string;
  phone?: string;
  easepayid?: string;
  [key: string]: unknown;
};

export type EasebuzzRetrieveResponse = {
  status: boolean;
  msg?: EasebuzzTransactionRow[] | string;
};

function buildSimpleRetrieveHash(key: string, txnid: string, salt: string): string {
  return createHash("sha512").update(`${key}|${txnid}|${salt}`).digest("hex").toLowerCase();
}

function getEasebuzzStatusUrl(): string {
  return (
    process.env.EASEBUZZ_STATUS_URL?.trim() ||
    "https://dashboard.easebuzz.in/transaction/v2.1/retrieve"
  );
}

/** Transaction status lookup used by the WordPress / DollerpayX bridge. */
export async function retrieveEasebuzzTransactionByTxnId(
  txnid: string
): Promise<EasebuzzRetrieveResponse> {
  const config = getEasebuzzConfig();
  if (!config) {
    throw new Error("Easebuzz is not configured.");
  }

  const hash = buildSimpleRetrieveHash(config.key, txnid, config.salt);
  const body = new URLSearchParams({ key: config.key, txnid, hash });

  const response = await fetch(getEasebuzzStatusUrl(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const raw = await response.text();
  try {
    return JSON.parse(raw) as EasebuzzRetrieveResponse;
  } catch {
    throw new Error(`Easebuzz retrieve returned non-JSON: ${raw.slice(0, 200)}`);
  }
}

export function resolveBridgeEasebuzzStatus(
  status?: string
): "success" | "failed" | "pending" {
  const normalized = (status || "").trim().toLowerCase();
  if (normalized === "success") return "success";
  if (normalized === "pending" || normalized === "initiated" || normalized === "in progress") {
    return "pending";
  }
  return "failed";
}

export function normalizeEasebuzzStatusResponse(
  result: EasebuzzRetrieveResponse,
  txnid: string
) {
  if (!result.status || !Array.isArray(result.msg) || !result.msg.length) {
    return {
      success: false,
      data: [] as Array<Record<string, unknown>>,
      error: typeof result.msg === "string" ? result.msg : "Transaction not found",
    };
  }

  const match = result.msg.find((row) => row.txnid === txnid) ?? result.msg[0] ?? null;
  if (!match) {
    return { success: false, data: [], error: "Transaction not found" };
  }

  return {
    success: true,
    data: [
      {
        collectRef: match.txnid,
        status: (match.status || "").toUpperCase(),
        amount: match.amount,
        easepayid: match.easepayid,
        raw: match,
      },
    ],
  };
}
