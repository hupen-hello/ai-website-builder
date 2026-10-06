const TEMPLATE_ASSET_PREFIX = /^categories\/[^/]+\/template\d+\//i;

export const getPageRouteFromHref = (href: string) => {
  const route = href
    .trim()
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .split(/[?#]/, 1)[0]
    .replace(TEMPLATE_ASSET_PREFIX, "");

  return route;
};

export const getPageLabelFromHref = (href: string, fallback: string) => {
  const route = getPageRouteFromHref(href);

  if (!route) return "Home";

  const label = route
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/-/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
    )
    .join(" ");

  return label || fallback;
};

export const createPageSlug = (label: string) => {
  const fromHref = getPageRouteFromHref(label);
  const source = fromHref || label;

  return source.trim().toLowerCase().replace(/[/\s]+/g, "-");
};

export const getPageSlugCandidates = (label: string) => {
  const slug = createPageSlug(label);
  const lastSegment = slug.split("-").filter(Boolean).pop() ?? slug;
  const withoutUs = slug.endsWith("-us") ? slug.slice(0, -3) : "";

  const aliases: string[] = [];

  if (lastSegment === "faq" || slug === "faq") aliases.push("faqs");
  if (lastSegment === "faqs" || slug === "faqs") aliases.push("faq");
  if (slug === "career" || lastSegment === "career") aliases.push("careers");
  if (slug === "careers" || lastSegment === "careers") aliases.push("career");
  if (slug === "inquiry" || lastSegment === "inquiry") aliases.push("enquiry");
  if (slug.includes("industr")) aliases.push("industries");
  if (slug === "event" || lastSegment === "event") aliases.push("events");
  if (slug === "events" || lastSegment === "events") aliases.push("event");
  if (slug === "service" || lastSegment === "service") aliases.push("services");
  if (slug === "project" || lastSegment === "project") aliases.push("projects");
  if (slug === "blogs" || lastSegment === "blogs") aliases.push("blog");
  if (slug === "blog" || lastSegment === "blog") aliases.push("blogs");
  if (slug === "services-detail" || slug === "service-detail") {
    aliases.push("services-detail", "service-detail");
  }
  if (slug === "blog-detail" || slug === "blogs-detail") {
    aliases.push("blog-detail");
  }
  if (slug === "contact-us" || slug === "contact" || lastSegment === "contact") {
    aliases.push("contact", "contact-us");
  }
  if (
    slug === "quote" ||
    slug === "quotes" ||
    slug.includes("quote") ||
    lastSegment === "quote" ||
    lastSegment === "quotes"
  ) {
    aliases.push("quotes", "quote");
  }
  if (slug.includes("terms")) aliases.push("terms-conditions");
  if (slug.includes("privacy")) aliases.push("privacy-policy");
  if (slug.includes("refund")) aliases.push("refund-policy");
  if (slug.includes("cookie")) aliases.push("cookies-policy");
  if (slug.includes("disclaimer")) aliases.push("disclaimer");
  if (slug.includes("sitemap")) aliases.push("sitemap");

  // Keep "our-team" distinct from manager "teams" / "team".
  const candidates = [slug, withoutUs, ...aliases];
  if (slug !== "our-team") {
    candidates.push(lastSegment);
  }

  return Array.from(new Set(candidates.filter(Boolean)));
};

export const pageSlugsMatch = (left: string, right: string) => {
  const a = createPageSlug(left);
  const b = createPageSlug(right);
  if (!a || !b) return a === b;
  if (a === b) return true;
  const leftSet = new Set(getPageSlugCandidates(a));
  return getPageSlugCandidates(b).some((item) => leftSet.has(item));
};

export const scrollTemplateToTop = () => {
  const scrollContainer = document.querySelector<HTMLElement>(
    "[data-template-scroll]",
  );

  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};
