"use client";

import { useState } from "react";
import Link from "next/link";
import type { SectionData, SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import { getPageLabelFromHref, scrollTemplateToTop } from "../../../lib/previewNav";

type MenuItem = NonNullable<SectionData["menu"]>[number];
type ServiceNav = { label?: string; href?: string; url?: string; icon?: string };

const ACCENT = "#ff6b00";

const IconMap: Record<string, React.ReactNode> = {
  kitchen: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" /><path d="M4 19h16" /><path d="M12 9v6" /><path d="M9 12h6" /></svg>
  ),
  bathroom: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18" /><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
  ),
  outdoors: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16" /><path d="M12 12c-2 0-4-2-4-4s2-4 4-4 4 2 4 4-2 4-4 4z" /></svg>
  ),
  balcony: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="14" width="18" height="8" rx="2" /><path d="M6 14V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8" /></svg>
  ),
  "home-office": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>
  ),
};

export default function RealEstateHeader5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Support both "navigation" (new JSON) and "menu" (old JSON).
  // Prefer navigation when present so editor menu sync cannot wipe live nav.
  const menuItems = (
    Array.isArray(data.navigation) && data.navigation.length
      ? data.navigation
      : Array.isArray(data.menu)
        ? data.menu
        : []
  ) as Array<Record<string, any>>;
  const servicesNav = (Array.isArray(data.servicesNav) ? data.servicesNav : []) as ServiceNav[];
  
  const phone = String(data.contactPhone || "(555) 555-5555");
  const logoImage = String(data.logoImage || data.logo || "");
  const logoAlt = String(data.logoImageTitle || data.logoAlt || "Logo");
  const accent = String(data.accentColor || ACCENT);
  
  const ctaText = String(
    (Array.isArray(data.buttons) && data.buttons[0]?.label) ||
      (typeof data.ctaText === "string" && data.ctaText) ||
      "Get a Quote",
  );
  const ctaUrl = String(
    (Array.isArray(data.buttons) && data.buttons[0]?.href) ||
      (typeof data.ctaUrl === "string" && data.ctaUrl) ||
      "/quote",
  );

  const resolveHref = (candidate: any) =>
    String(candidate?.url || candidate?.href || "").trim();

  const isPlaceholderHref = (href: string) =>
    !href || href === "#" || href === "/#";

  const isActive = (item: any) => {
    if (!preview) return false;
    const currentPage = preview.currentPage.toLowerCase();
    const children = item.dropdownItems || item.children || [];

    // Dropdown parents with "#" must not match Home — only real routes count.
    const candidates = [item, ...children].filter(
      (candidate) => !isPlaceholderHref(resolveHref(candidate)),
    );

    return candidates.some(
      (candidate) =>
        getPageLabelFromHref(resolveHref(candidate), candidate.label).toLowerCase() ===
        currentPage,
    );
  };

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    if (isPlaceholderHref(href)) {
      event.preventDefault();
      return;
    }
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    setMobileOpen(false);
    scrollTemplateToTop();
  };

  return (
    <header
      className="sticky top-0 z-[100] w-full"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor logoImage logoImageTitle contactPhone menu navigation servicesNav ctaText ctaUrl buttons"
    >
      <div className="border-b border-[#eaeaea] bg-white">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center"
            onClick={(event) => handleNavigate(event, "/", "Home")}
          >
            {logoImage.startsWith("/") || logoImage.startsWith("http") ? (
              <img src={logoImage} alt={logoAlt} className="h-[60px] w-auto object-contain" />
            ) : (
              <span className="text-xl font-bold">{String(data.logoText || data.logo || "Daniel Aureon")}</span>
            )}
          </Link>

          <nav className="hidden gap-10 md:flex">
            {menuItems.map((item: any, i: number) => {
              const url = item.url || item.href || "#";
              const hasDropdown = item.dropdown || (item.children && item.children.length > 0) || (item.dropdownItems && item.dropdownItems.length > 0);
              const children = item.dropdownItems || item.children || [];
              
              return (
                <div key={i} className="group relative flex items-center h-full">
                  <Link
                    href={url}
                    onClick={(event) => handleNavigate(event, url, item.label)}
                    className={`flex items-center gap-1 text-[0.9rem] font-semibold uppercase tracking-wide transition-colors duration-200 ${isActive(item) ? "text-[var(--accent)]" : "text-[#333]"} group-hover:text-[var(--accent)]`}
                  >
                    {item.label}
                    {hasDropdown && (
                      <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    )}
                  </Link>
                  {hasDropdown && (
                    <div className="absolute top-full left-0 min-w-[240px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.1)] border-t-2 border-[var(--accent)] opacity-0 invisible translate-y-2.5 transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-[100]">
                      <div className="flex flex-col py-2.5">
                        {children.map((child: any, j: number) => {
                          const childUrl = child.url || child.href || "#";
                          return (
                            <Link 
                              key={j} 
                              href={childUrl} 
                              onClick={(event) => handleNavigate(event, childUrl, child.label)}
                              className="px-5 py-3 text-[0.9rem] font-medium text-[#333] hover:text-[var(--accent)] hover:bg-[#f9f9f9] transition-all duration-200"
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <Link 
            href={ctaUrl} 
            onClick={(event) => handleNavigate(event, ctaUrl, ctaText)}
            className="hidden items-center justify-center px-7 py-3 bg-[var(--accent)] text-white text-[0.9rem] font-semibold uppercase tracking-wider rounded transition-opacity duration-300 hover:opacity-90 md:flex"
          >
            {ctaText}
          </Link>

          <button className="p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="absolute left-0 top-full z-[1000] w-full border-t border-[#eaeaea] bg-white px-6 py-4 shadow-[0_10px_20px_rgba(0,0,0,0.05)] md:hidden">
            <nav className="flex flex-col gap-4">
              {menuItems.map((item: any, i: number) => {
                const url = item.url || item.href || "#";
                const hasDropdown = item.dropdown || (item.children && item.children.length > 0) || (item.dropdownItems && item.dropdownItems.length > 0);
                const children = item.dropdownItems || item.children || [];
                
                return (
                  <div key={i} className="flex flex-col gap-2.5">
                    {hasDropdown ? (
                      <details className="group">
                        <summary className={`flex justify-between items-center list-none cursor-pointer text-[0.95rem] font-semibold uppercase tracking-wide ${isActive(item) ? "text-[var(--accent)]" : "text-[#333]"}`}>
                          {item.label}
                          <svg className="w-[18px] h-[18px] transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </summary>
                        <div className="flex flex-col gap-3 pt-4 pb-1 pl-4 border-l-2 border-[#eaeaea] mt-3 ml-2">
                          {children.map((child: any, j: number) => {
                            const childUrl = child.url || child.href || "#";
                            return (
                              <Link 
                                key={j} 
                                href={childUrl} 
                                onClick={(event) => handleNavigate(event, childUrl, child.label)} 
                                className="text-[0.95rem] font-medium text-[#666] active:text-[var(--accent)]"
                              >
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </details>
                    ) : (
                      <Link 
                        href={url} 
                        onClick={(event) => handleNavigate(event, url, item.label)} 
                        className={`text-[0.95rem] font-semibold uppercase tracking-wide ${isActive(item) ? "text-[var(--accent)]" : "text-[#333]"}`}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                );
              })}
              <Link 
                href={ctaUrl} 
                onClick={(event) => handleNavigate(event, ctaUrl, ctaText)} 
                className="mt-3 flex items-center justify-center px-6 py-3.5 bg-[var(--accent)] text-white font-semibold uppercase tracking-wider rounded text-center transition-opacity hover:opacity-90"
              >
                {ctaText}
              </Link>
            </nav>
          </div>
        )}
      </div>

      {servicesNav.length > 0 && (
        <div className="hidden bg-[#161616] py-3 md:block">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6">
            {servicesNav.map((item) => {
              const href = String(item.href || item.url || "/");
              const label = String(item.label || "");
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={(event) => handleNavigate(event, href, label)}
                  className="flex items-center gap-3 text-[0.9rem] font-bold uppercase tracking-wider text-white hover:opacity-70"
                >
                  <span>{IconMap[String(item.icon || "")] ?? IconMap.kitchen}</span>
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
