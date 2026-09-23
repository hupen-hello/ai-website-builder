import type { Metadata } from "next";
import { headers } from "next/headers";
import { getBackendUrl } from "@/lib/backend";
import {
  buildPublishedJsonLd,
  buildPublishedMetadata,
  getSiteOrigin,
  hasPublishedBlogIndexPage,
  hasPublishedEventsPage,
  hasPublishedPortfolioPage,
  hasPublishedPropertiesPage,
  hasPublishedServicesPage,
  isKnownPublishedPagePath,
  isPublishedBlogPublicPath,
  isPublishedEventsPublicPath,
  isPublishedPortfolioPublicPath,
  isPublishedPropertiesPublicPath,
  isPublishedServicesPublicPath,
  resolvePublishedPageLabelFromSlug,
  resolvePublishedSeo,
  type PublishedSitePayload,
} from "@/lib/publishedSeo";
import PublishedSiteClient from "./PublishedSiteClient";

async function fetchPublishedSite(
  siteId: string,
): Promise<PublishedSitePayload | null> {
  // Prefer same-origin BFF (enriches SEO panel fields for page <title>/<meta>)
  try {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
    const proto = headerStore.get("x-forwarded-proto") || "http";
    const origin = host ? `${proto}://${host}` : getSiteOrigin();
    const res = await fetch(`${origin}/api/published/${siteId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as PublishedSitePayload;
    }
  } catch {
    /* fall through to backend */
  }

  try {
    const res = await fetch(`${getBackendUrl()}/sites/public/${siteId}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return (await res.json()) as PublishedSitePayload;
    }
  } catch {
    /* ignore */
  }

  return null;
}

async function resolveOrigin() {
  if (process.env.NEXT_PUBLIC_PUBLISH_BASE_URL) {
    return getSiteOrigin();
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return getSiteOrigin();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteId: string; pageSlug?: string }>;
}): Promise<Metadata> {
  const { siteId, pageSlug } = await params;
  const site = await fetchPublishedSite(siteId);
  if (!site) {
    return {
      title: "Sorry, website not found",
      robots: { index: false, follow: false },
    };
  }

  if (
    (isPublishedBlogPublicPath(pageSlug) &&
      !hasPublishedBlogIndexPage(site)) ||
    (isPublishedServicesPublicPath(pageSlug) &&
      !hasPublishedServicesPage(site)) ||
    (isPublishedEventsPublicPath(pageSlug) && !hasPublishedEventsPage(site)) ||
    (isPublishedPortfolioPublicPath(pageSlug) &&
      !hasPublishedPortfolioPage(site)) ||
    (isPublishedPropertiesPublicPath(pageSlug) &&
      !hasPublishedPropertiesPage(site)) ||
    (pageSlug && !isKnownPublishedPagePath(site, pageSlug))
  ) {
    return {
      title: "Page not found",
      robots: { index: false, follow: false },
    };
  }

  const origin = await resolveOrigin();
  const pageLabel = resolvePublishedPageLabelFromSlug(site, pageSlug);
  return buildPublishedMetadata(site, origin, pageLabel, pageSlug);
}

export default async function PublishedSitePage({
  params,
}: {
  params: Promise<{ siteId: string; pageSlug?: string }>;
}) {
  const { siteId, pageSlug } = await params;
  const site = await fetchPublishedSite(siteId);

  // Do not call notFound() — Next.js 16 + Turbopack Performance.measure crash.
  // PublishedSiteClient renders the 404 UI for missing / disabled pages.
  const origin = await resolveOrigin();
  const featureDisabled =
    Boolean(site) &&
    ((isPublishedBlogPublicPath(pageSlug) &&
      !hasPublishedBlogIndexPage(site)) ||
      (isPublishedServicesPublicPath(pageSlug) &&
        !hasPublishedServicesPage(site)) ||
      (isPublishedEventsPublicPath(pageSlug) &&
        !hasPublishedEventsPage(site)) ||
      (isPublishedPortfolioPublicPath(pageSlug) &&
        !hasPublishedPortfolioPage(site)) ||
      (isPublishedPropertiesPublicPath(pageSlug) &&
        !hasPublishedPropertiesPage(site)));
  const unknownPage =
    Boolean(site) &&
    Boolean(pageSlug) &&
    !featureDisabled &&
    !isKnownPublishedPagePath(site, pageSlug);
  const pageUnavailable = featureDisabled || unknownPage;
  const pageLabel = pageUnavailable
    ? "Home"
    : site
      ? resolvePublishedPageLabelFromSlug(site, pageSlug)
      : "Home";
  const seo =
    site && !pageUnavailable
      ? resolvePublishedSeo(site, origin, pageLabel, pageSlug)
      : null;
  const jsonLd =
    site && !pageUnavailable
      ? buildPublishedJsonLd(site, origin, pageLabel, pageSlug)
      : null;

  return (
    <>
      {/* Explicit head tags so SEO panel values always appear in page source */}
      {seo ? (
        <>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <meta name="keywords" content={seo.keywordsContent} />
          <meta property="og:title" content={seo.ogTitle} />
          <meta property="og:description" content={seo.ogDescription} />
          <meta property="og:url" content={seo.siteUrl} />
          <meta property="og:type" content={seo.ogType} />
          {seo.ogImage ? (
            <meta property="og:image" content={seo.ogImage} />
          ) : null}
          <meta name="twitter:title" content={seo.ogTitle} />
          <meta name="twitter:description" content={seo.ogDescription} />
          {seo.ogImage ? (
            <meta name="twitter:image" content={seo.ogImage} />
          ) : null}
          {seo.favicon ? <link rel="icon" href={seo.favicon} /> : null}
          <link rel="canonical" href={seo.siteUrl} />
        </>
      ) : pageUnavailable ? (
        <>
          <title>Page not found</title>
          <meta name="robots" content="noindex, nofollow" />
        </>
      ) : null}
      {seo?.googleAnalyticsId &&
      /^(G|GT|AW|UA)-[A-Z0-9-]+$/i.test(seo.googleAnalyticsId.trim()) ? (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId.trim()}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.googleAnalyticsId.trim()}');`,
            }}
          />
        </>
      ) : null}
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <PublishedSiteClient
        siteId={siteId}
        initialPageSlug={pageSlug}
        initialPayload={site}
      />
    </>
  );
}
