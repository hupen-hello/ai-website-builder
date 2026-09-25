"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, Mail } from "lucide-react";
import { careerPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { CareerCta4Data } from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

export default function RealEstateCareerCta4({ data = {} }: SectionProps) {
  const authored = careerPage4Content.RealEstateCareerCta4;
  const content: CareerCta4Data = {
    ...authored,
    ...(data as CareerCta4Data),
  };
  const email = content.email ?? "careers@example.com";

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="careerCta"
      data-editor-fields="accentColor title subtitle description buttonText buttonLink email"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] md:flex-row md:gap-12 lg:p-12">
          <div className="relative z-10 flex w-full justify-center md:w-3/12 md:justify-start">
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#f2f9f9] p-8 lg:h-48 lg:w-48">
              <Briefcase className="h-16 w-16 text-[var(--accent)]/30 lg:h-20 lg:w-20" />
            </div>
          </div>

          <div className="z-10 w-full text-center md:w-5/12 md:border-r md:border-gray-200 md:pr-8 md:text-left lg:pr-12">
            <h3
              className="mb-3 text-2xl font-bold text-secondary"
              data-editor-field="title"
            >
              {content.title ?? "Don't See The Right Role?"}
            </h3>
            <p
              className="mb-4 text-[15px] font-bold text-[var(--accent)]"
              data-editor-field="subtitle"
            >
              {content.subtitle ?? "We're Always Looking For Great Talent!"}
            </p>
            <p
              className="text-[14px] leading-relaxed text-gray-500"
              data-editor-field="description"
            >
              {content.description ??
                "Send us your resume and tell us about yourself. We'll keep you in mind for future opportunities."}
            </p>
          </div>

          <div className="z-10 flex w-full flex-col items-center gap-4 md:w-4/12 md:items-start md:pl-4 lg:pl-8">
            <Link
              href={content.buttonLink ?? `mailto:${email}`}
              className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-8 py-3 font-medium text-white transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
            >
              <span data-editor-field="buttonText">
                {content.buttonText ?? "Send Your Resume"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2 text-[14px] font-medium text-gray-500">
              <Mail className="h-4 w-4 text-[var(--accent)]" />
              <span data-editor-field="email">{email}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
