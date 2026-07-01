import { createHash } from "crypto";

const REQUEST_HASH_SEQUENCE =
  "key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10";

const RESPONSE_HASH_SEQUENCE =
  "udf10|udf9|udf8|udf7|udf6|udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key";

function buildHash(parts: string[]): string {
  return createHash("sha512").update(parts.join("|")).digest("hex").toLowerCase();
}

export function generatePaymentHash(
  params: Record<string, string>,
  salt: string
): string {
  const fields = REQUEST_HASH_SEQUENCE.split("|");
  const values = fields.map((field) => params[field] ?? "");
  values.push(salt);
  return buildHash(values);
}

export function verifyPaymentResponseHash(
  params: Record<string, string>,
  salt: string
): boolean {
  const received = params.hash?.toLowerCase();
  if (!received) return false;

  const fields = RESPONSE_HASH_SEQUENCE.split("|");
  const values = [salt, params.status ?? ""];
  for (const field of fields) {
    values.push(params[field] ?? "");
  }

  return buildHash(values) === received;
}
