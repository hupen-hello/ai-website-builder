"use client";
import type { SectionProps } from "../../../types/section";
import React from 'react';
import { ServicesData } from "../../../lib/applianceTypes";
import { ApplianceLink as Link } from "../../../lib/applianceLink";
import { FaArrowRight } from 'react-icons/fa';
import { handleManagerCardClick } from "../../../lib/editorManagerCards";

type ServiceCard = ServicesData["services"][number] & { showOnHome?: boolean; slug?: string; desc?: string };

export const ServicesSection = ({ data, hideButton = false, globalUI, editorMode }: { data?: ServicesData, hideButton?: boolean, globalUI?: Record<string, string>, editorMode?: boolean }) => {
  if (!data) return null;

  const source = data as ServicesData & { productItems?: Array<Record<string, string>> };
  const services: ServiceCard[] = Array.isArray(source.services) && source.services.length
    ? source.services
    : (source.productItems || []).map((item) => ({
        id: item.id || item.slug || item.title,
        title: item.title || "",
        description: item.desc || item.description || "",
        image: item.image || "",
        icon: "",
        url: item.slug ? `/services/${item.slug}` : "/services",
        showOnHome: item.showOnHome !== false && item.showOnHome !== "false",
        slug: item.slug,
      }));
  const visibleServices = services.filter((service) => hideButton || service.showOnHome !== false);

  return (
    <section className="w-full py-16 lg:py-12 bg-white relative">
      <div className="max-w-[1250px] mx-auto px-4 md:px-6 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12 lg:mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-[2px] bg-[var(--color-accent-light)]" />
            <h4 className="text-[var(--color-accent)] font-bold text-xs sm:text-sm tracking-widest uppercase">
              {data.subtitle}
            </h4>
            <div className="w-12 h-[2px] bg-[var(--color-accent-light)]" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-[46px] font-extrabold text-[var(--color-primary)] leading-tight mb-4">
            {data.title1}{' '}
            <span className="text-[var(--color-accent)]">{data.title2}</span>{' '}
            {data.title3}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-[15px] sm:text-base leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {visibleServices.map((service) => (
            <Link key={service.id} href={service.url} data-editor-no-inline="true" onClick={(event) => handleManagerCardClick(event, editorMode, "Services", { id: service.id, slug: service.slug || service.id, title: service.title, href: service.url, image: service.image })} className="relative bg-white rounded-2xl border border-gray-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col group p-3 sm:p-4 cursor-pointer">
              <span className="absolute inset-0 z-20" aria-hidden="true" />
              <div className="relative w-full h-48 sm:h-52 overflow-hidden rounded-xl">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-col flex-grow pt-5 sm:pt-6 px-1 sm:px-2 bg-white z-10">
                <h3 className="text-[19px] sm:text-[20px] font-extrabold text-[var(--color-primary)] mb-3 leading-snug group-hover:text-[var(--color-accent)] transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-[14px] leading-relaxed mb-6 flex-grow">
                  {service.description}
                </p>
                <div className="flex items-center gap-2 w-fit group/link mt-auto">
                  <span className="text-[var(--color-accent)] font-bold text-[15px]">{globalUI?.readMoreText || 'Read More'}</span>
                  <FaArrowRight className="text-[var(--color-accent)] text-[13px] group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View More Button (if any) */}
        {!hideButton && data.button && (
          <div className="flex justify-center mt-8 lg:mt-12">
            <Link
              href={data.button.url}
              className="inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] px-8 py-3.5 rounded-full text-[15px] font-bold text-white transition-all hover:brightness-95 hover:shadow-lg hover:shadow-blue-500/30"
            >
              {data.button.text.replace('->', '').trim()}
              <FaArrowRight className="text-[13px]" />
            </Link>
          </div>
        )}

      </div>
    </section>
  );
};

export default function ServiceSection1({ data = {}, editorMode }: SectionProps) {
  return <ServicesSection data={data as never} editorMode={editorMode} />;
}

