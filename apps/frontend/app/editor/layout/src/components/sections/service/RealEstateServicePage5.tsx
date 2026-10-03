"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type ServiceItem = {
  id?: string;
  title?: string;
  desc?: string;
  description?: string;
  image?: string;
};

const IMG = "/categories/realestate/template5";

const defaultServices: ServiceItem[] = [
  {
    id: "kitchen",
    title: "Kitchen",
    desc: "Modern and functional kitchen designs tailored to your lifestyle.",
    image: `${IMG}/kitchen_reno.png`,
  },
  {
    id: "bathroom",
    title: "Bathroom",
    desc: "Stylish and elegant bathroom solutions for your comfort.",
    image: `${IMG}/bathroom_reno.png`,
  },
  {
    id: "outdoors",
    title: "Outdoors",
    desc: "Beautiful outdoor spaces designed for relaxation.",
    image: `${IMG}/outdoors_reno.png`,
  },
  {
    id: "balcony",
    title: "Balcony",
    desc: "Creative balcony designs to enhance your outdoor living.",
    image: `${IMG}/outdoors_reno.png`,
  },
  {
    id: "home-office",
    title: "Home Office",
    desc: "Productive and comfortable home office space solutions.",
    image: `${IMG}/office_reno.png`,
  },
  {
    id: "building-construction",
    title: "Building Construction",
    desc: "Quality construction with safety compliance & durability.",
    image: `${IMG}/kitchen_reno.png`,
  },
  {
    id: "interior-designing",
    title: "Interior Designing",
    desc: "Innovative interior designs that bring your space to life.",
    image: `${IMG}/bathroom_reno.png`,
  },
  {
    id: "general-contracting",
    title: "General Contracting",
    desc: "End-to-end contracting services delivered with excellence.",
    image: `${IMG}/office_reno.png`,
  },
  {
    id: "architecture-design",
    title: "Architecture Design",
    desc: "Smart and sustainable architecture for the future.",
    image: `${IMG}/outdoors_reno.png`,
  },
  {
    id: "solar-power-energy",
    title: "Solar Power Energy",
    desc: "Efficient solar energy solutions for a greener tomorrow.",
    image: `${IMG}/hero_worker.png`,
  },
];

export default function RealEstateServicePage5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(
    data.pretitle || data.tagline || data.subtitle || "Our Services",
  );
  const title = String(data.title || "The Best Service For You");
  const description = String(
    data.description ||
      data.desc ||
      "We provide high-quality services tailored to your needs with expertise, reliability, and excellence.",
  );
  const readMoreLabel = String(
    data.readMoreLabel || data.readMoreText || "READ MORE",
  );
  const detailBase = String(data.detailBasePath || "/services").replace(
    /\/$/,
    "",
  );

  const services = (
    Array.isArray(data.services) && data.services.length
      ? data.services
      : Array.isArray(data.productItems) && data.productItems.length
        ? data.productItems
        : defaultServices
  ) as ServiceItem[];

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

  return (
    <section
      className="bg-[#f8f9fa] py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="services"
      data-editor-fields="accentColor pretitle title description readMoreLabel services detailBasePath"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-8 text-center">
          <div
            className="mb-4 text-[0.9rem] font-semibold tracking-[0.1em] text-[var(--accent)]"
            data-editor-field="pretitle"
          >
            {pretitle}
          </div>
          <h2
            className="mb-4 font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          {description ? (
            <p
              className="mx-auto max-w-[600px] text-base text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          data-box-layout-grid="grid"
        >
          {services.map((service, index) => {
            const serviceTitle = String(service.title || "Service");
            const serviceDesc = String(
              service.desc || service.description || "",
            );
            const href = `${detailBase}/${service.id || ""}`;
            return (
              <article
                key={service.id || `${serviceTitle}-${index}`}
                className="flex flex-col rounded-xl border border-[#eaeaea] bg-white p-4"
              >
                <div className="h-40 overflow-hidden rounded-lg">
                  <img
                    src={service.image || `${IMG}/kitchen_reno.png`}
                    alt={serviceTitle}
                    className="h-full w-full object-cover"
                    data-editor-media="image"
                    data-editor-media-type="image"
                  />
                </div>
                <div className="flex flex-1 flex-col px-2 pt-6 pb-2">
                  <h3
                    className="mb-3 text-[1.15rem] font-bold text-[#111]"
                    data-editor-field="title"
                  >
                    {serviceTitle}
                  </h3>
                  {serviceDesc ? (
                    <p
                      className="mb-6 flex-1 text-[0.9rem] leading-relaxed text-[#666]"
                      data-editor-field="desc"
                    >
                      {serviceDesc}
                    </p>
                  ) : (
                    <div className="mb-6 flex-1" />
                  )}
                  <Link
                    href={href}
                    onClick={(event) =>
                      handleNavigate(event, href, serviceTitle)
                    }
                    className="inline-flex w-fit items-center gap-2 rounded border border-[#e0e0e0] px-5 py-2.5 text-[0.75rem] font-bold tracking-wide text-[#333] no-underline transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    data-editor-field="readMoreLabel"
                  >
                    {readMoreLabel}
                    <span aria-hidden="true" className="text-[1.2em]">
                      →
                    </span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
