"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SectionData, SectionProps } from "../../../types/section";
import RealEstateBreadCrumb1 from "../breadcrumb/RealEstateBreadCrumb1";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

type ContentBlock = {
  title: string;
  desc: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getBlocks = (value: unknown): ContentBlock[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        isRecord(item) &&
        typeof item.title === "string" &&
        typeof item.desc === "string"
          ? [{ title: item.title, desc: item.desc }]
          : [],
      )
    : [];

const DEFAULT_BLOCKS: ContentBlock[] = [
  {
    title: "What this page covers",
    desc: "Use this extra page for any topic that is not already a dedicated layout — offers, FAQs, partner notes, location details, or campaign content.",
  },
  {
    title: "Why it is useful",
    desc: "Visitors get a clear heading, supporting copy, and a simple next step. Your team can replace this demo text with the real message for this page.",
  },
  {
    title: "Next step",
    desc: "Keep the page focused: explain the topic, show proof or practical detail, then invite an enquiry or a visit to a related listing.",
  },
];

function readPage(data: SectionData) {
  const title =
    typeof data.title === "string" && data.title.trim()
      ? data.title
      : "Custom Page";
  const pretitle =
    typeof data.pretitle === "string" && data.pretitle.trim()
      ? data.pretitle
      : "Page";
  const desc =
    typeof data.desc === "string" && data.desc.trim()
      ? data.desc
      : `Welcome to our ${title} page. Here you will find clear information and a simple next step.`;
  const desc2 =
    typeof data.desc2 === "string" && data.desc2.trim() ? data.desc2 : "";
  const image =
    (typeof data.sideImage === "string" && data.sideImage) ||
    (typeof data.image === "string" && data.image) ||
    "/bg1.jpg";
  const imageAlt =
    (typeof data.sideImageTitle === "string" && data.sideImageTitle) || title;
  const blocks = getBlocks(data.sections);
  const content = blocks.length ? blocks : DEFAULT_BLOCKS;
  const cta =
    typeof data.contactButtonLabel === "string"
      ? data.contactButtonLabel
      : "Contact us";
  return { title, pretitle, desc, desc2, image, imageAlt, content, cta };
}

function PageBanner({
  pretitle,
  title,
  desc,
}: {
  pretitle: string;
  title: string;
  desc: string;
}) {
  return (
    <RealEstateBreadCrumb1
      editorFields={["pretitle", "title", "desc"]}
      pretitle={pretitle}
      title={title}
      desc={desc}
    />
  );
}

function ContactCta({ label, data }: { label: string; data?: SectionData }) {
  return (
    <Link
      href={publishedHrefFromData("/contact", data)}
      className="inline-flex items-center gap-2 rounded-full bg-[#14251f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d332c]"
    >
      {label}
      <ArrowRight size={15} />
    </Link>
  );
}

/** Custom Page 1 — copy left, tall image right */
export default function RealEstateCustomPage1({ data = {} }: SectionProps) {
  const page = readPage(data as SectionData);
  return (
    <main className="bg-white text-[#141414]">
      <PageBanner {...page} />
      <section
        data-editor-section-label="Custom Page Content"
        data-editor-fields="desc2 sideImage sideImageTitle sections contactButtonLabel"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div className="min-w-0">
            {page.desc2 ? (
              <p data-editor-field="desc2" className="text-base leading-8 text-[#141414]/70 md:text-lg">
                {page.desc2}
              </p>
            ) : null}
            <div className="mt-10 space-y-10">
              {page.content.map((block, index) => (
                <article
                  key={`${block.title}-${index}`}
                  className="border-b border-[#141414]/10 pb-10 last:border-0 last:pb-0"
                >
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-[#a4472f]">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 text-2xl font-medium tracking-[-0.025em] md:text-3xl">
                    {block.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#141414]/65 md:text-base md:leading-8">
                    {block.desc}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-10">
              <ContactCta label={page.cta} data={data as SectionData} />
            </div>
          </div>
          <div className="overflow-hidden rounded-[1.5rem] border border-[#141414]/10 bg-[#f8f6f1]">
            <img
              data-editor-field="sideImage"
              src={page.image}
              alt={page.imageAlt}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/** Custom Page 2 — centered editorial, no side image */
export function RealEstateCustomPage2({ data = {} }: SectionProps) {
  const page = readPage(data as SectionData);
  return (
    <main className="bg-white text-[#141414]">
      <PageBanner {...page} />
      <section
        data-editor-section-label="Custom Page Content"
        data-editor-fields="desc2 sections contactButtonLabel"
        className="px-5 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-3xl text-center">
          {page.desc2 ? (
            <p data-editor-field="desc2" className="text-lg leading-8 text-[#141414]/70">
              {page.desc2}
            </p>
          ) : null}
          <div className="mt-12 space-y-8 text-left">
            {page.content.map((block, index) => (
              <article
                key={`${block.title}-${index}`}
                className="rounded-[1.25rem] border border-[#141414]/10 bg-[#f8f6f1] p-7"
              >
                <p className="text-[10px] font-semibold tracking-[0.18em] text-[#a4472f]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.025em]">
                  {block.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#141414]/65">{block.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <ContactCta label={page.cta} data={data as SectionData} />
          </div>
        </div>
      </section>
    </main>
  );
}

/** Custom Page 3 — image left, copy right */
export function RealEstateCustomPage3({ data = {} }: SectionProps) {
  const page = readPage(data as SectionData);
  return (
    <main className="bg-white text-[#141414]">
      <PageBanner {...page} />
      <section
        data-editor-section-label="Custom Page Content"
        data-editor-fields="desc2 sideImage sideImageTitle sections contactButtonLabel"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="overflow-hidden rounded-[1.5rem] border border-[#141414]/10 bg-[#f8f6f1]">
            <img
              data-editor-field="sideImage"
              src={page.image}
              alt={page.imageAlt}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
          <div className="min-w-0">
            {page.desc2 ? (
              <p data-editor-field="desc2" className="text-base leading-8 text-[#141414]/70 md:text-lg">
                {page.desc2}
              </p>
            ) : null}
            <div className="mt-8 space-y-8">
              {page.content.map((block, index) => (
                <article key={`${block.title}-${index}`}>
                  <h2 className="text-2xl font-medium tracking-[-0.025em]">
                    {block.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[#141414]/65">{block.desc}</p>
                </article>
              ))}
            </div>
            <div className="mt-10">
              <ContactCta label={page.cta} data={data as SectionData} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/** Custom Page 4 — three feature cards */
export function RealEstateCustomPage4({ data = {} }: SectionProps) {
  const page = readPage(data as SectionData);
  return (
    <main className="bg-white text-[#141414]">
      <PageBanner {...page} />
      <section
        data-editor-section-label="Custom Page Content"
        data-editor-fields="desc2 sections contactButtonLabel"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto max-w-6xl">
          {page.desc2 ? (
            <p data-editor-field="desc2" className="max-w-3xl text-lg leading-8 text-[#141414]/70">
              {page.desc2}
            </p>
          ) : null}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {page.content.map((block, index) => (
              <article
                key={`${block.title}-${index}`}
                className="rounded-[1.35rem] border border-[#141414]/10 bg-[#f8f6f1] p-7"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a4472f]">
                  0{index + 1}
                </p>
                <h2 className="mt-4 text-xl font-medium tracking-[-0.02em]">
                  {block.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#141414]/65">{block.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-12">
            <ContactCta label={page.cta} data={data as SectionData} />
          </div>
        </div>
      </section>
    </main>
  );
}

/** Custom Page 5 — dark intro band + stacked articles */
export function RealEstateCustomPage5({ data = {} }: SectionProps) {
  const page = readPage(data as SectionData);
  return (
    <main className="bg-white text-[#141414]">
      <PageBanner {...page} />
      <section
        data-editor-section-label="Custom Page Content"
        data-editor-fields="desc2 sideImage sideImageTitle sections contactButtonLabel"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[1.75rem] bg-[#14251f] text-white">
          <div className="grid items-center gap-8 p-8 md:grid-cols-[1.1fr_0.9fr] md:p-12">
            <div>
              {page.desc2 ? (
                <p data-editor-field="desc2" className="text-lg leading-8 text-white/75">
                  {page.desc2}
                </p>
              ) : (
                <p className="text-lg leading-8 text-white/75">{page.desc}</p>
              )}
              <div className="mt-8">
                <Link
                  href={publishedHrefFromData("/contact", data as SectionData)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#14251f] transition hover:bg-[#f1e5dc]"
                >
                  {page.cta}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
            <img
              data-editor-field="sideImage"
              src={page.image}
              alt={page.imageAlt}
              className="h-64 w-full rounded-[1.25rem] object-cover md:h-80"
            />
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-6xl space-y-8">
          {page.content.map((block, index) => (
            <article
              key={`${block.title}-${index}`}
              className="grid gap-4 border-b border-[#141414]/10 pb-8 last:border-0 md:grid-cols-[160px_1fr]"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#a4472f]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <div>
                <h2 className="text-2xl font-medium tracking-[-0.025em]">{block.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#141414]/65 md:text-base">
                  {block.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
