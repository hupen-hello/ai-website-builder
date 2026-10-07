'use client';
import type { SectionProps } from "../../../types/section";
import React from 'react';
import { AboutUsData } from "../../../lib/applianceTypes";
import { FaPhoneAlt } from 'react-icons/fa';

export const AboutFirmSection = ({ data, hideButton = false }: { data?: AboutUsData, hideButton?: boolean }) => {
  if (!data) return null;

  return (
    <section className="w-full py-20 lg:py-12 bg-[#fcfdff] relative overflow-hidden">
      <div className="max-w-[1250px] mx-auto px-4 lg:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Left Side: Content */}
        <div className="w-full lg:w-[50%] flex flex-col items-start pt-0">

          {/* Subtitle Line */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-[2px] w-8 bg-[var(--color-accent)]" />
            <h4 className="text-[var(--color-accent)] font-bold text-[14px] uppercase tracking-wide">
              {data.subtitle}
            </h4>
          </div>

          {/* Subtitle 2 */}
          {data.subtitle2 && (
            <p className="text-gray-600 text-[18px] mb-2">{data.subtitle2}</p>
          )}

          {/* Title */}
          <h2 className="text-5xl lg:text-6xl font-bold text-[var(--color-primary)] leading-tight mb-6">
            {data.title1} {data.title2}
          </h2>

          {/* Description */}
          <p className="text-[#4a5568] leading-relaxed text-[16px] mb-8">
            {data.description}
          </p>

          {/* Bullets */}
          <div className="flex flex-col gap-4 mb-10">
            {data.features?.map((feat) => (
              <div key={feat.id} className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] mt-2 shrink-0 shadow-[0_0_8px_rgba(0,123,255,0.5)]"></div>
                <p className="text-[#1a202c] font-medium text-[15px]">{feat.title}</p>
              </div>
            ))}
          </div>

          {/* Phone */}
          {data.phone && (
            <div className="flex items-center gap-3">
              <FaPhoneAlt className="text-[var(--color-accent)] text-xl" />
              <span className="text-[var(--color-primary)] font-bold text-2xl tracking-wide">
                {data.phone}
              </span>
            </div>
          )}

        </div>

        {/* Right Side: Image */}
        <div className="w-full lg:w-[50%] relative mt-10 lg:mt-0 px-2 sm:px-4 lg:px-0">
          <div className="relative w-full aspect-[4/3] rounded-[20px] sm:rounded-[24px] overflow-hidden">
            <img
              src={data.imageMain}
              alt="About Us"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Floating Badge */}
          {(data.yearsOfService || data.yearsText) && (
            <div className="absolute bottom-4 -left-2 sm:bottom-6 sm:-left-6 lg:-left-8 bg-white rounded-xl sm:rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-4 sm:p-6 px-6 sm:px-8 flex flex-col justify-center border border-gray-50 z-20">
              <h3 className="text-[var(--color-primary)] font-extrabold text-[32px] sm:text-[42px] leading-none mb-1">
                {data.yearsOfService}
              </h3>
              <p className="text-gray-500 font-medium text-[13px] sm:text-[15px]">
                {data.yearsText}
              </p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default function ServiceAboutPage({ data = {} }: SectionProps) {
  return (
    <AboutFirmSection
      data={data as never}
      hideButton={Boolean((data as { hideButton?: boolean }).hideButton)}
    />
  );
}

