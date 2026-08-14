import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Title Fight",
    short_name: "Title Fight",
    description: "Same name. Different song. Crown the best in an 8-seed bracket.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "en",
    categories: ["entertainment", "music", "games"],
    background_color: "#F7F4ED",
    theme_color: "#F7F4ED",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
