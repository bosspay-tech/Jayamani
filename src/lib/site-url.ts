function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalHost(host: string): boolean {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".local")
  );
}

function siteUrlFromRequest(request: Request): string | null {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  if (!host || isLocalHost(host.split(":")[0])) {
    return null;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto ?? "https";

  return normalizeSiteUrl(`${protocol}://${host}`);
}

export function getSiteUrl(request?: Request): string {
  // Runtime server env — not inlined at build time (set this in Coolify).
  const runtimeSiteUrl = process.env.SITE_URL?.trim();
  if (runtimeSiteUrl) {
    return normalizeSiteUrl(runtimeSiteUrl);
  }

  if (request) {
    const fromRequest = siteUrlFromRequest(request);
    if (fromRequest) {
      return fromRequest;
    }
  }

  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (publicSiteUrl && !publicSiteUrl.includes("localhost")) {
    return normalizeSiteUrl(publicSiteUrl);
  }

  if (request) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost ?? request.headers.get("host");
    if (host) {
      const forwardedProto = request.headers.get("x-forwarded-proto");
      const protocol =
        forwardedProto ?? (isLocalHost(host.split(":")[0]) ? "http" : "https");
      return normalizeSiteUrl(`${protocol}://${host}`);
    }
  }

  return "http://localhost:3000";
}
