"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type Crumb = { label?: string; url?: string; href?: string };

export default function RealEstateBreadCrumb5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const title = String(data.title || "About Us");
  const bg = String(
    data.backgroundImage ||
      data.bgImage ||
      "/categories/realestate/template5/office_reno.png",
  );
  const bgAlt = String(data.backgroundImageAlt || data.bgImageTitle || "");
  const crumbs = (
    Array.isArray(data.breadcrumbs) && data.breadcrumbs.length
      ? data.breadcrumbs
      : [
          { label: "Home", url: "/" },
          { label: title },
        ]
  ) as Crumb[];

  const lastLabel = String(crumbs[crumbs.length - 1]?.label || "").toLowerCase();
  const resolvedCrumbs =
    lastLabel === title.toLowerCase()
      ? crumbs
      : [...crumbs, { label: title }];

  const words = title.trim().split(/\s+/).filter(Boolean);

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  return (
    <section
      className="relative overflow-hidden border-b border-[#eaeaea] bg-[#f8f9fa] py-[70px] text-center"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor title backgroundImage breadcrumbs"
      data-editor-section-label="pageBanner"
    >
      <img
        src={bg}
        alt={bgAlt}
        aria-hidden={bgAlt ? undefined : true}
        className="absolute inset-0 z-[1] h-full w-full object-cover"
      />
      <div className="absolute inset-0 z-[2] bg-white/70" />
      <div className="relative z-[3] mx-auto flex w-full max-w-[1320px] flex-col items-center px-6 max-md:px-5">
        <h1 className="mb-6 text-[3.5rem] font-bold text-[#333] max-md:text-[2.4rem]">
          {words.map((word, index) =>
            index === words.length - 1 ? (
              <span key={`${word}-${index}`} className="text-[var(--accent)]">
                {word}
              </span>
            ) : (
              <span key={`${word}-${index}`}>{word} </span>
            ),
          )}
        </h1>
        <div className="flex items-center gap-2 text-[1.05rem] font-semibold">
          {resolvedCrumbs.map((crumb, index) => {
            const href = String(crumb.url || crumb.href || "");
            const label = String(crumb.label || "");
            return (
              <span key={`${label}-${index}`} className="contents">
                {index > 0 ? <span className="text-[#666]">»</span> : null}
                {href ? (
                  <Link
                    href={href}
                    onClick={(event) => handleNavigate(event, href, label)}
                    className="text-[#333] no-underline opacity-80 transition-colors hover:text-[var(--accent)]"
                  >
                    {label}
                  </Link>
                ) : (
                  <span className="text-[var(--accent)]">{label}</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
