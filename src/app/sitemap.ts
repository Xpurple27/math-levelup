import type { MetadataRoute } from "next";

function publicUrl() {
  const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return process.env.NEXT_PUBLIC_APP_URL || (deploymentHost ? `https://${deploymentHost}` : "http://localhost:3000");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicUrl().replace(/\/$/, "");
  return [
    {
      url: base,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
