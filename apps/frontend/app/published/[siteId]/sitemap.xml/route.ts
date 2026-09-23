import { getBackendUrl } from "@/lib/backend";
import { getSiteOrigin } from "@/lib/publishedSeo";

type PageLink = {
  label: string;
  href: string;
  kind?: string;
  hidden?: boolean;
  slug?: string;
  children?: PageLink[];
};

type SectionItem = {
  type: string;
  page?: string;
  variant: string;
  data?: Record<string, unknown>;
};

type SitePayload = {
  pageLinks: PageLink[];
  sections: SectionItem[];
  updatedAt?: string;
};

async function fetchSite(siteId: string): Promise<SitePayload | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/sites/public/${siteId}`, {
      next: { revalidate: 600 },
    });
    if (res.ok) return (await res.json()) as SitePayload;
  } catch {
    /* ignore */
  }
  return null;
}

function normalizeSlug(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, "-");
}

function collectPageUrls(
  base: string,
  payload: SitePayload,
): { url: string; lastmod: string }[] {
  const lastmod = payload.updatedAt
    ? new Date(payload.updatedAt).toISOString()
    : new Date().toISOString();

  const urls: { url: string; lastmod: string }[] = [
    { url: base, lastmod },
  ];

  const addedSlugs = new Set<string>(["home"]);

  const addPage = (slug: string) => {
    const normalized = normalizeSlug(slug);
    if (addedSlugs.has(normalized)) return;
    addedSlugs.add(normalized);
    urls.push({ url: `${base}/${normalized}`, lastmod });
  };

  // Pages from pageLinks
  for (const link of payload.pageLinks) {
    if (link.hidden) continue;
    if (link.kind === "blog" || link.kind === "document") continue;
    const href = link.href || "";
    const slug =
      link.slug ||
      href.replace(/^#page-/i, "").replace(/^\//, "").replace(/\/$/, "");
    if (slug && slug !== "home") addPage(slug);

    if (link.children) {
      for (const child of link.children) {
        if (child.hidden) continue;
        const childSlug =
          child.slug ||
          (child.href || "")
            .replace(/^#page-/i, "")
            .replace(/^\//, "")
            .replace(/\/$/, "");
        if (childSlug && childSlug !== "home") addPage(childSlug);
      }
    }
  }

  // Blog index & individual blogs
  const hasBlog = payload.sections.some(
    (s) =>
      s.type === "BlogPage" ||
      (s.type === "Blog" && normalizeSlug(s.page || "") === "blogs"),
  );
  if (hasBlog) {
    addPage("blogs");
    const blogLinks = payload.pageLinks.filter(
      (l) => l.kind === "blog" && !l.hidden,
    );
    for (const blog of blogLinks) {
      const slug =
        blog.slug || normalizeSlug(blog.label || "");
      if (slug) urls.push({ url: `${base}/blog/${slug}`, lastmod });
    }
  }

  // Services
  const hasServices = payload.sections.some(
    (s) =>
      s.type === "ServicePage" ||
      (s.type === "Service" &&
        ["services", "service"].includes(normalizeSlug(s.page || ""))),
  );
  if (hasServices) {
    addPage("services");
    const serviceData = payload.sections.find(
      (s) => s.type === "ServicePage" || s.type === "Service",
    )?.data;
    if (serviceData) {
      const variant = Object.values(serviceData)[0] as Record<string, unknown> | undefined;
      const items = (variant?.productItems || variant?.serviceSlides || []) as Array<{
        title?: string;
        slug?: string;
      }>;
      for (const item of items) {
        const slug = item.slug || normalizeSlug(item.title || "");
        if (slug) urls.push({ url: `${base}/service/${slug}`, lastmod });
      }
    }
  }

  // Events
  const hasEvents = payload.sections.some(
    (s) =>
      s.type === "EventPage" ||
      (s.type === "Event" &&
        ["events", "event"].includes(normalizeSlug(s.page || ""))),
  );
  if (hasEvents) addPage("events");

  // Properties
  const hasProperties = payload.sections.some(
    (s) =>
      s.type === "PropertyPage" ||
      (s.type === "Property" &&
        ["properties", "property", "buy-a-property", "rent-a-property"].includes(
          normalizeSlug(s.page || ""),
        )),
  );
  if (hasProperties) addPage("properties");

  // Portfolio
  const hasPortfolio = payload.sections.some(
    (s) =>
      s.type === "PortfolioPage" ||
      (s.type === "Portfolio" &&
        ["portfolio", "projects"].includes(normalizeSlug(s.page || ""))),
  );
  if (hasPortfolio) addPage("portfolio");

  // Teams
  const hasTeams = payload.sections.some(
    (s) =>
      s.type === "TeamPage" ||
      (s.type === "Team" &&
        ["teams", "team"].includes(normalizeSlug(s.page || ""))),
  );
  if (hasTeams) addPage("teams");

  // Gallery
  const hasGallery = payload.sections.some(
    (s) =>
      s.type === "GalleryPage" ||
      (s.type === "Gallery" && normalizeSlug(s.page || "") === "gallery"),
  );
  if (hasGallery) addPage("gallery");

  return urls;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;
  const payload = await fetchSite(siteId);

  if (!payload) {
    return new Response("Site not found", { status: 404 });
  }

  const origin = getSiteOrigin();
  const base = `${origin}/published/${encodeURIComponent(siteId)}`;
  const pages = collectPageUrls(base, payload);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${escapeXml(p.url)}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
    },
  });
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
