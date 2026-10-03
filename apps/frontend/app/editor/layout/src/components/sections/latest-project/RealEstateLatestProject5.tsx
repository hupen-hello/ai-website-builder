"use client";

import { useState } from "react";
import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import { getPageLabelFromHref, scrollTemplateToTop } from "../../../lib/previewNav";
import type { RealEstateHome5Project } from "../../../types/realEstateHome5";

export default function RealEstateLatestProject5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const tabs = (Array.isArray(data.tabs) ? data.tabs : ["ALL"]) as string[];
  const allTab = String(data.allTabLabel || tabs[0] || "ALL");
  const [activeTab, setActiveTab] = useState(allTab);
  const [selected, setSelected] = useState<number | null>(null);
  const projects = (Array.isArray(data.projectItems)
    ? data.projectItems
    : Array.isArray(data.properties)
      ? data.properties
      : []) as RealEstateHome5Project[];
  const filtered = projects.filter((item) => activeTab === allTab || item.tab === activeTab);
  const viewHref = String(data.viewAllUrl || data.buttons?.[0]?.href || "/properties");
  const viewLabel = String(data.viewAllText || data.buttons?.[0]?.label || "View all projects");

  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(viewHref, viewLabel));
    scrollTemplateToTop();
  };

  return (
    <section
      className="py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor title tabs projectItems viewAllText viewAllUrl"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        <h2 className="mb-4 text-center text-4xl font-bold">{String(data.title || "Our latest projects")}</h2>
        <div className="mx-auto mb-6 flex items-center justify-center gap-1.5">
          <div className="h-[5px] w-[45px] rounded-xl bg-[var(--accent)]" />
          <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        </div>
        <div className="mb-6 flex justify-center gap-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 py-3 text-[0.85rem] font-semibold tracking-wider uppercase ${
                activeTab === tab
                  ? "border-[var(--accent)] text-[var(--accent)]"
                  : "border-transparent text-[#666]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-box-layout-grid="grid">
          {filtered.map((item, index) => (
            <button
              key={`${item.image}-${index}`}
              type="button"
              className="h-[300px] overflow-hidden rounded-lg"
              onClick={() => setSelected(index)}
            >
              <img src={item.image} alt={item.title || "Project"} className="h-full w-full object-cover transition hover:scale-105" />
            </button>
          ))}
        </div>
        {selected !== null && filtered[selected] && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-5" onClick={() => setSelected(null)}>
            <button type="button" className="absolute top-5 right-8 text-4xl text-white" onClick={() => setSelected(null)}>×</button>
            <img src={filtered[selected].image} alt="" className="max-h-[90%] max-w-[90%] object-contain" onClick={(event) => event.stopPropagation()} />
          </div>
        )}
        <div className="text-center">
          <Link
            href={viewHref}
            onClick={handleNavigate}
            className="inline-flex items-center gap-3 rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white"
          >
            {viewLabel}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
