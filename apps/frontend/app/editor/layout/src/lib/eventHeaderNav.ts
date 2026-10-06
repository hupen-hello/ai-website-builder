import { navigateEditorMasterDetailHref, scrollTemplateToTop } from "./sectionScroll";

export type EventNavLink = {
  label: string;
  href: string;
  subLinks?: { label: string; href: string }[];
};

export const DEFAULT_EVENT_NAV: EventNavLink[] = [
  { label: "HOME", href: "/" },
  {
    label: "ABOUT US",
    href: "/about-us",
    subLinks: [
      { label: "About Us", href: "/about-us" },
      { label: "Mission", href: "/mission" },
      { label: "Vision", href: "/vision" },
      { label: "Our Story", href: "/our-story" },
      { label: "Awards & Achievements", href: "/awards" },
      { label: "Our Team", href: "/our-team" },
      { label: "Why Choose Us", href: "/why-choose-us" },
    ],
  },
  {
    label: "SERVICES",
    href: "/services",
    subLinks: [
      { label: "Services", href: "/services" },
      { label: "Services Detail", href: "/services-detail" },
    ],
  },
  {
    label: "EVENTS",
    href: "/event",
  },
  {
    label: "PAGES",
    href: "#",
    subLinks: [
      { label: "Gallery", href: "/gallery" },
      { label: "Testimonials", href: "/testimonials" },
      { label: "Partners", href: "/partners" },
      { label: "FAQs", href: "/faqs" },
      { label: "Career", href: "/career" },
      { label: "Career Detail", href: "/career-detail" },
      { label: "Get a Quote", href: "/get-a-quote" },
      { label: "Terms & Conditions", href: "/terms-conditions" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Refund / Cancellation", href: "/refund-cancellation" },
      { label: "Cookies Policy", href: "/cookies-policy" },
      { label: "404 Page", href: "/404" },
      { label: "Sitemap", href: "/sitemap" },
    ],
  },
  { label: "BLOG", href: "/blog" },
  { label: "CONTACT", href: "/contact" },
];

type MenuLike = {
  label?: string;
  href?: string;
  children?: MenuLike[];
  subLinks?: { label?: string; href?: string }[];
};

const hasDropdowns = (links: EventNavLink[]) =>
  links.some((link) => Array.isArray(link.subLinks) && link.subLinks.length > 0);

export const menuToEventNav = (menu: MenuLike[]): EventNavLink[] =>
  menu.map((item) => ({
    label: item.label ?? "",
    href: item.href ?? "#",
    subLinks: (item.children ?? item.subLinks ?? []).map((child) => ({
      label: child.label ?? "",
      href: child.href ?? "#",
    })),
  }));

const isDroppedEventNavHref = (href: string, label: string) => {
  const key = `${href} ${label}`.toLowerCase();
  return (
    key.includes("team-detail") ||
    key.includes("blog-detail") ||
    /\/blog\/\d+/.test(href)
  );
};

const DROPDOWN_NAV_LABELS = new Set([
  "about us",
  "about",
  "services",
  "service",
  "pages",
  "page",
]);

const keepsEventDropdown = (label: string) =>
  DROPDOWN_NAV_LABELS.has(label.trim().toLowerCase());

const stripDroppedEventNav = (links: EventNavLink[]): EventNavLink[] =>
  links.map((link) => {
    const subLinks = (link.subLinks || []).filter(
      (child) => !isDroppedEventNavHref(child.href, child.label),
    );
    return {
      ...link,
      subLinks:
        keepsEventDropdown(link.label) && subLinks.length ? subLinks : undefined,
    };
  });

export const resolveEventHeaderNav = (data: {
  navLinks?: unknown;
  menu?: unknown;
}): EventNavLink[] => {
  const fromNav = Array.isArray(data.navLinks)
    ? menuToEventNav(data.navLinks as MenuLike[])
    : [];
  const fromMenu = Array.isArray(data.menu)
    ? menuToEventNav(data.menu as MenuLike[])
    : [];

  if (hasDropdowns(fromNav)) return stripDroppedEventNav(fromNav);
  if (hasDropdowns(fromMenu)) return stripDroppedEventNav(fromMenu);
  if (fromNav.length && fromNav.length <= 8) return stripDroppedEventNav(fromNav);
  if (fromMenu.length && fromMenu.length <= 8) {
    return stripDroppedEventNav(fromMenu);
  }
  return DEFAULT_EVENT_NAV;
};

export const eventHrefToEditorTarget = (href: string, label = "") => {
  const trimmed = (href || "").trim();
  const lower = trimmed.toLowerCase();
  const labelLower = label.trim().toLowerCase();

  if (labelLower === "home" || lower === "/" || lower === "#" || !trimmed) {
    return { kind: "home" as const, href: "#" };
  }
  if (lower.startsWith("#master-detail/") || lower.startsWith("#page-blog-")) {
    return { kind: "special" as const, href: trimmed };
  }
  if (lower.startsWith("/team/") || lower.startsWith("/teams/")) {
    const slug = trimmed.split("/").filter(Boolean).pop() || "";
    return {
      kind: "special" as const,
      href: `#master-detail/team/${encodeURIComponent(slug)}`,
    };
  }
  if (/^\/blogs?\/.+/.test(lower)) {
    const slug = trimmed.split("/").filter(Boolean).pop() || "";
    return { kind: "special" as const, href: `#page-blog-${slug}` };
  }
  if (lower.startsWith("#page-")) {
    return { kind: "page" as const, href: trimmed };
  }
  const route = trimmed.replace(/^#/, "").replace(/^\/+/, "").split(/[?#]/)[0];
  if (!route) return { kind: "home" as const, href: "#" };
  return { kind: "page" as const, href: `#page-${route}` };
};

export const tryOpenEventListingHref = (
  href: string,
  preview?: {
    pageLinks: Array<{ kind?: string; href?: string; label?: string }>;
    setCurrentPage: (label: string) => void;
  },
) => {
  const target = eventHrefToEditorTarget(href);
  if (target.kind !== "special") return false;
  if (navigateEditorMasterDetailHref(target.href)) return true;
  const trimmed = target.href.trim().toLowerCase();
  if (preview && trimmed.startsWith("#page-blog-")) {
    const blogPage = preview.pageLinks.find(
      (item) =>
        item.kind === "blog" &&
        (item.href || "").trim().toLowerCase() === trimmed,
    );
    preview.setCurrentPage(blogPage?.label || href);
    scrollTemplateToTop();
    return true;
  }
  return false;
};
