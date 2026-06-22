function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export function getSiteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return normalizeSiteUrl(configured);
  }

  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost ?? request.headers.get("host");
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const protocol = forwardedProto ?? (host?.includes("localhost") ? "http" : "https");

    if (host) {
      return normalizeSiteUrl(`${protocol}://${host}`);
    }
  }

  return "http://localhost:3000";
}
