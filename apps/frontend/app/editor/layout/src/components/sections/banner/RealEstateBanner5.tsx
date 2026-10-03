"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import { getPageLabelFromHref, scrollTemplateToTop } from "../../../lib/previewNav";

export default function RealEstateBanner5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const bgImage = String(data.backgroundImage || data.bgImage || "/categories/realestate/template5/hero_worker.png");
  const pretitle = String(data.pretitle || data.tagline || "BUILDING SPACES. CREATING LIVES.");
  const title = String(data.title || "Home Renovation & Construction");
  const desc = String(data.desc || data.description || "");
  const primary = data.buttons?.[0];
  const primaryLabel = String(primary?.label || data.primaryBtnText || "Explore all services");
  const primaryHref = String(primary?.href || data.primaryBtnLink || "/services");
  const secondaryLabel = String(data.secondaryBtnText || "See our work");
  const rawHeight = Number(data.bannerHeight ?? 70);
  const bannerHeight = Number.isFinite(rawHeight)
    ? Math.min(100, Math.max(40, rawHeight))
    : 70;

  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>, href: string, label: string) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  return (
    <section
      className="relative flex items-center overflow-hidden bg-white py-10"
      style={{
        ...getAccentStyle(accent),
        height: `${bannerHeight}dvh`,
        minHeight: `${bannerHeight}dvh`,
      }}
      data-editor-fields="accentColor pretitle title desc backgroundImage bannerHeight buttons secondaryBtnText"
    >
      <img src={bgImage} alt="" className="absolute inset-0 z-[1] h-full w-full object-cover object-right" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-white via-white/85 to-transparent max-md:bg-white/90" />
      <div className="absolute bottom-0 left-0 z-[2] hidden h-[120px] w-[250px] bg-[radial-gradient(rgba(0,0,0,0.08)_2px,transparent_2px)] bg-[length:24px_24px] md:block" />
      <div className="absolute right-10 bottom-0 z-[2] hidden h-[140px] w-[240px] border-[1.5px] border-[var(--accent)] md:block">
        <div className="absolute -right-5 -bottom-5 h-full w-full border-[1.5px] border-[var(--accent)]" />
      </div>
      <div className="relative z-[3] mx-auto w-full max-w-[1320px] px-6">
        <div className="max-w-[600px] pr-5">
          <div className="mb-3 text-[0.8rem] font-bold tracking-wider text-[var(--accent)] uppercase">{pretitle}</div>
          <h1 className="mb-5 text-[3.2rem] leading-[1.15] font-bold text-[#161616]">{title}</h1>
          <p className="mb-10 max-w-[500px] text-[1.15rem] leading-relaxed text-[#444]">{desc}</p>
          <div className="flex flex-wrap items-center gap-8">
            <Link
              href={primaryHref}
              onClick={(event) => handleNavigate(event, primaryHref, primaryLabel)}
              className="inline-flex items-center rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-white hover:-translate-y-0.5"
            >
              {primaryLabel}
              <svg className="ml-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
            <button type="button" className="flex items-center gap-4 text-[1.05rem] font-bold text-[#161616]">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#161616]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </span>
              {secondaryLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
