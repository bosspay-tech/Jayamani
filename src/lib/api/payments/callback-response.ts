import { NextResponse } from "next/server";
import {
  getEasebuzzRedirectPath,
  handleEasebuzzCallback,
} from "@/lib/api/payments/handlers";
import { getSiteUrl } from "@/lib/site-url";

async function formDataFromRequest(request: Request): Promise<FormData> {
  if (request.method === "POST") {
    return request.formData();
  }

  const url = new URL(request.url);
  const formData = new FormData();

  for (const [key, value] of url.searchParams.entries()) {
    formData.set(key, value);
  }

  return formData;
}

export async function easebuzzCallbackResponse(request: Request) {
  const formData = await formDataFromRequest(request);
  const result = await handleEasebuzzCallback(formData);
  const siteUrl = getSiteUrl(request);

  return NextResponse.redirect(
    new URL(getEasebuzzRedirectPath(result), siteUrl),
    303
  );
}
