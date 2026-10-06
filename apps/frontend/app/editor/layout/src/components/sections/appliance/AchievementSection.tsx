"use client";
import React from 'react';
import { AchievementData } from './applianceTypes';
import { FaUsers, FaAward, FaHardHat, FaHome, FaSnowflake } from 'react-icons/fa';

const renderIcon = (iconName: string) => {
  switch (iconName) {
    case 'FaUsers': return <FaUsers />;
    case 'FaAward': return <FaAward />;
    case 'FaUserTie': return <FaHardHat />;
    case 'FaHome': return <FaHome />;
    case 'MdAir': return <FaSnowflake />;
    default: return <FaUsers />;
  }
};

export const AchievementSection = ({ data }: { data?: AchievementData }) => {
  if (!data) return null;

  return (
    <section className="w-full py-16 lg:py-12 relative overflow-hidden bg-white">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img
          src={data.bgImage}
          alt="Achievements Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-[1250px] mx-auto px-4 md:px-6 relative z-10">

        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-12 lg:mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-[2px] bg-[#70b5f9]" />
            <h4 className="text-[var(--color-accent)] font-bold text-xs sm:text-sm tracking-widest uppercase">
              {data.subtitle}
            </h4>
            <div className="w-12 h-[2px] bg-[#70b5f9]" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-[46px] font-extrabold text-[var(--color-primary)] leading-tight mb-4">
            {data.title1} <span className="text-[var(--color-accent)]">{data.title2}</span> {data.title3}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-[15px] sm:text-base leading-relaxed">
            {data.description}
          </p>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {data.achievements.map((item) => (
            <div key={item.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center justify-center p-6 sm:p-8 text-center group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-3xl sm:text-4xl mb-6 shadow-md">
                {renderIcon(item.icon)}
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-accent)] mb-2">
                {item.value}
              </h3>
              <p className="text-[var(--color-primary)] font-bold text-[14px] sm:text-[15px]">
                {item.label}
              </p>
              <div className="h-[2px] w-8 bg-[#70b5f9] mt-4" />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
