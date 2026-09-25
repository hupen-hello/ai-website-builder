"use client";

import { useId } from "react";
import { partnerPage4Content } from "../../../data/realEstatePage4Content";
import type {
  PartnerPage4Data,
  PartnerPage4Item,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

function PartnerCard({ partner }: { partner: PartnerPage4Item }) {
  const patternId = useId();

  return (
    <div className="group relative flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-full w-full items-center justify-center overflow-hidden opacity-70 transition-opacity duration-300 group-hover:opacity-100">
        <img
          src={partner.image}
          alt={partner.name}
          className="h-full w-full object-contain mix-blend-multiply"
          data-editor-media="image"
          data-editor-media-type="image"
        />
      </div>

      <div className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 opacity-30 transition-opacity group-hover:opacity-60">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <pattern
            id={patternId}
            x="0"
            y="0"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.5" fill="var(--accent)" />
          </pattern>
          <path d="M64 0 L64 64 L0 64 Z" fill={`url(#${patternId})`} />
        </svg>
      </div>
    </div>
  );
}

export default function RealEstatePartnerPage4({ data = {} }: SectionProps) {
  const authored = partnerPage4Content.RealEstatePartnerPage4;
  const content: PartnerPage4Data = {
    ...authored,
    ...(data as PartnerPage4Data),
  };
  const partners = content.partners?.length
    ? content.partners
    : (authored.partners ?? []);

  return (
    <section
      className="bg-gray-50/50 py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="partners"
      data-editor-fields="accentColor pretitle title description partners"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="flex gap-1" aria-hidden="true">
              <div className="h-1 w-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_30%,transparent)]" />
              <div className="h-1 w-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_80%,transparent)]" />
              <div className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            </div>
            <h3
              className="text-sm font-bold uppercase tracking-widest text-[var(--accent)]"
              data-editor-field="pretitle"
            >
              {content.pretitle ?? "Our Trusted Partners"}
            </h3>
            <div className="flex gap-1" aria-hidden="true">
              <div className="h-1 w-1 rounded-full bg-[var(--accent)]" />
              <div className="h-1 w-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_80%,transparent)]" />
              <div className="h-1 w-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_30%,transparent)]" />
            </div>
          </div>

          <h2
            className="mb-6 text-3xl font-bold tracking-tight text-secondary md:text-5xl"
            data-editor-field="title"
          >
            {content.title ?? "Collaborating With The Best"}
          </h2>
          <p
            className="text-lg text-gray-600"
            data-editor-field="description"
          >
            {content.description ?? ""}
          </p>
        </div>

        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          data-box-layout-grid="grid"
        >
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      </div>
    </section>
  );
}
