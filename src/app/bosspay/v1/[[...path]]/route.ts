import { getBridgeFetchHandler } from "@/lib/bosspay-bridge";

// DollerpayX bridge namespace: `/bosspay/v1/health`, `/collect`, `/status/:id`.
// WordPress-style `/wp-json/bosspay/v1/*` is handled separately.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request): Promise<Response> {
  return getBridgeFetchHandler()(req);
}

export const GET = handle;
export const POST = handle;
