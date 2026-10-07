'use client';
import type { SectionProps } from "../../../types/section";
import React, { useState } from 'react';
import { FaqData } from "../../../lib/applianceTypes";
import { FaChevronDown, FaChevronUp, FaCog, FaSnowflake, FaWind } from 'react-icons/fa';

export const FaqSection = ({ data }: { data?: FaqData }) => {
  const [openIndex, setOpenIndex] = useState<number>(0);

  if (!data) return null;

  return (
    <section className="w-full py-20 lg:py-12 bg-white relative overflow-hidden">

      {/* Background Soft Curves */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-[#f0f7ff]">
          <path d="M0,0 C30,40 70,60 100,0 L100,100 L0,100 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="max-w-[1250px] mx-auto px-4 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-[2px] w-8 bg-[var(--color-accent)]" />
            <h4 className="text-[var(--color-accent)] font-bold text-[14px] uppercase tracking-widest">
              {data.subtitle}
            </h4>
            <div className="h-[2px] w-8 bg-[var(--color-accent)]" />
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-[var(--color-primary)] mb-4">
            {data.title1} <span className="text-[var(--color-accent)]">{data.title2}</span>
          </h2>
          <p className="text-[#4a5568] text-[16px] max-w-2xl mx-auto">
            {data.description}
          </p>
        </div>

        {/* Content Layout */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left: Accordion */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {data.faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white shadow-[0_10px_30px_rgba(0,0,0,0.05)]' : 'bg-transparent'
                    }`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-xl border transition-colors ${isOpen ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'bg-white border-[#e2e8f0] hover:border-[var(--color-accent)]'
                      }`}
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isOpen ? 'bg-[var(--color-accent)] text-white' : 'bg-[#eaf4ff] text-[var(--color-accent)]'
                        }`}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <span className={`font-bold text-[15px] sm:text-[16px] ${isOpen ? 'text-white' : 'text-[var(--color-primary)]'
                        }`}>
                        {faq.question}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 ${isOpen ? 'text-[var(--color-accent)]' : 'border border-[#e2e8f0] text-[#a0aec0]'
                      }`}>
                      {isOpen ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
                    </div>
                  </button>

                  {/* Answer */}
                  <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100 p-5 px-6' : 'max-h-0 opacity-0 p-0 px-6 overflow-hidden'}`}>
                    <p className="text-gray-500 text-[15px] leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Image & Badges */}
          <div className="w-full lg:w-1/2 relative flex justify-center mt-10 lg:mt-0">
            {/* Dashed outer ring */}
            <div className="absolute inset-0 m-auto w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full border-2 border-dashed border-[var(--color-accent)]/30 -z-10 animate-[spin_60s_linear_infinite]" />

            {/* Solid inner blue ring */}
            <div className="absolute inset-0 m-auto w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] rounded-full border-[8px] border-[var(--color-accent)] -z-10" />

            {/* Main Circle Image */}
            <div className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full overflow-hidden border-8 border-white shadow-2xl relative z-0">
              <img
                src={data.image}
                alt="FAQ Technician"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Badges */}
            <div className="absolute top-10 right-4 sm:top-12 sm:right-12 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-[var(--color-accent)] text-2xl z-20">
              <FaSnowflake />
            </div>

            <div className="absolute top-1/4 -left-4 sm:-left-2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-[var(--color-primary)] text-2xl z-20">
              <FaCog />
            </div>

            <div className="absolute bottom-16 -left-2 sm:bottom-20 sm:left-4 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-[var(--color-accent)] text-2xl z-20">
              <FaWind />
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default function ServiceFaq1({ data = {} }: SectionProps) {
  return <FaqSection data={data as never} />;
}

