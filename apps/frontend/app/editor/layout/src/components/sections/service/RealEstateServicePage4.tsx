"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { servicePage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import { WebsiteIcon } from "../../../lib/websiteIcons";
import type {
  ServicePage4Data,
  ServicePage4Item,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

function ServiceCard({
  service,
  readMoreLabel,
}: {
  service: ServicePage4Item;
  readMoreLabel: string;
}) {
  return (
    <article className="group flex h-full flex-col rounded-[24px] border border-gray-100 bg-white p-3 pb-6 shadow-sm">
      <div className="relative mb-6 h-64 overflow-hidden rounded-2xl">
        <img
          src={service.image}
          alt={service.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          data-editor-media="image"
          data-editor-media-type="image"
        />
        <div className="absolute left-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm md:rounded-2xl lg:rounded-full">
          <WebsiteIcon
            name={service.icon || "Home"}
            className="h-6 w-6 text-gray-700"
          />
        </div>
      </div>

      <div className="flex flex-grow flex-col px-3">
        <h4
          className="mb-8 text-xl font-bold leading-snug text-secondary"
          data-editor-field="title"
        >
          {service.title}
        </h4>

        <div className="mt-auto">
          <div className="group/btn flex cursor-pointer items-center justify-between rounded-full border border-gray-200 py-1.5 pl-5 pr-1.5 transition-colors hover:border-[var(--accent)]">
            <span className="text-sm font-medium tracking-wide text-gray-400 transition-colors group-hover/btn:text-[var(--accent)]">
              {readMoreLabel}
            </span>
            <Link
              href={`/template4/services/${service.id}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
              aria-label={`Read more about ${service.title}`}
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function RealEstateServicePage4({ data = {} }: SectionProps) {
  const authored = servicePage4Content.RealEstateServicePage4;
  const content: ServicePage4Data = {
    ...authored,
    ...(data as ServicePage4Data),
  };
  const services = content.services?.length
    ? content.services
    : (authored.services ?? []);
  const readMoreLabel = content.readMoreLabel ?? "Read more";

  return (
    <section
      className="bg-gray-50 py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="services"
      data-editor-fields="accentColor readMoreLabel services"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          data-box-layout-grid="grid"
        >
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              readMoreLabel={readMoreLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
