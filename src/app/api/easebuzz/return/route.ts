import { NextRequest, NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildRedirectUrl(request: NextRequest, body: Record<string, string>) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const txnid = body.txnid || body.udf1 || query.txnid || query.collect_ref || "";
  const pgStatus = (body.status || "").toLowerCase();
  const failed =
    query.outcome === "failed" ||
    pgStatus === "failure" ||
    pgStatus === "failed" ||
    pgStatus === "usercancelled" ||
    pgStatus === "cancelled";

  const siteUrl = getSiteUrl(request);

  if (failed) {
    const url = new URL("/payment/failed", `${siteUrl}/`);
    if (txnid) url.searchParams.set("txnid", txnid);
    url.searchParams.set("reason", pgStatus || "payment_failed");
    return url.toString();
  }

  const url = new URL("/payment/success", `${siteUrl}/`);
  if (txnid) url.searchParams.set("txnid", txnid);
  return url.toString();
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(buildRedirectUrl(request, {}), 302);
}

export async function POST(request: NextRequest) {
  let body: Record<string, string> = {};

  try {
    const formData = await request.formData();
    body = Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)])
    );
  } catch {
    body = {};
  }

  return NextResponse.redirect(buildRedirectUrl(request, body), 302);
}
