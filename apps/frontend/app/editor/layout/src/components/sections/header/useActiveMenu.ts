"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { PageLink } from "../../context/PreviewContext";

type MenuEntry = {
  label: string;
  href: string;
  children?: MenuEntry[];
  menuType?: "link" | "dropdown" | "mega";
};

const normalizeLabel = (value: string) => value.trim().toLowerCase();

/** Treat Service/Services (and similar singular/plural nav aliases) as the same page. */
const labelsMatch = (left: string, right: string) => {
  const a = normalizeLabel(left);
  const b = normalizeLabel(right);
  if (a === b) return true;
  if (
    (a === "service" || a === "services") &&
    (b === "service" || b === "services")
  ) {
    return true;
  }
  if (
    (a === "event" || a === "events") &&
    (b === "event" || b === "events")
  ) {
    return true;
  }
  if (
    (a === "property" || a === "properties") &&
    (b === "property" || b === "properties")
  ) {
    return true;
  }
  if (
    (a === "portfolio" || a === "portfolios") &&
    (b === "portfolio" || b === "portfolios")
  ) {
    return true;
  }
  if (
    (a === "team" || a === "teams") &&
    (b === "team" || b === "teams")
  ) {
    return true;
  }
  return false;
};

const isRoutedContentHref = (href: string) => {
  const normalized = href.trim().toLowerCase();
  if (normalized.startsWith("#page-")) {
    return (
      normalized !== "#page-blogs" && !normalized.startsWith("#page-blog-")
    );
  }
  // /published/{site}/{slug} — not the site root
  return /^\/published\/[^/]+\/.+/i.test(normalized);
};

const findPreviewHref = (links: PageLink[], label: string): string => {
  const wanted = normalizeLabel(label);
  for (const link of links) {
    if (link.kind !== "blog" && normalizeLabel(link.label) === wanted) {
      return link.href;
    }
    const childHref = findPreviewHref(link.children ?? [], label);
    if (childHref) return childHref;
  }
  return "";
};

const findBlogIndexLabel = (links: PageLink[]): string => {
  for (const link of links) {
    if (link.kind === "blogIndex") return link.label;
    const childLabel = findBlogIndexLabel(link.children ?? []);
    if (childLabel) return childLabel;
  }
  return "";
};

export function useActiveMenu({
  items,
  currentPage,
  pageLinks,
}: {
  items: MenuEntry[];
  currentPage: string;
  pageLinks: PageLink[];
}) {
  // True multi-page sites use #page-* (editor) or /published/{site}/{slug} (live).
  const isMultiPage = pageLinks.some(
    (item) =>
      item.kind !== "blog" &&
      item.kind !== "blogIndex" &&
      item.kind !== "document" &&
      isRoutedContentHref(item.href),
  );
  const isDocumentPage = pageLinks.some(
    (item) =>
      item.kind === "document" &&
      normalizeLabel(item.label) === normalizeLabel(currentPage || ""),
  );
  const [activeLabel, setActiveLabel] = useState(currentPage || "Home");
  const pathname = usePathname() ?? "";
  const isBlogRoute = /\/(?:blogs|blog)(?:\/|$)/i.test(pathname);
  const isServiceDetailRoute =
    /\/service\//i.test(pathname) || /\/services\/.+/i.test(pathname);
  const isServicesListingRoute =
    /\/services\/?$/i.test(pathname) || /\/service\/?$/i.test(pathname);
  const isServicesRoute = isServiceDetailRoute || isServicesListingRoute;
  const isEventDetailRoute =
    /\/event\//i.test(pathname) || /\/events\/.+/i.test(pathname);
  const isEventsListingRoute =
    /\/events\/?$/i.test(pathname) || /\/event\/?$/i.test(pathname);
  const isEventsRoute = isEventDetailRoute || isEventsListingRoute;
  const isPropertyDetailRoute =
    /\/property\//i.test(pathname) || /\/properties\/.+/i.test(pathname);
  const isPropertiesListingRoute =
    /\/properties\/?$/i.test(pathname) || /\/property\/?$/i.test(pathname);
  const isPropertiesRoute = isPropertyDetailRoute || isPropertiesListingRoute;
  const isPortfolioDetailRoute = /\/portfolio\/.+/i.test(pathname);
  const isPortfolioListingRoute = /\/portfolio\/?$/i.test(pathname);
  const isPortfolioRoute = isPortfolioDetailRoute || isPortfolioListingRoute;
  const isTeamDetailRoute =
    /\/team\//i.test(pathname) || /\/teams\/.+/i.test(pathname);
  const isTeamsListingRoute =
    /\/teams\/?$/i.test(pathname) || /\/team\/?$/i.test(pathname);
  const isTeamsRoute = isTeamDetailRoute || isTeamsListingRoute;
  const isGalleryListingRoute = /\/gallery\/?$/i.test(pathname);
  const isGalleryRoute = isGalleryListingRoute;
  const isCountryDetailRoute =
    /\/country\//i.test(pathname) || /\/countries\/.+/i.test(pathname);
  const isCountryRoute = isCountryDetailRoute;
  const blogIndexLabel = useMemo(
    () => findBlogIndexLabel(pageLinks),
    [pageLinks],
  );
  const servicesLabel = useMemo(() => {
    const match = pageLinks
      .flatMap((link) => [link, ...(link.children || [])])
      .find((link) => {
        const href = link.href.trim().toLowerCase();
        const label = link.label.trim().toLowerCase();
        return (
          href === "#page-services" ||
          href === "#page-service" ||
          /\/services\/?$/i.test(href) ||
          /\/service\/?$/i.test(href) ||
          label === "services" ||
          label === "service"
        );
      });
    const menuMatch = items.find((item) =>
      labelsMatch(item.label, match?.label || "Services"),
    );
    return menuMatch?.label || match?.label || "Services";
  }, [items, pageLinks]);
  const eventsLabel = useMemo(() => {
    const match = pageLinks
      .flatMap((link) => [link, ...(link.children || [])])
      .find((link) => {
        const href = link.href.trim().toLowerCase();
        const label = link.label.trim().toLowerCase();
        return (
          href === "#page-events" ||
          href === "#page-event" ||
          /\/events\/?$/i.test(href) ||
          /\/event\/?$/i.test(href) ||
          label === "events" ||
          label === "event"
        );
      });
    const menuMatch = items.find((item) =>
      labelsMatch(item.label, match?.label || "Events"),
    );
    return menuMatch?.label || match?.label || "Events";
  }, [items, pageLinks]);
  const propertiesLabel = useMemo(() => {
    const match = pageLinks
      .flatMap((link) => [link, ...(link.children || [])])
      .find((link) => {
        const href = link.href.trim().toLowerCase();
        const label = link.label.trim().toLowerCase();
        return (
          href === "#page-properties" ||
          href === "#page-property" ||
          /\/properties\/?$/i.test(href) ||
          /\/property\/?$/i.test(href) ||
          label === "properties" ||
          label === "property"
        );
      });
    const menuMatch = items.find((item) =>
      labelsMatch(item.label, match?.label || "Properties"),
    );
    return menuMatch?.label || match?.label || "Properties";
  }, [items, pageLinks]);
  const portfolioLabel = useMemo(() => {
    const match = pageLinks
      .flatMap((link) => [link, ...(link.children || [])])
      .find((link) => {
        const href = link.href.trim().toLowerCase();
        const label = link.label.trim().toLowerCase();
        return (
          href === "#page-portfolio" ||
          href === "#page-portfolios" ||
          /\/portfolio\/?$/i.test(href) ||
          label === "portfolio" ||
          label === "portfolios"
        );
      });
    const menuMatch = items.find((item) =>
      labelsMatch(item.label, match?.label || "Portfolio"),
    );
    return menuMatch?.label || match?.label || "Portfolio";
  }, [items, pageLinks]);
  const teamsLabel = useMemo(() => {
    const match = pageLinks
      .flatMap((link) => [link, ...(link.children || [])])
      .find((link) => {
        const href = link.href.trim().toLowerCase();
        const label = link.label.trim().toLowerCase();
        return (
          href === "#page-teams" ||
          href === "#page-team" ||
          /\/teams\/?$/i.test(href) ||
          /\/team\/?$/i.test(href) ||
          label === "teams" ||
          label === "team"
        );
      });
    const menuMatch = items.find((item) =>
      labelsMatch(item.label, match?.label || "Teams"),
    );
    return menuMatch?.label || match?.label || "Teams";
  }, [items, pageLinks]);
  const galleryLabel = useMemo(() => {
    const match = pageLinks
      .flatMap((link) => [link, ...(link.children || [])])
      .find((link) => {
        const href = link.href.trim().toLowerCase();
        const label = link.label.trim().toLowerCase();
        return (
          href === "#page-gallery" ||
          /\/gallery\/?$/i.test(href) ||
          label === "gallery"
        );
      });
    const menuMatch = items.find((item) =>
      labelsMatch(item.label, match?.label || "Gallery"),
    );
    return menuMatch?.label || match?.label || "Gallery";
  }, [items, pageLinks]);

  /**
   * Published path helper — only for hard-loaded special routes
   * (blogs / blog detail / service detail / event detail / property detail).
   * Multi-page SPA navigation uses pushState, so Next usePathname() goes stale;
   * currentPage wins there.
   */
  const publishedSpecialActiveLabel = useMemo(() => {
    if (!/\/published\/[^/]+/i.test(pathname)) return null;

    const rest = pathname
      .replace(/^\/published\/[^/]+\/?/i, "")
      .replace(/\/+$/g, "");

    // Base /published/{site} — leave null so single-page scroll-spy can work.
    if (!rest) return null;

    if (/^blogs?(?:\/|$)/i.test(rest)) {
      return (
        items.find((item) => /blog/i.test(normalizeLabel(item.label)))?.label ||
        blogIndexLabel ||
        "Blog"
      );
    }

    if (/^service\//i.test(rest) || /^services\/.+/i.test(rest)) {
      return servicesLabel;
    }

    if (/^services?$/i.test(rest)) {
      return servicesLabel;
    }

    if (/^event\//i.test(rest) || /^events\/.+/i.test(rest)) {
      return eventsLabel;
    }

    if (/^events?$/i.test(rest)) {
      return eventsLabel;
    }

    if (/^property\//i.test(rest) || /^properties\/.+/i.test(rest)) {
      return propertiesLabel;
    }

    if (/^propert(?:y|ies)$/i.test(rest)) {
      return propertiesLabel;
    }

    if (/^portfolio(?:\/|$)/i.test(rest)) {
      return portfolioLabel;
    }

    if (/^team\//i.test(rest) || /^teams\/.+/i.test(rest)) {
      return teamsLabel;
    }

    if (/^teams?$/i.test(rest)) {
      return teamsLabel;
    }

    if (/^gallery$/i.test(rest)) {
      return galleryLabel;
    }

    // Country listing detail — no nav item should look active (not Home).
    if (/^country\//i.test(rest) || /^countries\/.+/i.test(rest)) {
      return "__country_detail__";
    }

    return null;
  }, [
    blogIndexLabel,
    eventsLabel,
    galleryLabel,
    items,
    pathname,
    portfolioLabel,
    propertiesLabel,
    servicesLabel,
    teamsLabel,
  ]);

  const lockToCurrentPage = isMultiPage || isDocumentPage;

  // Priority: special published routes → multi-page currentPage → scroll spy
  const resolvedActiveLabel =
    publishedSpecialActiveLabel ||
    (isBlogRoute
      ? blogIndexLabel || "Blogs"
      : isServicesRoute
        ? servicesLabel
        : isEventsRoute
          ? eventsLabel
          : isPropertiesRoute
            ? propertiesLabel
            : isPortfolioRoute
              ? portfolioLabel
              : isTeamsRoute
                ? teamsLabel
                : isGalleryRoute
                  ? galleryLabel
                  : isCountryRoute
                    ? "__country_detail__"
            : lockToCurrentPage
              ? currentPage || "Home"
              : activeLabel);

  // Keep menu label in sync when multi-page currentPage changes (pushState).
  useEffect(() => {
    if (!lockToCurrentPage || publishedSpecialActiveLabel) return;
    const next = currentPage || "Home";
    setActiveLabel((previous) =>
      normalizeLabel(previous) === normalizeLabel(next) ? previous : next,
    );
  }, [currentPage, lockToCurrentPage, publishedSpecialActiveLabel]);

  const scrollItems = useMemo(
    () =>
      items
        .map((item) => ({
          label: item.label,
          href: findPreviewHref(pageLinks, item.label) || item.href,
        }))
        // Single-page scroll spy only: keep section hashes, skip routed pages.
        .filter((item) => {
          const href = item.href.trim().toLowerCase();
          if (!href || href === "#") return true;
          if (href.startsWith("#page-")) return false;
          if (href.startsWith("/published/")) return false;
          return href.startsWith("#");
        }),
    [items, pageLinks],
  );

  useEffect(() => {
    if (
      publishedSpecialActiveLabel ||
      isBlogRoute ||
      isServicesRoute ||
      isPortfolioRoute ||
      isCountryRoute ||
      lockToCurrentPage ||
      !scrollItems.length
    ) {
      return;
    }

    const scrollContainer = document.querySelector<HTMLElement>(
      "[data-template-scroll]",
    );
    let frame = 0;

    const homeLabel =
      scrollItems.find((item) => {
        const href = item.href.trim();
        return !href || href === "#" || normalizeLabel(item.label) === "home";
      })?.label || "Home";

    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const containerTop = scrollContainer?.getBoundingClientRect().top ?? 0;
        const activationLine = containerTop + 150;
        let nextLabel = homeLabel;
        let closestSectionTop = Number.NEGATIVE_INFINITY;

        for (const item of scrollItems) {
          const normalizedHref = item.href.trim();
          if (!normalizedHref.startsWith("#") || normalizedHref === "#") {
            continue;
          }

          const id = decodeURIComponent(normalizedHref.slice(1));
          const target =
            document.getElementById(id) ||
            document.querySelector<HTMLElement>(`[data-section-id="${id}"]`);
          if (target) {
            const sectionTop = target.getBoundingClientRect().top;
            if (
              sectionTop <= activationLine &&
              sectionTop > closestSectionTop
            ) {
              closestSectionTop = sectionTop;
              nextLabel = item.label;
            }
          }
        }

        setActiveLabel((previous) =>
          normalizeLabel(previous) === normalizeLabel(nextLabel)
            ? previous
            : nextLabel,
        );
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    scrollContainer?.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      scrollContainer?.removeEventListener("scroll", updateActiveSection);
    };
  }, [
    isBlogRoute,
    isServicesRoute,
    isPortfolioRoute,
    isCountryRoute,
    lockToCurrentPage,
    publishedSpecialActiveLabel,
    scrollItems,
  ]);

  useEffect(() => {
    if (
      publishedSpecialActiveLabel ||
      lockToCurrentPage ||
      isBlogRoute ||
      isServicesRoute ||
      isPortfolioRoute ||
      isCountryRoute
    ) {
      return;
    }
    if (normalizeLabel(currentPage || "Home") === "home") {
      setActiveLabel((previous) =>
        normalizeLabel(previous) === "home" ? previous : "Home",
      );
    }
  }, [
    currentPage,
    isBlogRoute,
    isServicesRoute,
    isPortfolioRoute,
    isCountryRoute,
    lockToCurrentPage,
    publishedSpecialActiveLabel,
  ]);

  const isActive = (item: MenuEntry) => {
    return (
      labelsMatch(item.label, resolvedActiveLabel) ||
      item.children?.some((child) =>
        labelsMatch(child.label, resolvedActiveLabel),
      ) === true
    );
  };

  return { activeLabel: resolvedActiveLabel, isActive, setActiveLabel };
}
