'use client';
import type { SectionProps } from "../../../types/section";
import React from 'react';
import { AboutUsData } from "../../../lib/applianceTypes";
import { ApplianceLink as Link } from "../../../lib/applianceLink";
import { FaArrowRight, FaCog, FaBullseye, FaLeaf, FaSnowflake } from 'react-icons/fa';

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'FaCog': return <FaCog />;
    case 'FaBullseye': return <FaBullseye />;
    case 'FaLeaf': return <FaLeaf />;
    case 'FaSnowflake': return <FaSnowflake />;
    default: return <FaCog />;
  }
};

export const AboutUsSection = ({ data, hideButton = false }: { data?: AboutUsData, hideButton?: boolean }) => {
  if (!data) return null;

  return (
    <section className="w-full py-16 lg:py-12 bg-[#f4f9fd] relative overflow-hidden">
      <div className="max-w-[1250px] mx-auto px-4 lg:px-8 relative z-10 flex flex-col lg:flex-row items-start gap-16 lg:gap-24">

        {/* Left Side: Image */}
        <div className="w-full lg:w-[38%] relative mt-10 lg:mt-0 flex-shrink-0 flex justify-center px-2 sm:px-0">
          <div className="relative w-[calc(100%-2rem)] sm:w-full aspect-[4/4.5] max-w-[400px] lg:max-w-[450px] mt-4 lg:mt-6 lg:ml-6">
            {/* Top Left Light Blue Shape */}
            <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 w-32 h-32 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-[var(--color-accent-light)] rounded-[20px] sm:rounded-[24px] z-0" />
            
            {/* Bottom Right Bright Blue Shape */}
            <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 w-32 h-32 sm:w-48 sm:h-48 lg:w-56 lg:h-56 bg-[var(--color-accent)] rounded-[20px] sm:rounded-[24px] z-0 rounded-bl-[40px] sm:rounded-bl-[50px]" />

            {/* Main Image */}
            <div className="relative z-10 w-full h-full rounded-[20px] sm:rounded-[24px] overflow-hidden border-[6px] sm:border-[10px] border-white shadow-md bg-gray-100">
              <img
                src={data.imageMain}
                alt={data.title1}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="w-full lg:w-[62%] flex flex-col items-start pt-0">

          {/* Subtitle */}
          <div className="flex items-center gap-4 mb-2">
            <div className="h-[2px] w-10 sm:w-12 bg-[var(--color-accent-light)]" />
            <h4 className="text-[var(--color-accent)] font-bold text-xs sm:text-sm uppercase tracking-widest">
              {data.subtitle}
            </h4>
            <div className="h-[2px] w-10 sm:w-12 bg-[var(--color-accent-light)]" />
          </div>

          {/* Title */}
          <h2 className="text-4xl sm:text-5xl lg:text-[46px] font-extrabold text-[var(--color-primary)] leading-tight mb-2 tracking-tight">
            {data.title1} <span className="text-[var(--color-accent)]">{data.title2}</span>
          </h2>

          {/* Double Wave SVG */}
          <svg width="60" height="16" viewBox="0 0 64 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
            <path d="M0 6c3 0 5 4 8 4s5-4 8-4 5 4 8 4 5-4 8-4 5 4 8 4 5-4 8-4 5 4 8 4 5-4 8-4" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 14c3 0 5 4 8 4s5-4 8-4 5 4 8 4 5-4 8-4 5 4 8 4 5-4 8-4 5 4 8 4 5-4 8-4" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          {/* Description */}
          <p className="text-gray-500 mb-6 leading-relaxed text-[14px] sm:text-[15px] max-w-[700px]">
            {data.description}
          </p>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mb-8">
            {data.features && data.features.map((feat) => (
              <div key={feat.id} className="border border-gray-100/80 rounded-xl p-4 flex items-center sm:items-start gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] bg-white">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#eaf4ff] flex items-center justify-center flex-shrink-0 text-[var(--color-accent)] text-3xl sm:text-[34px]">
                  {renderIcon(feat.icon || 'FaCog')}
                </div>
                <div className="flex-1 mt-1">
                  <h3 className="font-bold text-[15px] sm:text-[16px] text-[var(--color-primary)] mb-1 leading-snug">
                    {feat.title}
                  </h3>
                  {feat.description && (
                    <p className="text-gray-500 text-[12px] sm:text-[13px] leading-tight">
                      {feat.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Button */}
          {!hideButton && data.button && (
            <Link 
              href={data.button.url} 
              className="inline-flex items-center justify-center gap-3 bg-[var(--color-accent)] px-8 py-3 rounded-full text-[15px] font-bold text-white transition-all hover:brightness-95 hover:shadow-lg hover:shadow-blue-500/30"
            >
              {data.button.text}
              <FaArrowRight className="text-[13px]" />
            </Link>
          )}

        </div>
      </div>
    </section>
  );
};

export default function ServiceAbout1({ data = {} }: SectionProps) {
  return <AboutUsSection data={data as never} />;
}

