"use client";
import type { SectionProps } from "../../../types/section";
import React from 'react';
import { HeroData } from "../../../lib/applianceTypes";
import { ApplianceLink as Link } from "../../../lib/applianceLink";
import { FaArrowRight } from 'react-icons/fa';

export const HeroSection = ({ data }: { data?: HeroData }) => {
  if (!data) return null;

  return (
    <section className="relative w-full overflow-hidden flex items-center min-h-[400px] lg:min-h-[450px]">

      {/* Full Background Image */}
      <img
        src={data.image1}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 z-0 w-full h-full object-cover object-center"
      />
      {/* Mobile Overlay to make text visible */}
      <div className="absolute inset-0 z-[1] bg-white/80 lg:hidden" />

      {/* Content Overlay */}
      <div className="relative z-10 mx-auto w-full max-w-[1250px] px-4 py-10 sm:px-8 lg:py-24">
        <div className="w-full max-w-[600px]">

          {/* Subtitle */}
          <div className="mb-6 flex items-center gap-4">
            <div className="h-[2px] w-8 shrink-0 bg-[var(--color-accent)] sm:w-12" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 sm:text-sm">
              {data.subtitle}
            </h2>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[var(--color-primary)] sm:text-5xl lg:text-[56px]">
            <span className="block">{data.title1}</span>
            <span className="block text-[var(--color-accent)]">{data.title2}</span>
          </h1>

          {/* Description */}
          <p className="mb-10 max-w-[500px] text-[15px] leading-relaxed text-gray-600 sm:text-lg">
            {data.description}
          </p>

          {/* Button */}
          {data.button && (
            <Link
              href={data.button.url}
              className="inline-flex items-center justify-center gap-3 rounded-full bg-[var(--color-accent)] px-8 py-3.5 text-[15px] font-bold text-white transition-all hover:brightness-95 hover:shadow-lg hover:shadow-blue-500/30"
            >
              {data.button.text}
              <FaArrowRight className="text-sm" />
            </Link>
          )}

        </div>
      </div>
    </section>
  );
};

export default function ServiceBanner1({ data = {} }: SectionProps) {
  return <HeroSection data={data as never} />;
}

