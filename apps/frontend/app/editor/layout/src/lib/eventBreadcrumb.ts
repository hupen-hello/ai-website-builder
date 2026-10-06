import { eventVariant } from "../components/sections/about/eventPageDefaults";

const BANNER_BY_SLUG: Record<string, string> = {
  "about-us": "PageBannerEvent1",
  about: "PageBannerEvent1",
  mission: "MissionPageBanner",
  vision: "VisionPageBanner",
  awards: "AwardsPageBanner",
  "our-story": "OurStoryPageBanner",
  "our-team": "OurTeamPageBanner",
  "team-detail": "TeamDetailPageBanner",
  "why-choose-us": "WhyChooseUsPageBanner",
  services: "ServicesPageBanner",
  "services-detail": "ServiceDetailPageBanner",
  event: "EventsPageBanner",
  events: "EventsPageBanner",
  "event-detail": "EventDetailPageBanner",
  gallery: "GalleryPageBanner",
  testimonials: "TestimonialsPageBanner",
  partners: "PartnersPageBanner",
  faqs: "FaqsPageBanner",
  faq: "FaqsPageBanner",
  career: "CareerPageBanner",
  "career-detail": "CareerDetailPageBanner",
  "get-a-quote": "GetAQuotePageBanner",
  blog: "BlogPageBanner",
  blogs: "BlogPageBanner",
  "blog-detail": "BlogDetailPageBanner",
  "terms-conditions": "TermsPageBanner",
  "privacy-policy": "PrivacyPageBanner",
  disclaimer: "DisclaimerPageBanner",
  "refund-cancellation": "RefundPageBanner",
  "cookies-policy": "CookiesPageBanner",
  contact: "ContactPageBanner",
  sitemap: "SitemapPageBanner",
};

export type EventBreadcrumbCrumb = {
  label: string;
  href?: string;
};

function slugFromLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, "-");
}

function readCrumbs(value: unknown): EventBreadcrumbCrumb[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const label = typeof row.label === "string" ? row.label.trim() : "";
    if (!label) return [];
    const href = typeof row.href === "string" ? row.href : undefined;
    return [href ? { label, href } : { label }];
  });
}

/** Title, background, and trail shown by the Event page banner. */
export function resolveEventBreadcrumbView(input: {
  currentPage?: string;
  pageSlug?: string;
  data?: Record<string, unknown>;
}): {
  title: string;
  bgImage: string;
  breadcrumbs: EventBreadcrumbCrumb[];
} {
  const data = input.data ?? {};
  const current =
    input.currentPage && input.currentPage.trim().toLowerCase() !== "home"
      ? input.currentPage.trim()
      : "";
  const slug = slugFromLabel(current || input.pageSlug || "");
  const banner = eventVariant(
    "PageBanner",
    BANNER_BY_SLUG[slug] || "PageBannerEvent1",
  );
  const rawTitle = typeof data.title === "string" ? data.title.trim() : "";
  const savedTitle =
    rawTitle && rawTitle !== "About Us" && rawTitle !== "Page" ? rawTitle : "";
  const bannerTitle = String(banner.title || "");
  const titleWasEdited = Boolean(
    savedTitle && savedTitle !== current && savedTitle !== bannerTitle,
  );
  const title = titleWasEdited
    ? savedTitle
    : current || savedTitle || bannerTitle || "Page";
  const rawBg = typeof data.bgImage === "string" ? data.bgImage.trim() : "";
  const bgImage = rawBg || String(banner.bgImage || "");
  const savedCrumbs = readCrumbs(data.breadcrumbs);
  const lastCrumb = savedCrumbs[savedCrumbs.length - 1]?.label || "";
  const staleAboutTrail = lastCrumb === "About Us" && title !== "About Us";
  const breadcrumbs =
    savedCrumbs.length && !staleAboutTrail
      ? savedCrumbs
      : [
          { label: "Home", href: "/" },
          { label: title },
        ];

  return { title, bgImage, breadcrumbs };
}
