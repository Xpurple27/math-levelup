import type { NextRequest } from "next/server";

const fallbackSiteUrl = "https://www.levelup-academybna.fun";

export function publicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    fallbackSiteUrl
  )
    .trim()
    .replace(/\/$/, "");
}

export function appOrigin(request: NextRequest) {
  const configured = (
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  )
    ?.trim()
    .replace(/\/$/, "");
  if (configured) return configured;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;

  return request.nextUrl.origin;
}
