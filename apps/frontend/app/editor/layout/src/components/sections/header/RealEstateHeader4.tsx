"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import type { SectionData, SectionProps } from "../../../types/section";
import {
  getBlock,
  getBlocksByType,
  resolveSectionBlocks,
} from "../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";

type MenuItem = NonNullable<SectionData["menu"]>[number];

const getPageLabelFromHref = (href: string, fallback: string) => {
  const route = href
    .trim()
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .split(/[?#]/, 1)[0];

  if (!route) return "Home";

  return route
    .split("/")
    .filter(Boolean)
    .pop()!
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase()) || fallback;
};

const scrollTemplateToTop = () => {
  const scrollContainer = document.querySelector<HTMLElement>(
    "[data-template-scroll]"
  );

  if (scrollContainer) {
    scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};

const navLinkClass = (active: boolean) =>
  [
    "hover:text-[#0a8296] transition-colors",
    active ? "text-[#0a8296] font-semibold" : "text-(--header-text)",
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
    label: string
  ) => void;
}) {
  return (
    <div className="relative group py-6">
      <button className={`flex items-center gap-1 ${navLinkClass(active)}`}>
        {item.label} <ChevronDown className="w-4 h-4" />
      </button>
      <div className="absolute top-full left-0 w-48 bg-white shadow-xl rounded-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col py-2">
        {item.children?.map((child) => (
          <Link
            key={`${child.label}-${child.href}`}
            href={child.href}
            className="px-4 py-2 hover:bg-gray-50 hover:text-[#0a8296] transition-colors"
            onClick={(event) => onNavigate(event, child.href, child.label)}
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function RealEstateHeader4({
  data = {},
  blocks,
}: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const logo = getBlock(resolvedBlocks, "logo");
  const menu = getBlock(resolvedBlocks, "menu");
  const buttons = getBlocksByType(resolvedBlocks, "button");
  const menuItems = menu?.items ?? data.menu ?? [];
  const cta = buttons[0];
  const preview = useOptionalPreview();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const headerSolidColor = data.headerBackgroundColor ?? "#ffffff";
  const headerGradientColor = data.headerGradientColor ?? "#0a8296";
  const headerBackground =
    data.headerBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${headerSolidColor}, ${headerGradientColor})`
      : headerSolidColor;
  const headerTextColor = data.headerTextColor ?? "#1f2937";
  const isSticky = (data.headerType ?? "sticky") === "sticky";

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const isActive = (item: MenuItem) => {
    if (!preview) return false;
    const currentPage = preview.currentPage.toLowerCase();

    return [item, ...(item.children ?? [])].some(
      (candidate) =>
        getPageLabelFromHref(candidate.href, candidate.label).toLowerCase() ===
        currentPage
    );
  };

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string
  ) => {
    if (!preview) return;

    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    closeMenu();
    scrollTemplateToTop();
  };

  return (
    <nav
      className={`border-b z-50 ${isSticky ? "sticky top-0" : "relative"}`}
      style={
        {
          background: headerBackground,
          "--header-text": headerTextColor,
        } as React.CSSProperties
      }
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between max-w-[1400px]">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            data-editor-no-inline
            onClick={(event) =>
              handleNavigate(event, logo?.href ?? "/", logo?.text ?? "Home")
            }
            className="flex items-center gap-2"
          >
            {data.logoImage ? (
              <Image
                src={data.logoImage}
                alt={data.logoImageTitle ?? logo?.text ?? "Logo"}
                width={150}
                height={48}
                unoptimized={
                  data.logoImage.startsWith("data:") ||
                  /^https?:\/\//.test(data.logoImage)
                }
                className="h-10 w-auto object-contain"
              />
            ) : (
              <>
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 rounded-full bg-[#0a8296]" />
                  <div className="w-2 h-6 rounded-full bg-[#0a8296]" />
                </div>
                <span className="font-bold text-2xl tracking-wider uppercase text-(--header-text)">
                  {logo?.text ?? data.logo ?? "SIMPLE"}
                </span>
              </>
            )}
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
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
            )
          )}
        </div>

        <div className="flex items-center gap-4">
          {cta && (
            <Link
              href={cta.href}
              onClick={(event) => handleNavigate(event, cta.href, cta.label)}
              className="hidden md:flex bg-[#0a8296] hover:bg-[#076473] text-white px-6 py-2.5 rounded-md font-medium transition-colors"
            >
              {cta.label}
            </Link>
          )}
          <button
            className="lg:hidden p-2 text-(--header-text) hover:text-[#0a8296] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden absolute top-20 left-0 w-full border-b shadow-2xl py-4 px-6 flex flex-col gap-4 max-h-[calc(100vh-5rem)] overflow-y-auto z-[1000]"
          style={{ background: headerBackground }}
        >
          {menuItems.map((item, index) => {
            const groupKey = `${item.label}-${index}`;
            const expanded = openDropdown === groupKey;

            if (!item.children?.length) {
              return (
                <Link
                  key={groupKey}
                  href={item.href}
                  className="text-(--header-text) font-medium text-lg py-2 border-b border-gray-50"
                  onClick={(event) => {
                    handleNavigate(event, item.href, item.label);
                  }}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={groupKey}>
                <button
                  className="flex items-center justify-between w-full text-(--header-text) font-medium text-lg py-2"
                  onClick={() => toggleDropdown(groupKey)}
                >
                  {item.label}{" "}
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expanded && (
                  <div className="flex flex-col gap-3 pl-4 py-2 border-l-2 border-gray-100 text-(--header-text) opacity-70">
                    {item.children.map((child) => (
                      <Link
                        key={`${child.label}-${child.href}`}
                        href={child.href}
                        onClick={(event) =>
                          handleNavigate(event, child.href, child.label)
                        }
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {cta && (
            <Link
              href={cta.href}
              className="mt-4 flex w-full bg-[#0a8296] hover:bg-[#076473] text-white h-12 items-center justify-center rounded-md font-medium transition-colors"
              onClick={(event) => handleNavigate(event, cta.href, cta.label)}
            >
              {cta.label}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
