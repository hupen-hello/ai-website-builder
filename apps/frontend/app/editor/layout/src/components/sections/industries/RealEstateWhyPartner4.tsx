"use client";

import { industriesPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import { WebsiteIcon } from "../../../lib/websiteIcons";
import type {
  WhyPartner4Data,
  WhyPartner4Item,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const defaultReasons: WhyPartner4Item[] = [
  {
    id: "expertise",
    icon: "ShieldCheck",
    title: "Industry Expertise",
    description:
      "Deep knowledge of diverse industries and their real estate requirements.",
  },
  {
    id: "solutions",
    icon: "Handshake",
    title: "Tailored Solutions",
    description:
      "Customized real estate strategies that align with your business goals.",
  },
  {
    id: "track-record",
    icon: "TrendingUp",
    title: "Proven Track Record",
    description:
      "Successful projects delivered across multiple sectors with excellence.",
  },
  {
    id: "support",
    icon: "UserCheck",
    title: "End-to-End Support",
    description:
      "From consultation to delivery, we're with you at every step of the journey.",
  },
];

export default function RealEstateWhyPartner4({ data = {} }: SectionProps) {
  const authored = industriesPage4Content.RealEstateWhyPartner4;
  const content: WhyPartner4Data = {
    ...authored,
    ...(data as WhyPartner4Data),
  };
  const reasons = content.reasons?.length
    ? content.reasons
    : (authored.reasons ?? defaultReasons);

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="whyPartner"
      data-editor-fields="accentColor title reasons"
    >
      <div className="container mx-auto px-4">
        <div className="mb-16 flex items-center justify-center gap-4">
          <div className="h-px max-w-[200px] flex-1 bg-gray-200" />
          <h3
            className="text-center text-sm font-bold uppercase tracking-widest text-secondary"
            data-editor-field="title"
          >
            {content.title ?? "Why Partner With Us?"}
          </h3>
          <div className="h-px max-w-[200px] flex-1 bg-gray-200" />
        </div>

        <div
          className="grid grid-cols-1 gap-12 text-center md:grid-cols-2 lg:grid-cols-4"
          data-box-layout-grid="grid"
        >
          {reasons.map((reason, index) => {
            return (
              <article
                key={reason.id ?? `${reason.title}-${index}`}
                className="group flex flex-col items-center"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-50 text-[var(--accent)] transition-colors duration-300 group-hover:bg-[var(--accent)] group-hover:text-white">
                  <WebsiteIcon name={reason.icon || "ShieldCheck"} className="h-8 w-8" />
                </div>
                <h4
                  className="mb-3 font-bold text-secondary"
                  data-editor-field="title"
                >
                  {reason.title}
                </h4>
                <p
                  className="mx-auto max-w-[250px] text-sm leading-relaxed text-gray-500"
                  data-editor-field="description"
                >
                  {reason.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
