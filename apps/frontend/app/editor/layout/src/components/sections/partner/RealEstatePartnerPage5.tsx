"use client";

import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type PartnerItem = {
  id?: string;
  name?: string;
  image?: string;
  filename?: string;
};

const IMG = "/categories/realestate/template5/partners";

const defaultPartners: PartnerItem[] = [
  { id: "p1", name: "Prestige", image: `${IMG}/prestige.png` },
  { id: "p2", name: "Mahindra", image: `${IMG}/mahindra.png` },
  { id: "p3", name: "Godrej", image: `${IMG}/godrej.png` },
  { id: "p4", name: "DLF", image: `${IMG}/dlf.png` },
  { id: "p5", name: "Prestige", image: `${IMG}/prestige.png` },
  { id: "p6", name: "Mahindra", image: `${IMG}/mahindra.png` },
  { id: "p7", name: "Godrej", image: `${IMG}/godrej.png` },
  { id: "p8", name: "DLF", image: `${IMG}/dlf.png` },
  { id: "p9", name: "Prestige", image: `${IMG}/prestige.png` },
  { id: "p10", name: "Mahindra", image: `${IMG}/mahindra.png` },
  { id: "p11", name: "Godrej", image: `${IMG}/godrej.png` },
  { id: "p12", name: "DLF", image: `${IMG}/dlf.png` },
];

export default function RealEstatePartnerPage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(data.pretitle || data.subtitle || "OUR PARTNERS");
  const title = String(
    data.title || "Building Strong Partnerships for Better Living",
  );
  const description = String(
    data.description ||
      data.desc ||
      "We collaborate with industry-leading organizations and trusted brands to deliver excellence in real estate.",
  );
  const logoBasePath = String(
    data.logoBasePath || IMG,
  ).replace(/\/$/, "");

  const partners = (
    Array.isArray(data.partners) && data.partners.length
      ? data.partners
      : defaultPartners
  ) as PartnerItem[];

  return (
    <section
      className="bg-white py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="partners"
      data-editor-fields="accentColor pretitle title description partners"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-6 text-center">
          <div
            className="mb-4 text-[0.9rem] font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
            data-editor-field="pretitle"
          >
            {pretitle}
          </div>
          <h2
            className="mx-auto mb-6 max-w-[600px] font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          <div className="mx-auto mb-8 flex items-center justify-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
          {description ? (
            <p
              className="mx-auto max-w-[600px] text-base leading-relaxed text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div
          className="mb-[60px] grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-md:grid-cols-2 max-md:gap-4"
          data-box-layout-grid="grid"
        >
          {partners.map((partner, index) => {
            const name = String(partner.name || "Partner");
            const image =
              partner.image ||
              (partner.filename
                ? `${logoBasePath}/${partner.filename}`
                : `${IMG}/prestige.png`);
            return (
              <div
                key={partner.id || `${name}-${index}`}
                className="flex h-[140px] items-center justify-center rounded-lg border border-[#eaeaea] bg-white px-6 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.01)] max-md:h-[100px] max-md:px-3"
              >
                <img
                  src={image}
                  alt={name}
                  className="h-full w-full scale-[1.2] object-contain max-md:scale-100"
                  data-editor-media="image"
                  data-editor-media-type="image"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
