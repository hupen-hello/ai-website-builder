"use client";

import React from "react";
import { Home, Map, Users, HeartHandshake, Award } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import { resolveMediaSrc } from "../../../lib/resolveMediaSrc";

interface StatItem {
  value: string;
  title: string;
  desc?: string;
  icon?: string;
  [key: string]: any;
}

export default function RealEstateFeatures4({ data = {} }: SectionProps) {
  const content = (data || {}) as any;

  const defaultStats: StatItem[] = [
    {
      value: "850",
      title: "Premium Properties",
      desc: "Carefully curated<br/>for you",
      icon: "home",
    },
    {
      value: "57",
      title: "Locations Listed In",
      desc: "Prime & emerging<br/>areas covered",
      icon: "map",
    },
    {
      value: "35",
      title: "Happy Clients",
      desc: "Trusted by many<br/>satisfied buyers",
      icon: "users",
    },
    {
      value: "18",
      title: "Years of Trust",
      desc: "Building relationships<br/>that last",
      icon: "heartHandshake",
    },
  ];

  const statsList: StatItem[] =
    Array.isArray(content.stats) && content.stats.length > 0
      ? content.stats
      : defaultStats;

  const backgroundImage = resolveMediaSrc(content.backgroundImage, 3);

  const getIcon = (iconName?: string) => {
    const props = { className: "w-7 h-7 md:w-9 md:h-9 text-white shrink-0" };
    switch (iconName?.toLowerCase()) {
      case "map":
        return <Map {...props} />;
      case "users":
        return <Users {...props} />;
      case "hearthandshake":
      case "handshake":
      case "heart":
        return <HeartHandshake {...props} />;
      case "award":
        return <Award {...props} />;
      case "home":
      default:
        return <Home {...props} />;
    }
  };

  return (
    <section
      className="relative py-12 md:py-16 bg-cover bg-center text-white overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
      data-editor-section-label="Features & Stats"
    >
      {/* Dark Navy / Blue Overlay */}
      <div className="absolute inset-0 bg-[#0c1e33]/90 bg-gradient-to-r from-[#0a192c]/95 via-[#0e243d]/90 to-[#0a192c]/95" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0"
          data-box-layout-grid="grid"
        >
          {statsList.map((stat, idx) => {
            const displayTitle = stat.title || stat.label || "";
            const displayValue = stat.value || stat.stat || "";
            const displayDesc = stat.desc || stat.description || "";

            return (
              <div
                key={idx}
                className={`flex flex-col px-4 lg:px-8 ${
                  idx !== 0 ? "lg:border-l lg:border-white/15" : ""
                }`}
              >
                {/* Icon + Number Row */}
                <div className="flex items-center gap-3 mb-2">
                  {getIcon(stat.icon)}
                  <span
                    className="text-4xl md:text-5xl font-bold tracking-tight text-white"
                    data-editor-field="value"
                  >
                    {String(displayValue)}
                  </span>
                </div>

                {/* Subtitle / Title */}
                <h3
                  className="text-[#00c5c8] text-base md:text-[17px] font-semibold tracking-wide mb-1"
                  data-editor-field="title"
                >
                  {String(displayTitle)}
                </h3>

                {/* Description */}
                {displayDesc && (
                  <div
                    className="text-gray-300/80 text-xs md:text-sm leading-relaxed"
                    data-editor-field="desc"
                    dangerouslySetInnerHTML={{
                      __html: String(displayDesc),
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
