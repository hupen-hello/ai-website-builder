"use client";

import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type BrochureItem = {
  id?: string;
  title?: string;
  desc?: string;
  description?: string;
  image?: string;
  fileUrl?: string;
  file?: string;
};

const IMG = "/categories/realestate/template5";
const DEFAULT_PDF = `${IMG}/dummy-brochure.pdf`;

const defaultBrochures: BrochureItem[] = [
  {
    id: "b1",
    title: "Luxury Villas Brochure",
    desc: "Explore our exquisite collection of modern luxury villas.",
    image: `${IMG}/kitchen_reno.png`,
    fileUrl: DEFAULT_PDF,
  },
  {
    id: "b2",
    title: "Commercial Spaces Guide",
    desc: "Detailed floor plans and amenities for our commercial projects.",
    image: `${IMG}/office_reno.png`,
    fileUrl: DEFAULT_PDF,
  },
  {
    id: "b3",
    title: "Residential Apartments",
    desc: "A complete overview of our ongoing residential apartment projects.",
    image: `${IMG}/bathroom_reno.png`,
    fileUrl: DEFAULT_PDF,
  },
  {
    id: "b4",
    title: "Eco-Friendly Homes",
    desc: "Discover sustainable and green housing solutions for the future.",
    image: `${IMG}/outdoors_reno.png`,
    fileUrl: DEFAULT_PDF,
  },
];

export default function RealEstateBrochurePage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const tagline = String(
    data.tagline || data.pretitle || "EXPLORE OUR BROCHURES",
  );
  const titleStart = String(data.titleStart || "Download Our");
  const titleEnd = String(data.titleEnd || "Latest Brochures");
  const title = String(data.title || `${titleStart} ${titleEnd}`);
  const description = String(
    data.description ||
      "Get detailed information about our services, projects, design solutions, and more. Download our brochures in PDF format to learn how we can bring your vision to life.",
  );
  const introImage = String(data.image || `${IMG}/office_reno.png`);
  const introImageAlt = String(data.imageAlt || "Brochures Stack");
  const collectionTitle = String(
    data.collectionTitle || data.sectionTitle || "Our Brochure Collection",
  );
  const downloadLabel = String(data.downloadLabel || "Download PDF");
  const ctaTitleStart = String(data.ctaTitleStart || "Need Immediate ");
  const ctaTitleHighlight = String(data.ctaTitleHighlight || "Assistance?");
  const ctaDescription = String(
    data.ctaDescription ||
      "Our team is available to help you. Call us now for quick support and details.",
  );
  const ctaPhone = String(data.ctaPhone || data.phone || "+91 123 456 7890");
  const ctaPhoneLink = String(
    data.ctaPhoneLink || data.phoneLink || `tel:${ctaPhone.replace(/\s+/g, "")}`,
  );
  const showCta = data.showCta !== false;

  const brochures = (
    Array.isArray(data.brochures) && data.brochures.length
      ? data.brochures
      : defaultBrochures
  ) as BrochureItem[];

  const titleLines =
    data.titleStart || data.titleEnd
      ? [titleStart, titleEnd]
      : title.split(/\n/).filter(Boolean);

  return (
    <>
      <section
        className="overflow-hidden bg-white py-[30px]"
        style={getAccentStyle(accent)}
        data-editor-section-label="brochure"
        data-editor-fields="accentColor tagline titleStart titleEnd description image imageAlt collectionTitle downloadLabel brochures ctaTitleStart ctaTitleHighlight ctaDescription ctaPhone ctaPhoneLink"
      >
        <div className="mx-auto flex w-full max-w-[1320px] items-center gap-8 px-6 max-md:flex-col max-md:gap-6 max-md:px-5">
          <div className="min-w-0 flex-1">
            <div
              className="mb-4 font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
              data-editor-field="tagline"
            >
              {tagline}
            </div>
            <h2
              className="mb-6 font-extrabold text-[#333]"
              data-editor-field="title"
            >
              {titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <div className="mb-8 flex items-center gap-1.5">
              <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            </div>
            <p
              className="max-w-[500px] text-[1.05rem] leading-[1.8] text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          </div>

          <div className="relative flex flex-1 justify-center">
            <div className="absolute top-1/2 left-1/2 z-0 aspect-square w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(255,107,0,0.05)]" />
            <img
              src={introImage}
              alt={introImageAlt}
              className="relative z-[1] w-4/5 rounded-lg shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
              data-editor-media="image"
              data-editor-media-type="image"
              data-editor-field="image"
            />
          </div>
        </div>
      </section>

      <section
        className="bg-[#fafafa] py-[30px]"
        style={getAccentStyle(accent)}
        data-editor-section-label="brochureCollection"
      >
        <div className="mx-auto w-full max-w-[1320px] px-6 max-md:overflow-x-hidden max-md:px-5">
          <div className="mb-8 text-center">
            <h2
              className="mb-4 font-extrabold text-[#333]"
              data-editor-field="collectionTitle"
            >
              {collectionTitle}
            </h2>
            <div className="mx-auto mb-8 flex items-center justify-center gap-1.5">
              <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            </div>
          </div>

          <div
            className="grid grid-cols-4 gap-6 max-[992px]:grid-cols-2 max-md:grid-cols-1"
            data-box-layout-grid="grid"
            data-editor-field="brochures"
          >
            {brochures.map((brochure, index) => {
              const itemTitle = String(
                brochure.title || `Brochure ${index + 1}`,
              );
              const itemDesc = String(
                brochure.desc || brochure.description || "",
              );
              const itemImage = String(
                brochure.image || `${IMG}/kitchen_reno.png`,
              );
              const fileUrl = String(
                brochure.fileUrl || brochure.file || DEFAULT_PDF,
              );

              return (
                <div
                  key={String(brochure.id || `${itemTitle}-${index}`)}
                  className="flex flex-col rounded-xl border border-[#eaeaea] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                >
                  <div className="mb-5 h-[250px] overflow-hidden rounded-lg">
                    <img
                      src={itemImage}
                      alt={itemTitle}
                      className="h-full w-full object-cover"
                      data-editor-media="image"
                      data-editor-media-type="image"
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="mb-3 text-[1.25rem] font-bold text-[#333]">
                      {itemTitle}
                    </h3>
                    <p className="mb-6 flex-1 text-[0.9rem] leading-[1.6] text-[#666]">
                      {itemDesc}
                    </p>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded border border-[var(--accent)] bg-white py-3 text-[0.95rem] font-semibold text-[var(--accent)] no-underline transition hover:bg-[var(--accent)] hover:text-white"
                      data-editor-field="downloadLabel"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {downloadLabel}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {showCta ? (
            <div className="mt-[30px] flex flex-wrap items-center justify-between gap-6 rounded-lg border border-[#ffe4d6] bg-[#fff7f0] px-10 py-8 max-md:flex-col max-md:items-stretch max-md:gap-6 max-md:px-6 max-md:py-6 max-md:text-center">
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
    </>
  );
}
