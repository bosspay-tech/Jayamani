import { getEasebuzzConfig } from "./config";
import { generatePaymentHash } from "./hash";

export interface InitiatePaymentInput {
  txnid: string;
  amount: number;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl: string;
  furl: string;
  udf1?: string;
}

function buildPaymentUrl(baseUrl: string, data: string): string {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const value = data.trim();

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/pay/")) {
    return `${normalizedBase}${value}`;
  }

  if (value.startsWith("pay/")) {
    return `${normalizedBase}/${value}`;
  }

  return `${normalizedBase}/pay/${value}`;
}

export async function initiateEasebuzzPayment(input: InitiatePaymentInput) {
  const config = getEasebuzzConfig();
  if (!config) {
    return { success: false as const, error: "Easebuzz is not configured." };
  }

  const payload: Record<string, string> = {
    key: config.key,
    txnid: input.txnid,
    amount: input.amount.toFixed(2),
    productinfo: input.productinfo,
    firstname: input.firstname,
    email: input.email,
    phone: input.phone.replace(/\D/g, "").slice(-10),
    surl: input.surl,
    furl: input.furl,
    udf1: input.udf1 ?? "",
    udf2: "",
    udf3: "",
    udf4: "",
    udf5: "",
    udf6: "",
    udf7: "",
    udf8: "",
    udf9: "",
    udf10: "",
  };

  payload.hash = generatePaymentHash(payload, config.salt);

  const body = new URLSearchParams(payload);
  const response = await fetch(`${config.baseUrl}/payment/initiateLink`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const result = (await response.json()) as {
    status?: number;
    data?: string;
    error_desc?: string;
  };

  if (!response.ok || result.status !== 1 || !result.data) {
    return {
      success: false as const,
      error: result.error_desc ?? "Failed to start Easebuzz payment.",
    };
  }

  return { success: true as const, paymentUrl: buildPaymentUrl(config.baseUrl, result.data) };
}
