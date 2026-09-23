"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import type { SectionData, SectionProps } from "../../../types/section";
import RealEstateBreadCrumb1 from "../breadcrumb/RealEstateBreadCrumb1";

type PolicySection = {
  title: string;
  desc: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getPolicySections = (value: unknown): PolicySection[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
      isRecord(item) &&
        typeof item.title === "string" &&
        typeof item.desc === "string"
        ? [{ title: item.title, desc: item.desc }]
        : [],
    )
    : [];

export function RealEstateLegalPageLayout({
  data,
  sectionIdPrefix,
  contactTitle,
  contactDescription,
}: {
  data: SectionData;
  sectionIdPrefix: string;
  contactTitle: string;
  contactDescription: string;
}) {
  const sections = getPolicySections(data.sections);
  const updatedAt =
    typeof data.updatedAt === "string" ? data.updatedAt : undefined;
  const contentLabel =
    {
      privacy: "Privacy Policy Content",
      terms: "Terms and Conditions Content",
      disclaimer: "Disclaimer Content",
      cookie: "Cookie Policy Content",
      refund: "Refund Policy Content",
    }[sectionIdPrefix] ?? "Legal Page Content";

  return (
    <main className="bg-white text-[#141414]">
      <RealEstateBreadCrumb1
        editorFields={["pretitle", "title", "desc", "updatedAt"]}
        pretitle={data.pretitle ?? "Legal"}
        title={data.title ?? "Privacy Policy"}
        desc={data.desc}
        footer={updatedAt && (
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#141414]/45">
            Last updated: {updatedAt}
          </p>
        )}
      />

      <section
        data-editor-section-label={contentLabel}
        data-editor-fields="sections updatedAt contactTitle contactDescription contactButtonLabel"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[240px_1fr] lg:gap-20">
          {sections.length > 0 && (
            <aside className="lg:sticky lg:top-8 lg:self-start">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#141414]/45">
                On this page
              </p>
              <nav className="mt-4 border-l border-[#141414]/12">
                {sections.map((section, index) => (
                  <button
                    type="button"
                    key={`${section.title}-navigation`}
                    onClick={() =>
                      document
                        .getElementById(`${sectionIdPrefix}-section-${index + 1}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }
                    className="block w-full border-l border-transparent px-4 py-2 text-left text-sm text-[#141414]/60 transition hover:border-[#a4472f] hover:text-[#141414]"
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </aside>
          )}

          <div className="min-w-0">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <article
                  id={`${sectionIdPrefix}-section-${index + 1}`}
                  key={section.title}
                  className="scroll-mt-8 border-b border-[#141414]/10 pb-10 last:border-0 last:pb-0"
                >
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-[#a4472f]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 text-2xl font-medium tracking-[-0.025em] md:text-3xl">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#141414]/65 md:text-base md:leading-8">
                    {section.desc}
                  </p>
                </article>
              ))}
            </div>

            {/* <div className="mt-12 rounded-[1.25rem] bg-[#14251f] p-7 text-white md:p-9">
              <Mail size={22} className="text-[#e9ad91]" />
              <h2 className="mt-5 text-2xl font-medium tracking-[-0.025em]">
                {typeof data.contactTitle === "string" ? data.contactTitle : contactTitle}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/65">
                {typeof data.contactDescription === "string" ? data.contactDescription : contactDescription}
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#14251f] transition hover:bg-[#f1e5dc]"
              >
                {typeof data.contactButtonLabel === "string" ? data.contactButtonLabel : "Contact us"} <ArrowRight size={15} />
              </Link>
            </div> */}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function RealEstatePrivacyPolicy1({
  data = {},
}: SectionProps) {
  return (
    <RealEstateLegalPageLayout
      data={data}
      sectionIdPrefix="privacy"
      contactTitle="Have a privacy question?"
      contactDescription="Contact our team to review, update, or request deletion of the personal information you have shared with HAUS Group."
    />
  );
}
