import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/interview", "/resume", "/roadmap", "/dsa", "/cover-letter", "/profile"],
    },
    sitemap: "https://ai-interview-copilot.vercel.app/sitemap.xml",
  };
}
