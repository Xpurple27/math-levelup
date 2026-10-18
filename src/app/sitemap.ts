import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = publicSiteUrl();
  return [
    {
      url: base,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
