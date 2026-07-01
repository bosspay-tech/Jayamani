import { NextRequest, NextResponse } from "next/server";
import { getEasebuzzConfig } from "@/lib/easebuzz/config";
import { verifyPaymentResponseHash } from "@/lib/easebuzz/hash";
import { getBossPayBridge } from "@/lib/bosspay-bridge";
import { handleEasebuzzWebhook } from "@dpx/bridge-node";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formDataToRecord(formData: FormData): Record<string, string> {
  const payload: Record<string, string> = {};
  formData.forEach((value, key) => {
    payload[key] = String(value);
  });
  return payload;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload = formDataToRecord(formData);
    const config = getEasebuzzConfig();

    if (!config) {
      return NextResponse.json({ ok: false, error: "Easebuzz not configured" }, { status: 500 });
    }

    if (!verifyPaymentResponseHash(payload, config.salt)) {
      return NextResponse.json({ ok: false, error: "Invalid hash" }, { status: 400 });
    }

    if (process.env.BOSSPAY_BRIDGE_SECRET?.trim()) {
      try {
        const bridge = getBossPayBridge();
        const result = await handleEasebuzzWebhook(payload, {
          salt: config.salt,
          forwardCallback: (args) => bridge.forwardCallback(args),
        });
        return NextResponse.json({ ok: true, ...result });
      } catch (forwardErr) {
        console.warn("DollerpayX callback forward skipped:", forwardErr);
      }
    }

    return NextResponse.json({ ok: true, outcome: "processed" });
  } catch (error) {
    console.error("Easebuzz webhook error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 400 }
    );
  }
}
