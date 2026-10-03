"use client";

import type { ElementType } from "react";
import {
  DollarSign,
  FileText,
  Home,
  Link2,
  MapPin,
  Pencil,
  Shield,
  User,
} from "lucide-react";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { SectionProps } from "../../../types/section";

export type LegalTerm5 = {
  id?: string;
  title?: string;
  desc?: string;
  description?: string;
  content?: string;
  icon?: string;
};

type LegalPage5Data = {
  accentColor?: string;
  introText?: string;
  terms?: LegalTerm5[];
  legalSections?: LegalTerm5[];
  sections?: LegalTerm5[];
  showCta?: boolean;
  ctaTitleStart?: string;
  ctaTitleHighlight?: string;
  ctaDescription?: string;
  ctaPhone?: string;
  ctaPhoneLink?: string;
  phone?: string;
  phoneLink?: string;
};

const iconCycle: ElementType[] = [
  FileText,
  User,
  Home,
  DollarSign,
  Shield,
  Link2,
  Pencil,
  MapPin,
];

function normalizeTerms(data: LegalPage5Data): LegalTerm5[] {
  const raw =
    (Array.isArray(data.terms) && data.terms.length && data.terms) ||
    (Array.isArray(data.legalSections) &&
      data.legalSections.length &&
      data.legalSections) ||
    (Array.isArray(data.sections) && data.sections.length && data.sections) ||
    [];

  return raw.map((term, index) => ({
    id: term.id ?? `term-${index + 1}`,
    title: term.title ?? `Section ${index + 1}`,
    desc: term.desc ?? term.description ?? term.content ?? "",
    icon: term.icon,
  }));
}

export function RealEstateLegalPageLayout5({
  data = {},
  fallbackIntro,
  fallbackTerms,
}: SectionProps & {
  fallbackIntro: string;
  fallbackTerms: LegalTerm5[];
}) {
  const content = data as LegalPage5Data;
  const accent = String(content.accentColor || "#ff6b00");
  const introText = String(content.introText || fallbackIntro);
  const terms = normalizeTerms(content);
  const resolvedTerms = terms.length ? terms : fallbackTerms;

  const ctaTitleStart = String(content.ctaTitleStart || "Need Immediate ");
  const ctaTitleHighlight = String(content.ctaTitleHighlight || "Assistance?");
  const ctaDescription = String(
    content.ctaDescription ||
      "Our team is available to help you. Call us now for quick support and details.",
  );
  const ctaPhone = String(content.ctaPhone || content.phone || "+91 123 456 7890");
  const ctaPhoneLink = String(
    content.ctaPhoneLink ||
      content.phoneLink ||
      `tel:${ctaPhone.replace(/\s+/g, "")}`,
  );
  const showCta = content.showCta !== false;

  return (
    <section
      className="bg-white py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="legalPage"
      data-editor-fields="accentColor introText terms ctaTitleStart ctaTitleHighlight ctaDescription ctaPhone ctaPhoneLink"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:overflow-x-hidden max-md:px-5">
        <div className="mx-auto max-w-[900px]">
          {introText ? (
            <div className="mb-12">
              <p
                className="leading-[1.6] text-[#666]"
                data-editor-field="introText"
              >
                {introText}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-8">
            {resolvedTerms.map((term, index) => {
              const Icon = iconCycle[index % iconCycle.length];
              return (
                <article
                  key={term.id ?? `${term.title}-${index}`}
                  className="flex items-start gap-6"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[rgba(255,107,0,0.1)] text-[var(--accent)]">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </div>
                  <div>
                    <h3
                      className="mb-2 text-[1.25rem] font-semibold text-[#222]"
                      data-editor-field="title"
                    >
                      {term.title}
                    </h3>
                    <p
                      className="m-0 leading-[1.6] text-[#666]"
                      data-editor-field="desc"
                    >
                      {term.desc}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {showCta ? (
          <div className="mt-20 flex flex-wrap items-center justify-between gap-6 rounded-lg border border-[#ffe4d6] bg-[#fff7f0] px-10 py-8 max-md:flex-col max-md:items-stretch max-md:gap-6 max-md:px-6 max-md:py-6 max-md:text-center">
            <div className="flex items-center gap-6 max-md:flex-col max-md:gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_15px_rgba(255,107,0,0.1)] max-md:mx-auto">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-[1.4rem] font-bold text-[#111]">
                  <span data-editor-field="ctaTitleStart">{ctaTitleStart}</span>
                  <span
                    className="text-[var(--accent)]"
                    data-editor-field="ctaTitleHighlight"
                  >
                    {ctaTitleHighlight}
                  </span>
                </h3>
                <p
                  className="m-0 text-[0.95rem] text-[#666]"
                  data-editor-field="ctaDescription"
                >
                  {ctaDescription}
                </p>
              </div>
            </div>

            <a
              href={ctaPhoneLink}
              className="inline-flex items-center gap-2.5 whitespace-nowrap rounded border border-[var(--accent)] bg-white px-6 py-3 text-[1.05rem] font-semibold text-[var(--accent)] no-underline max-md:justify-center"
              data-editor-field="ctaPhone"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {ctaPhone}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function createLegalPage5(
  fallbackIntro: string,
  fallbackTerms: LegalTerm5[],
) {
  return function LegalPage5({ data = {} }: SectionProps) {
    return (
      <RealEstateLegalPageLayout5
        data={data}
        fallbackIntro={fallbackIntro}
        fallbackTerms={fallbackTerms}
      />
    );
  };
}
