import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "@/lib/api/auth/handlers";
import {
  createProduct,
  deleteProduct,
  getAdminProduct,
  listAdminCategories,
  listAdminProducts,
  updateProduct,
} from "@/lib/api/products/handlers";
import {
  createOrder,
  getOrder,
  listAdminOrders,
  listOrders,
} from "@/lib/api/orders/handlers";
import { uploadProductImage } from "@/lib/api/uploads/handlers";
import { apiError } from "@/lib/api/response";

type RouteHandler = (
  request: Request,
  params: Record<string, string>
) => Promise<Response> | Response;

interface RouteDefinition {
  method: string;
  pattern: RegExp;
  paramNames?: string[];
  handler: RouteHandler;
}

function extractParams(
  match: RegExpMatchArray,
  paramNames?: string[]
): Record<string, string> {
  if (!paramNames?.length) return {};
  return Object.fromEntries(
    paramNames.map((name, index) => [name, match[index + 1]])
  );
}

const routes: RouteDefinition[] = [
  {
    method: "POST",
    pattern: /^auth\/register$/,
    handler: (request) => registerUser(request),
  },
  {
    method: "POST",
    pattern: /^auth\/login$/,
    handler: (request) => loginUser(request),
  },
  {
    method: "POST",
    pattern: /^auth\/logout$/,
    handler: () => logoutUser(),
  },
  {
    method: "GET",
    pattern: /^auth\/me$/,
    handler: () => getCurrentUser(),
  },
  {
    method: "GET",
    pattern: /^admin\/products$/,
    handler: () => listAdminProducts(),
  },
  {
    method: "POST",
    pattern: /^admin\/products$/,
    handler: (request) => createProduct(request),
  },
  {
    method: "GET",
    pattern: /^admin\/products\/([^/]+)$/,
    paramNames: ["id"],
    handler: (_request, params) => getAdminProduct(params.id),
  },
  {
    method: "PATCH",
    pattern: /^admin\/products\/([^/]+)$/,
    paramNames: ["id"],
    handler: (request, params) => updateProduct(params.id, request),
  },
  {
    method: "DELETE",
    pattern: /^admin\/products\/([^/]+)$/,
    paramNames: ["id"],
    handler: (_request, params) => deleteProduct(params.id),
  },
  {
    method: "GET",
    pattern: /^admin\/categories$/,
    handler: () => listAdminCategories(),
  },
  {
    method: "POST",
    pattern: /^admin\/upload$/,
    handler: (request) => uploadProductImage(request),
  },
  {
    method: "POST",
    pattern: /^orders$/,
    handler: (request) => createOrder(request),
  },
  {
    method: "GET",
    pattern: /^orders$/,
    handler: () => listOrders(),
  },
  {
    method: "GET",
    pattern: /^orders\/([^/]+)$/,
    paramNames: ["id"],
    handler: (_request, params) => getOrder(params.id),
  },
  {
    method: "GET",
    pattern: /^admin\/orders$/,
    handler: () => listAdminOrders(),
  },
];

export async function handleApiRoute(
  request: Request,
  pathSegments: string[] = []
) {
  const path = pathSegments.join("/");
  const method = request.method.toUpperCase();

  for (const route of routes) {
    if (route.method !== method) continue;

    const match = path.match(route.pattern);
    if (!match) continue;

    const params = extractParams(match, route.paramNames);
    return route.handler(request, params);
  }

  return apiError(`Route not found: ${method} /api/${path}`, 404);
}
