import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VECTRA Math",
    short_name: "VECTRA",
    description: "Know where you are. Know where to go next.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7F8FA",
    theme_color: "#0B1020",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
