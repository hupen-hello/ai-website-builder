'use client';
import type { SectionProps } from "../../../types/section";
import React from 'react';
import { TeamData } from "../../../lib/applianceTypes";
import { FaPhoneAlt, FaLinkedinIn, FaSnowflake } from 'react-icons/fa';
import { handleManagerCardClick } from "../../../lib/editorManagerCards";

export const TeamSection = ({ data, editorMode }: { data?: TeamData, editorMode?: boolean }) => {
  if (!data) return null;

  return (
    <section className="w-full py-20 lg:py-12 bg-[#f0f7ff] relative overflow-hidden">
      {/* Soft background elements - Left */}
      <div className="absolute top-10 left-5 md:left-20 opacity-[0.04] pointer-events-none flex flex-col items-center gap-4">
        <FaSnowflake className="text-[var(--color-accent)] text-[100px] md:text-[140px]" />
        <svg width="150" height="60" viewBox="0 0 150 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-[var(--color-accent)] ml-10">
          <path d="M10,20 Q30,5 50,20 T100,20" />
          <path d="M0,40 Q20,25 40,40 T90,40" />
        </svg>
      </div>

      {/* Soft background elements - Right */}
      <div className="absolute top-20 right-5 md:right-20 opacity-[0.04] pointer-events-none flex flex-col items-center gap-6">
        <FaSnowflake className="text-[var(--color-accent)] text-[120px] md:text-[180px]" />
        <svg width="150" height="60" viewBox="0 0 150 60" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-[var(--color-accent)] mr-16">
          <path d="M20,15 Q40,0 60,15 T110,15" />
          <path d="M30,35 Q50,20 70,35 T120,35" />
        </svg>
      </div>

      <div className="max-w-[1250px] mx-auto px-4 lg:px-8 relative z-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <h4 className="text-[var(--color-accent)] font-bold text-[14px] uppercase tracking-widest mb-3">
            {data.subtitle}
          </h4>
          <h2 className="text-4xl lg:text-5xl font-bold text-[var(--color-primary)] mb-4">
            {data.title1} {data.title2}
          </h2>
          <p className="text-[#4a5568] text-[16px] max-w-2xl mx-auto mb-6">
            {data.description}
          </p>

          {/* Decorative Squiggly Line */}
          <div className="flex flex-col gap-[2px]">
            <svg width="48" height="8" viewBox="0 0 48 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4C4.5 4 6 1 9.5 1C13 1 14.5 7 18 7C21.5 7 23 4 25.5 4C28 4 29.5 1 33 1C36.5 1 38 7 41.5 7C45 7 46.5 4 48 4" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <svg width="48" height="8" viewBox="0 0 48 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4C4.5 4 6 1 9.5 1C13 1 14.5 7 18 7C21.5 7 23 4 25.5 4C28 4 29.5 1 33 1C36.5 1 38 7 41.5 7C45 7 46.5 4 48 4" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <svg width="48" height="8" viewBox="0 0 48 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 4C4.5 4 6 1 9.5 1C13 1 14.5 7 18 7C21.5 7 23 4 25.5 4C28 4 29.5 1 33 1C36.5 1 38 7 41.5 7C45 7 46.5 4 48 4" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.members.filter((member) => (member as { showOnHome?: boolean }).showOnHome !== false).map((member) => (
            <div key={member.id} data-editor-no-inline="true" className="relative bg-white rounded-[16px] sm:rounded-[24px] overflow-hidden border-2 border-[#cde5fb] flex flex-col group hover:border-[var(--color-accent)] hover:shadow-xl transition-all duration-300">
              <button
                type="button"
                className="absolute inset-0 z-20 cursor-pointer"
                onClick={(event) =>
                  handleManagerCardClick(event, editorMode, "Teams", {
                    id: member.id,
                    title: member.name,
                    image: member.image,
                  })
                }
              >
                <span className="absolute inset-0" aria-hidden="true" />
              </button>
              {/* Image Section - Blue Background */}
              <div className="bg-[#e4f1fc] pt-8 px-4 flex justify-center relative overflow-hidden h-[260px] sm:h-[300px]">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-auto h-full object-cover object-bottom relative z-10 transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Info Section - White Background */}
              <div className="p-6 text-center bg-white flex flex-col items-center">
                <h3 className="text-[var(--color-primary)] font-extrabold text-[20px] mb-1">
                  {member.name}
                </h3>
                <p className="text-[var(--color-accent)] text-[15px] font-semibold mb-5">
                  {member.role}
                </p>

                {/* Social Icons */}
                <div className="flex items-center gap-3">
                  <a href={member.phone} className="w-[38px] h-[38px] rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                    <FaPhoneAlt className="text-[14px]" />
                  </a>
                  <a href={member.linkedin} className="w-[38px] h-[38px] rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white hover:opacity-80 transition-opacity">
                    <FaLinkedinIn className="text-[16px]" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default function ServiceTeam1({ data = {}, editorMode }: SectionProps) {
  return <TeamSection data={data as never} editorMode={editorMode} />;
}

