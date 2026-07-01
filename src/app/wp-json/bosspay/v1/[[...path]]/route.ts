import { getBridgeFetchHandler } from "@/lib/bosspay-bridge";

// DollerpayX's WordPress bridge adapter calls the bridge under `/wp-json/bosspay/v1/*`.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request): Promise<Response> {
  return getBridgeFetchHandler()(req);
}

export const GET = handle;
export const POST = handle;
