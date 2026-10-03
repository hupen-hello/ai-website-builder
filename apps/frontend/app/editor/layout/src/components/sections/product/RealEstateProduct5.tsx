"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import { getPageLabelFromHref, scrollTemplateToTop } from "../../../lib/previewNav";
import type { RealEstateHome5Service } from "../../../types/realEstateHome5";

const serviceIcon = (id: string) => {
  const name = id.toUpperCase();
  if (name === "KITCHEN") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5"><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M4 12h16" /><path d="M10 6v12" /></svg>;
  if (name === "BATHROOM") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5"><path d="M4 12h16a2 2 0 0 1 2 2v2H2v-2a2 2 0 0 1 2-2z" /></svg>;
  if (name === "OUTDOORS") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5"><path d="M12 22v-8" /><path d="M12 14a6 6 0 0 0-6-6 6 6 0 1 1 12 0 6 6 0 0 0-6 6z" /></svg>;
  if (name === "BALCONY") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5"><rect x="2" y="10" width="20" height="12" /><path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" /></svg>;
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5"><rect x="6" y="4" width="12" height="8" rx="1" /><path d="M2 16h20v2H2z" /></svg>;
};

export default function RealEstateProduct5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const items = (Array.isArray(data.productItems) && data.productItems.length
    ? data.productItems
    : Array.isArray(data.items)
      ? data.items
      : []) as RealEstateHome5Service[];
  const detailHref = String(data.detailBasePath || "/services");

  const handleNavigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(detailHref, "Services"));
    scrollTemplateToTop();
  };

  return (
    <section
      className="bg-[#f8f9fa] py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor title productItems detailBasePath"
      data-editor-card-fields="image title id"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        <h2 className="mb-4 text-center text-4xl font-bold">{String(data.title || data.productSectionTitle || "Our Services")}</h2>
        <div className="mx-auto mb-8 flex items-center justify-center gap-1.5">
          <div className="h-[5px] w-[45px] rounded-xl bg-[var(--accent)]" />
          <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5" data-box-layout-grid="grid">
          {items.slice(0, 5).map((srv) => (
            <div key={srv.title} className="relative pb-6">
              <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_12px_35px_rgba(0,0,0,0.12)]">
                <div className="flex items-center justify-center gap-3 px-4 py-6">
                  {serviceIcon(String(srv.id || srv.title))}
                  <h3 className="text-[0.95rem] font-semibold uppercase">{srv.title}</h3>
                </div>
                <img src={srv.image} alt={srv.title} className="h-[230px] w-full object-cover" />
              </div>
              <Link
                href={detailHref}
                onClick={handleNavigate}
                className="absolute bottom-0 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[var(--accent)] text-white shadow"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
