import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VyaparSaathi City",
    short_name: "VyaparSaathi",
    description: "Plan a small business: market gaps, area map, money, permits, pilot khata and a lender pitch sheet.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f6ef",
    theme_color: "#142019",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
