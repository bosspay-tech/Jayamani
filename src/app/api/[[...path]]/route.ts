import { handleApiRoute } from "@/lib/api/router";

interface ApiRouteContext {
  params: Promise<{ path?: string[] }>;
}

async function resolve(request: Request, context: ApiRouteContext) {
  const { path = [] } = await context.params;
  return handleApiRoute(request, path);
}

export const GET = resolve;
export const POST = resolve;
export const PATCH = resolve;
export const PUT = resolve;
export const DELETE = resolve;
