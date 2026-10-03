"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type StatItem = {
  value?: string;
  suffix?: string;
  symbol?: string;
  label?: string;
};

const defaultStats: StatItem[] = [
  { value: "4", suffix: "k", symbol: "+", label: "Projects Complete" },
  { value: "3.5", suffix: "k", symbol: "+", label: "Our Team Members" },
  { value: "2.5", suffix: "k", symbol: "+", label: "Clients Are Happy" },
  { value: "1", suffix: "k", symbol: "+", label: "Winning Awards" },
];

const statIcons = [
  <svg key="clip" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.5"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M9 14h6" /><path d="M9 10h6" /></svg>,
  <svg key="users" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  <svg key="star" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
  <svg key="medal" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="1.5"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>,
];

export default function RealEstateAboutAchievements5({
  data = {},
}: SectionProps) {
  const preview = useOptionalPreview();
  const achievementsTagline = String(
    data.achievementsTagline || "Our Company Achievements",
  );
  const achievementsTitle = String(
    data.achievementsTitle || "Industrial Strength,<br />Global Impact",
  );
  const ctaText = String(data.ctaText || "MAKE AN APPOINTMENT");
  const ctaUrl = String(data.ctaUrl || "/contact");
  const stats = (
    Array.isArray(data.stats) && data.stats.length ? data.stats : defaultStats
  ) as StatItem[];

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
      className="relative z-[1] bg-[#f9f9f9] py-[30px]"
      data-editor-section-label="achievements"
      data-editor-fields="achievementsTagline achievementsTitle ctaText ctaUrl stats accentColor"
    >
      <div className="mx-auto max-w-[1320px] px-6 max-md:px-5">
        <div className="relative flex overflow-hidden bg-white shadow-[0px_10px_40px_rgba(0,0,0,0.05)] max-md:flex-col">
          <div className="flex flex-[0_0_42%] flex-col justify-center bg-white px-10 py-20 pl-[60px] max-md:px-6 max-md:py-10">
            <span className="mb-5 inline-block py-1.5 text-[0.95rem] font-semibold text-[var(--accent)]">
              {achievementsTagline}
            </span>
            <h2
              className="mb-10 pr-5 text-[2.8rem] leading-tight font-extrabold text-[#161616] max-md:text-[2rem]"
              dangerouslySetInnerHTML={{ __html: achievementsTitle }}
            />
            <Link
              href={ctaUrl}
              onClick={(event) => handleNavigate(event, ctaUrl, ctaText)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[var(--accent)] py-2 pr-2 pl-6 text-base font-bold text-white no-underline transition hover:opacity-90 max-md:px-2.5 max-md:pl-2.5 max-md:text-[0.7rem]"
            >
              {ctaText}
              <span className="ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--accent)] max-md:ml-1.5 max-md:h-6 max-md:w-6">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="max-md:h-3 max-md:w-3">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </Link>
          </div>

          <div className="relative z-[1] flex-1 px-10 py-[60px] pl-20 max-md:px-4 max-md:py-6">
            <div className="grid h-full grid-cols-2 max-md:grid-cols-1">
              {stats.slice(0, 4).map((stat, index) => (
                <div
                  key={`${stat.label}-${index}`}
                  className={`flex items-center gap-5 p-5 max-md:flex-col max-md:gap-3 max-md:border-0 max-md:px-2 max-md:py-4 max-md:text-center ${
                    index % 2 === 0 ? "border-r border-[#eaeaea]" : ""
                  } ${index < 2 ? "border-b border-[#eaeaea]" : ""} ${
                    index === 1 || index === 3 ? "pl-10 max-md:pl-2" : ""
                  } ${index >= 2 ? "pt-10 max-md:pt-4" : ""}`}
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_5px_20px_rgba(0,0,0,0.08)] max-md:h-14 max-md:w-14">
                    {statIcons[index] ?? statIcons[0]}
                  </div>
                  <div>
                    <h3 className="m-0 text-[2.5rem] leading-none font-extrabold text-[#161616] max-md:text-[1.5rem]">
                      {stat.value}
                      {stat.suffix}
                      <span className="text-[var(--accent)]">{stat.symbol}</span>
                    </h3>
                    <p className="mt-2 mb-0 text-base text-[#666] max-md:mt-1 max-md:text-[0.85rem]">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
