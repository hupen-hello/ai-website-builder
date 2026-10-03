"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

const IMG = "/categories/realestate/template5";

export default function RealEstatePropertyDetailPage5({
  data = {},
}: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const title = String(data.title || "Property");
  const address = String(
    data.address || "10765 Hillshire Ave, Baton Rouge, LA 70810, USA",
  );
  const price = String(data.price || "$1,200,000");
  const beds = String(data.beds ?? "4");
  const baths = String(data.baths ?? "3");
  const sqft = String(data.sqft ?? "3500");
  const image = String(data.image || `${IMG}/kitchen_reno.png`);
  const gallery = (
    Array.isArray(data.gallery) && data.gallery.length
      ? data.gallery
      : [
          `${IMG}/office_reno.png`,
          `${IMG}/kitchen_reno.png`,
          `${IMG}/bathroom_reno.png`,
          `${IMG}/outdoors_reno.png`,
        ]
  ).map(String);
  const description = String(
    data.description ||
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  );
  const descriptionParagraphs = description
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const daysOnMarket = String(data.daysOnMarket || "124 Days");
  const pricePerSqft = String(data.pricePerSqft || "$ 186");
  const monthlyPayment = String(data.monthlyPayment || "$ 1497/Monthly");

  const priceLabel = String(data.priceLabel || "Price:");
  const saleBadge = String(data.saleBadge || data.statusLabel || "For Sale");
  const daysLabel = String(data.daysLabel || "Days on Housely");
  const pricePerSqftLabel = String(data.pricePerSqftLabel || "Price per sq ft");
  const monthlyPaymentLabel = String(
    data.monthlyPaymentLabel || "Monthly Payment (estimate)",
  );
  const bookText = String(data.bookText || "BOOK NOW");
  const offerText = String(data.offerText || "OFFER NOW");
  const questionText = String(
    data.questionText || "Have Question ? Get in touch!",
  );
  const contactText = String(data.contactText || "CONTACT US");
  const contactUrl = String(data.contactUrl || "/contact");
  const sqftSuffix = String(data.sqftSuffix || "sqf");
  const bedsLabel = String(data.bedsLabel || "Beds");
  const bathsLabel = String(data.bathsLabel || "Baths");
  const mapFallbackLabel = String(
    data.mapFallbackLabel || "Property location",
  );
  const mapEmbed = String(
    data.mapEmbed ||
      `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`,
  );

  const sideImages = gallery.slice(0, 4);
  while (sideImages.length < 4) {
    sideImages.push(image);
  }

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

  const actionButtonClass =
    "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--accent)] py-1.5 pr-1 pl-2.5 text-[13px] font-bold text-white no-underline transition hover:brightness-95";

  return (
    <section
      className="bg-white"
      style={getAccentStyle(accent)}
      data-editor-section-label="propertyDetail"
      data-editor-fields="accentColor title address price beds baths sqft image gallery description mapEmbed daysOnMarket pricePerSqft monthlyPayment saleBadge bookText offerText contactText contactUrl"
    >
      <div className="mx-auto w-full max-w-[1400px] px-5 py-5">
        <div className="flex h-[600px] gap-2.5 max-md:h-auto max-md:flex-col">
          <div className="h-full flex-[1.5] overflow-hidden max-md:h-[280px]">
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              data-editor-media="image"
              data-editor-media-type="image"
              data-editor-field="image"
            />
          </div>
          <div className="grid h-full flex-1 grid-cols-2 gap-2.5 max-md:h-[360px]">
            {sideImages.map((src, index) => (
              <div key={`${src}-${index}`} className="h-full overflow-hidden">
                <img
                  src={src}
                  alt={`Gallery ${index + 1}`}
                  className="h-full w-full object-cover"
                  data-editor-media="image"
                  data-editor-media-type="image"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-[60px] px-6 py-[30px] max-md:flex-col max-md:gap-6 max-md:px-5">
        <div className="min-w-0 flex-[1_1_65%]">
          <h2
            className="mb-6 font-bold text-[#333]"
            data-editor-field="address"
          >
            {address}
          </h2>
          <div className="mb-8 flex items-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>

          <div className="mb-8 flex items-center gap-6 border-b border-[#eaeaea] pb-6 max-md:flex-wrap">
            <div className="inline-flex items-center gap-2 font-semibold text-[#333]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              {sqft}
              {sqftSuffix}
            </div>
            <div className="inline-flex items-center gap-2 font-semibold text-[#333]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {beds} {bedsLabel}
            </div>
            <div className="inline-flex items-center gap-2 font-semibold text-[#333]">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M2 12h20M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6M9 5a3 3 0 0 1 6 0v7H9V5z" />
              </svg>
              {baths} {bathsLabel}
            </div>
          </div>

          <div className="mb-10" data-editor-field="description">
            {descriptionParagraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="mb-5 text-base leading-[1.8] text-[#666] last:mb-0"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-10 h-[400px] w-full overflow-hidden rounded-lg border border-[#eaeaea] bg-[#e5e3df]">
            <iframe
              src={mapEmbed}
              title={mapFallbackLabel}
              className="h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              data-editor-field="mapEmbed"
            />
          </div>
        </div>

        <aside className="sticky top-[120px] h-fit w-full min-w-0 max-w-[380px] flex-[0_0_35%] max-md:static max-md:max-w-none">
          <div className="overflow-hidden rounded-lg border border-[#eaeaea] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div
                  className="mb-2 text-[0.9rem] text-[#666]"
                  data-editor-field="priceLabel"
                >
                  {priceLabel}
                </div>
                <div
                  className="text-[1.75rem] font-bold text-[#111]"
                  data-editor-field="price"
                >
                  {price}
                </div>
              </div>
              <div
                className="rounded bg-[#e8f5e9] px-3 py-1.5 text-[0.85rem] font-semibold text-[#2e7d32]"
                data-editor-field="saleBadge"
              >
                {saleBadge}
              </div>
            </div>

            <div className="mb-8 flex flex-col gap-4 text-[0.9rem]">
              <div className="flex items-center justify-between border-b border-[#eaeaea] pb-4">
                <span className="text-[#666]">{daysLabel}</span>
                <span className="font-semibold" data-editor-field="daysOnMarket">
                  {daysOnMarket}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#eaeaea] pb-4">
                <span className="text-[#666]">{pricePerSqftLabel}</span>
                <span className="font-semibold" data-editor-field="pricePerSqft">
                  {pricePerSqft}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[#eaeaea] pb-4">
                <span className="text-[#666]">{monthlyPaymentLabel}</span>
                <span
                  className="font-semibold"
                  data-editor-field="monthlyPayment"
                >
                  {monthlyPayment}
                </span>
              </div>
            </div>

            <div className="mb-10 flex w-full min-w-0 gap-2">
              <Link
                href={contactUrl}
                onClick={(event) =>
                  handleNavigate(event, contactUrl, contactText)
                }
                className={actionButtonClass}
                data-editor-field="bookText"
              >
                <span className="truncate">{bookText}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--accent)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Link>
              <Link
                href={contactUrl}
                onClick={(event) =>
                  handleNavigate(event, contactUrl, contactText)
                }
                className={actionButtonClass}
                data-editor-field="offerText"
              >
                <span className="truncate">{offerText}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--accent)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Link>
            </div>

            <div className="text-center">
              <h4
                className="mb-6 text-base font-semibold text-[#333]"
                data-editor-field="questionText"
              >
                {questionText}
              </h4>
              <Link
                href={contactUrl}
                onClick={(event) =>
                  handleNavigate(event, contactUrl, contactText)
                }
                className="inline-flex items-center justify-center rounded-full border border-[var(--accent)] px-8 py-3 text-sm font-bold text-[var(--accent)] no-underline transition-colors hover:bg-[var(--accent)] hover:text-white"
                data-editor-field="contactText"
              >
                {contactText}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
