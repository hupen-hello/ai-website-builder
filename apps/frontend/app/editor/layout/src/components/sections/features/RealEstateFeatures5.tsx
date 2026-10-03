"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import { getPageLabelFromHref, scrollTemplateToTop } from "../../../lib/previewNav";
import type { RealEstateHome5Stat } from "../../../types/realEstateHome5";

const defaultStats: RealEstateHome5Stat[] = [
  { value: "15+", label: "Years Experience" },
  { value: "95%", label: "Client Satisfaction" },
  { value: "520+", label: "Projects Completed" },
  { value: "35", label: "Expert Team Members" },
];

const StatIcons = [
  <svg key="1" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="10" height="20" /><rect x="14" y="10" width="6" height="12" /></svg>,
  <svg key="2" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 10.5L12 2l10 8.5" /><path d="M5 10.5V21h14V10.5" /></svg>,
  <svg key="3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0a2.12 2.12 0 0 1 0-3L12 9" /></svg>,
  <svg key="4" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
];

export default function RealEstateFeatures5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const href = String(data.learnMoreUrl || data.buttons?.[0]?.href || "/about");
  const label = String(data.learnMoreText || data.buttons?.[0]?.label || "LEARN MORE");
  const stats = (Array.isArray(data.stats) && data.stats.length
    ? data.stats
    : defaultStats) as RealEstateHome5Stat[];
  const image = String(data.sideImage || data.image || "/categories/realestate/template5/bathroom_reno.png");

  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  return (
    <section
      className="relative overflow-hidden py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor pretitle title desc learnMoreText learnMoreUrl sideImage stats"
    >
      <div className="absolute bottom-[60px] left-0 z-0 h-48 w-[72px] bg-[radial-gradient(rgba(0,0,0,0.08)_2px,transparent_2px)] bg-[length:24px_24px]" />
      <div className="relative mx-auto flex max-w-[1320px] flex-wrap items-center gap-10 px-6 max-md:flex-col">
        <div className="min-w-[300px] flex-1">
          <div className="mb-4 text-[0.9rem] font-semibold tracking-wide text-[var(--accent)] uppercase">
            {String(data.pretitle || data.tagline || "ABOUT US")}
          </div>
          <h2 className="mb-4 text-4xl font-bold">{String(data.title || "We Are")}</h2>
          <p className="mb-8 leading-8 text-[#666]">
            {String(data.desc || data.description || "")}
          </p>
          <Link href={href} onClick={handleNavigate} className="inline-flex items-center gap-6 text-[1.05rem] font-bold text-[#161616]">
            <span className="border-b-2 border-[#161616] pb-1">{label}</span>
            <span className="flex h-11 w-11 rotate-45 items-center justify-center bg-[var(--accent)]">
              <svg className="-rotate-45" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
            </span>
          </Link>
        </div>

        <div className="grid min-w-[280px] flex-[1.5] grid-cols-2">
          {stats.slice(0, 4).map((stat, index) => (
            <div
              key={`${stat.label}-${index}`}
              className={`flex items-center gap-3 p-4 ${index % 2 === 0 ? "border-r" : ""} ${index < 2 ? "border-b" : ""} border-[#eaeaea]`}
            >
              <span className="shrink-0 text-[var(--accent)]">{StatIcons[index]}</span>
              <div>
                <div className="text-[2.2rem] leading-none font-extrabold text-[#161616]">{stat.value}</div>
                <div className="text-[0.85rem] font-medium text-[#555]">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="min-w-[300px] flex-1">
          <img src={image} alt={String(data.sideImageTitle || "Interior")} className="w-full rounded-[10px]" />
        </div>
      </div>
    </section>
  );
}
