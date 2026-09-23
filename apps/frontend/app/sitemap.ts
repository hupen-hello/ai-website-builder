import type { MetadataRoute } from "next";
import { getBackendUrl } from "@/lib/backend";
import { getSiteOrigin } from "@/lib/publishedSeo";

type PublishedListItem = {
  slug: string;
  title: string;
  updatedAt: string;
  publishedAt: string | null;
};

async function listPublishedSites(): Promise<PublishedListItem[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/sites/public`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublishedListItem[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const sites = await listPublishedSites();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: origin,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const publishedRoutes: MetadataRoute.Sitemap = sites.map((site) => ({
    url: `${origin}/published/${site.slug}`,
    lastModified: new Date(site.updatedAt || site.publishedAt || Date.now()),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...publishedRoutes];
}
