"use client";

import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { RealEstateHome5Testimonial } from "../../../types/realEstateHome5";

export default function RealEstateTestimonial5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const items = (Array.isArray(data.testimonialItems)
    ? data.testimonialItems
    : Array.isArray(data.testimonials)
      ? data.testimonials
      : []) as RealEstateHome5Testimonial[];
  const visibleItems = items.slice(0, 3);

  return (
    <section
      className="bg-[#f8f9fa] py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor title testimonialItems"
    >
      <div className="mx-auto max-w-[1320px] px-6">
        <h2 className="mb-4 text-center text-4xl font-bold">
          {String(data.title || "What our clients say")}
        </h2>
        <div className="mx-auto mb-8 flex items-center justify-center gap-1.5">
          <div className="h-[5px] w-[45px] rounded-xl bg-[var(--accent)]" />
          <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" data-box-layout-grid="grid">
          {visibleItems.map((item) => (
            <div
              key={item.name}
              className="flex flex-col rounded-lg bg-white p-8 shadow-[0_4px_15px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-4 font-serif text-[3.5rem] leading-none font-extrabold text-[var(--accent)]">
                “
              </div>
              <p className="mb-6 flex-1 text-[0.95rem] leading-relaxed text-[#333]">
                {item.content || item.quote}
              </p>
              <hr className="mb-6 border-[#eaeaea]" />
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-[45px] w-[45px] rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <div className="font-bold">{item.name}</div>
                  <div className="text-[0.85rem] text-[#666]">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
