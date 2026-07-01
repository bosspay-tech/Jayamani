import { easebuzzCallbackResponse } from "@/lib/api/payments/callback-response";

export async function POST(request: Request) {
  return easebuzzCallbackResponse(request);
}

export async function GET(request: Request) {
  return easebuzzCallbackResponse(request);
}
