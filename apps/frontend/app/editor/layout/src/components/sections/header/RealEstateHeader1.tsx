"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBars, FaChevronDown, FaTimes } from "react-icons/fa";
import type { SectionData, SectionProps } from "../../../types/section";
import {
  getBlock,
  getBlocksByType,
  resolveSectionBlocks,
} from "../types/section";
import EditorRemoteImage from "../../EditorRemoteImage";
import { useOptionalPreview } from "../../context/PreviewContext";
import {
  getPublishedSiteBasePath,
  getRoutedPageSlugFromHref,
  isPublishedSpecialContentRoute,
  navigatePublishedPageHref,
} from "../../../lib/sectionScroll";
import {
  THEME_HEADER_BG,
  THEME_HEADER_TEXT,
  resolveThemeColor,
} from "../../../lib/themeTokens";
import { filterMenuByHiddenPageLinks } from "../../../lib/navVisibility";

type MenuItem = NonNullable<SectionData["menu"]>[number];

const isSitemapNavItem = (item: { label?: string; href?: string }) => {
  const label = (item.label || "").trim().toLowerCase();
  const href = (item.href || "").trim().toLowerCase().replace(/\/+$/, "");
  return (
    label === "sitemap" ||
    href === "/sitemap" ||
    href.endsWith("/sitemap") ||
    href === "#page-sitemap"
  );
};

const withoutSitemapNav = (items: MenuItem[]): MenuItem[] =>
  items.flatMap((item) => {
    if (isSitemapNavItem(item)) return [];
    const children = item.children?.filter((child) => !isSitemapNavItem(child));
    return [{ ...item, children }];
  });

const scrollTemplateToTop = () => {
  const scrollContainer = document.querySelector<HTMLElement>(
    "[data-template-scroll]",
  );

  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const navLinkClass = (active: boolean) =>
  [
    "inline-flex items-center gap-1.5 border-b-2 pb-0.5 text-current transition",
    active
      ? "border-current font-semibold"
      : "border-transparent opacity-75 hover:border-current hover:opacity-100",
  ].join(" ");

function NavDropdown({
  item,
  active,
  onNavigate,
}: {
  item: MenuItem;
  active: boolean;
  onNavigate: (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (dropdownRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest("[data-editor-link-nav-overlay]")
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="group/nav relative z-[1] hover:z-[90]"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={(event) => {
        const next = event.relatedTarget;
        if (
          next instanceof Element &&
          next.closest("[data-editor-link-nav-overlay]")
        ) {
          return;
        }
        setOpen(false);
      }}
    >
      <Link
        href={item.href}
        aria-expanded={open}
        aria-haspopup="true"
        aria-current={active ? "page" : undefined}
        onClick={(event) => onNavigate(event, item.href, item.label)}
        className={navLinkClass(active)}
      >
        {item.label}
        <FaChevronDown
          className={`text-[0.55rem] transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </Link>

      <div
        className={`absolute left-0 top-full z-[1000] min-w-[13.5rem] pt-3 lg:left-1/2 lg:-translate-x-1/2 ${
          open
            ? "visible opacity-100"
            : "invisible opacity-0 lg:group-hover/nav:visible lg:group-hover/nav:opacity-100"
        }`}
      >
        <div className="max-h-[70vh] overflow-y-auto border border-[#141414]/10 bg-white py-2 shadow-[0_16px_40px_rgba(20,20,20,0.1)]">
          {item.children?.map((child) => (
            <Link
              key={`${child.label}-${child.href}`}
              href={child.href}
              className="block whitespace-nowrap px-4 py-2.5 text-sm text-[#141414] transition hover:bg-[#141414] hover:text-white"
              onClick={(event) => {
                onNavigate(event, child.href, child.label);
                setOpen(false);
              }}
            >
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RealEstateHeader1({
  data = {},
  blocks,
}: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const logo = getBlock(resolvedBlocks, "logo");
  const menu = getBlock(resolvedBlocks, "menu");
  const buttons = getBlocksByType(resolvedBlocks, "button");
  const preview = useOptionalPreview();
  const menuItems = filterMenuByHiddenPageLinks(
    withoutSitemapNav(menu?.items ?? data.menu ?? []),
    preview?.pageLinks,
  );
  const headerSolidColor = resolveThemeColor(
    data.headerBackgroundColor,
    THEME_HEADER_BG,
  );
  const headerGradientColor = data.headerGradientColor ?? "#0668ff";
  const headerBackground =
    data.headerBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${headerSolidColor}, ${headerGradientColor})`
      : headerSolidColor;
  const headerTextColor = resolveThemeColor(
    data.headerTextColor,
    THEME_HEADER_TEXT,
  );
  const [open, setOpen] = useState(false);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);

  const isActive = (item: MenuItem) => {
    if (!preview) return false;
    const currentPage = preview.currentPage.trim().toLowerCase();
    return [item, ...(item.children ?? [])].some(
      (candidate) => candidate.label.trim().toLowerCase() === currentPage,
    );
  };

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    const trimmedHref = href.trim();
    // tel/mailto/external — let the browser handle (do not preventDefault).
    if (
      /^(tel:|mailto:|sms:)/i.test(trimmedHref) ||
      /^https?:\/\//i.test(trimmedHref)
    ) {
      setOpen(false);
      return;
    }
    event.preventDefault();
    // Placeholder nav (redesign): show label only — do not open a page yet.
    if (/^javascript:/i.test(trimmedHref)) {
      setOpen(false);
      return;
    }
    const publishedBase = getPublishedSiteBasePath();
    const isHome =
      label.trim().toLowerCase() === "home" ||
      !trimmedHref ||
      trimmedHref === "#" ||
      trimmedHref === "/" ||
      (Boolean(publishedBase) &&
        trimmedHref.replace(/\/+$/, "") === publishedBase);

    if (isHome) {
      if (
        publishedBase &&
        window.location.pathname.replace(/\/+$/, "") !== publishedBase &&
        (isPublishedSpecialContentRoute() || !preview)
      ) {
        window.location.assign(publishedBase);
        return;
      }
      preview?.setCurrentPage("Home");
      setOpen(false);
      scrollTemplateToTop();
      return;
    }

    // Published public URLs: navigate by href (CTA labels like "Book Visit" ≠ page names).
    if (navigatePublishedPageHref(href)) {
      setOpen(false);
      return;
    }

    const isRoutedPageHref = Boolean(getRoutedPageSlugFromHref(href));
    if (
      isRoutedPageHref &&
      preview &&
      !isPublishedSpecialContentRoute()
    ) {
      preview.setCurrentPage(label || "Home");
      setOpen(false);
      scrollTemplateToTop();
      return;
    }

    preview?.setCurrentPage(label || "Home");
    setOpen(false);
    scrollTemplateToTop();
  };

  return (
    <header
      className="relative z-[70] w-full border-b border-black/10"
      style={{ background: headerBackground, color: headerTextColor }}
    >
      <div className="mx-auto grid min-h-16 max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:gap-4 md:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-10">
        <Link
          href="/"
          onClick={(event) =>
            handleNavigate(event, logo?.href ?? "/", "Home")
          }
          className="relative flex min-w-0 items-center gap-3 text-current"
        >
          {data.logoImage ? (
            <EditorRemoteImage
              src={data.logoImage}
              alt={data.logoImageTitle ?? logo?.text ?? "Logo"}
              data-editor-media
              data-editor-media-type="image"
              data-editor-media-src={data.logoImage}
              width={150}
              height={48}
              unoptimized={
                data.logoImage.startsWith("data:") ||
                /^https?:\/\//.test(data.logoImage)
              }
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span
              className="truncate text-sm font-bold tracking-[0.12em] sm:text-base md:text-[1.05rem]"
              data-editor-inline-format-key="header:logo"
            >
              {(logo?.text ?? data.logo ?? "Haus Group").toUpperCase()}
            </span>
          )}
        </Link>

        <nav className="hidden items-center justify-center gap-6 text-[0.92rem] font-medium lg:flex xl:gap-7">
          {menuItems.map((item, index) =>
            item.children?.length ? (
              <NavDropdown
                key={`${item.label}-${index}`}
                item={item}
                active={isActive(item)}
                onNavigate={handleNavigate}
              />
            ) : (
              <Link
                key={`${item.label}-${index}`}
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={navLinkClass(isActive(item))}
                onClick={(event) =>
                  handleNavigate(event, item.href, item.label)
                }
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center justify-end gap-2">
          {buttons.map((button) => (
            <Link
              key={button.id}
              href={button.href}
              onClick={(event) =>
                handleNavigate(event, button.href, button.label)
              }
              className={[
                "hidden rounded-full px-5 py-2.5 text-sm font-semibold transition lg:inline-flex",
                button.variant === "secondary"
                  ? "border border-current bg-transparent text-current hover:bg-black/5"
                  : "theme-btn hover:opacity-90",
              ].join(" ")}
            >
              {button.label}
            </Link>
          ))}

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            className="rounded-md p-2 text-current lg:hidden"
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      <div
        data-export-mobile-nav="true"
        className={`absolute inset-x-0 top-full z-[1000] max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-black/10 px-4 py-4 shadow-lg md:px-8 lg:hidden ${
          open ? "" : "hidden"
        }`}
        style={{ background: headerBackground, color: headerTextColor }}
      >
          <nav className="flex flex-col gap-1 text-sm font-medium text-current">
            {menuItems.map((item, index) => {
              const groupKey = `${item.label}-${index}`;
              const expanded = mobileGroup === groupKey;

              if (!item.children?.length) {
                return (
                  <Link
                    key={groupKey}
                    href={item.href}
                    className="border-b border-[#141414]/10 py-2.5"
                    onClick={(event) =>
                      handleNavigate(event, item.href, item.label)
                    }
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={groupKey} className="border-b border-[#141414]/10">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-2.5 text-left"
                    aria-expanded={expanded}
                    data-export-mobile-group={groupKey}
                    onClick={() =>
                      setMobileGroup(expanded ? null : groupKey)
                    }
                  >
                    {item.label}
                    <FaChevronDown
                      className={`text-[0.6rem] transition ${expanded ? "rotate-180" : ""
                        }`}
                      aria-hidden
                    />
                  </button>

                  <div
                    className={`flex flex-col gap-1 pb-3 pl-3 ${
                      expanded ? "" : "hidden"
                    }`}
                  >
                      {item.children.map((child) => (
                        <Link
                          key={`${child.label}-${child.href}`}
                          href={child.href}
                          className="py-2 text-current opacity-70 hover:opacity-100"
                          onClick={(event) =>
                            handleNavigate(event, child.href, child.label)
                          }
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                </div>
              );
            })}

            {buttons.map((button) => (
              <Link
                key={button.id}
                href={button.href}
                className={[
                  "mt-3 inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold",
                  button.variant === "secondary"
                    ? "border border-current bg-transparent text-current"
                    : "bg-[#141414] text-white",
                ].join(" ")}
                onClick={(event) =>
                  handleNavigate(event, button.href, button.label)
                }
              >
                {button.label}
              </Link>
            ))}
          </nav>
        </div>
    </header>
  );
}
