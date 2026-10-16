import type { MetadataRoute } from "next";

function publicUrl() {
  const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return process.env.NEXT_PUBLIC_APP_URL || (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000");
}

export default function robots(): MetadataRoute.Robots {
  const base = publicUrl().replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/admin", "/reviewer", "/api", "/auth"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
