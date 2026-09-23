import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/publishedSeo";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/published/"],
        disallow: [
          "/editor",
          "/editor/",
          "/api/",
          "/preview",
          "/preview/",
          "/admin",
          "/admin/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
