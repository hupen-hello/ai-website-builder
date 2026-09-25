"use client";

import Image from "next/image";
import { User, Search, Home, BadgeCheck } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import { resolveMediaSrc } from "../../../lib/resolveMediaSrc";

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") || /^https?:\/\//i.test(src);

export default function RealEstateAbout4({
  data = {},
}: SectionProps) {

  const features = Array.isArray(data.features)
    ? data.features
    : [
        {
          title: "Client First",
          desc: "Your goals are our<br/>top priority.",
          icon: "user",
        },
        {
          title: "Expert Guidance",
          desc: "Local expertise for<br/>smarter decisions.",
          icon: "search",
        },
        {
          title: "Trusted Service",
          desc: "Honesty, transparency<br/>and reliability.",
          icon: "home",
        },
        {
          title: "Seamless Process",
          desc: "From search to closing,<br/>we're with you.",
          icon: "badgeCheck",
        },
      ];

  const aboutImage = resolveMediaSrc(data.image, 2);

  const getIcon = (iconName: string) => {
    const props = { className: "w-6 h-6 text-[#0a8296]", strokeWidth: 1.5 };
    switch (iconName) {
      case "search":
        return <Search {...props} />;
      case "home":
        return <Home {...props} />;
      case "badgeCheck":
        return <BadgeCheck {...props} />;
      case "user":
      default:
        return <User {...props} />;
    }
  };

  return (
    <section
      data-editor-section-label="About Story"
      data-editor-fields="pretitle title desc image features"
      className="py-8 md:py-12 bg-white overflow-hidden relative"
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          
          {/* Left Column - Content */}
          <div className="lg:w-1/2">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-[#0a8296] font-bold tracking-wider uppercase text-sm">
                {data.pretitle ?? "ABOUT US"}
              </span>
              <div className="w-12 h-[2px] bg-[#0a8296]" />
            </div>
            
            <h2
              className="text-[2.75rem] md:text-5xl font-extrabold text-[#1a2b4c] mb-6 leading-[1.15]"
              dangerouslySetInnerHTML={{
                __html: data.title ?? "Turning houses into<br />dream homes",
              }}
            />
            
            <p className="text-gray-600 mb-12 text-base leading-relaxed max-w-lg font-medium">
              {data.desc ??
                "At Villa Estates, we believe finding the perfect home is about more than just property—it's about lifestyle, comfort, and lasting value. With deep market knowledge and a client-first approach, we make your journey smooth, transparent, and rewarding."}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
              {features.map((feature, idx) => {
                const item = feature as {
                  icon?: string;
                  title?: string;
                  desc?: string;
                };
                return (
                <div key={idx} className="flex gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#eef6f7] flex items-center justify-center shrink-0">
                    {getIcon(item.icon || "user")}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1a2b4c] mb-1.5 text-lg">
                      {item.title}
                    </h4>
                    <p
                      className="text-sm text-gray-500 leading-snug"
                      dangerouslySetInnerHTML={{ __html: item.desc || "" }}
                    />
                  </div>
                </div>
                );
              })}
            </div>
          </div>
          
          {/* Right Column - Image & Shapes */}
          <div className="lg:w-1/2 relative z-0 mt-12 lg:mt-0">
            {/* Background Shapes */}
            
            {/* Top Left Light Blue Shape */}
            <div className="absolute -top-8 -left-8 lg:-top-16 lg:-left-12 w-48 h-64 lg:w-64 lg:h-[22rem] bg-[#eef6f7] rounded-[2.5rem] -z-10" />
            
            {/* Bottom Right Light Blue Shape */}
            <div className="absolute -bottom-8 -right-8 lg:-bottom-12 lg:-right-16 w-64 h-48 lg:w-[22rem] lg:h-64 bg-[#eef6f7] rounded-[2.5rem] -z-10" />
            
            {/* Top Right Dots */}
            <div className="absolute -top-6 -right-6 lg:-top-10 lg:-right-12 -z-10 text-[#0a8296]/40">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <pattern id="dots-tr" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2.5" cy="2.5" r="2.5" fill="#0a8296" opacity="0.5" />
                </pattern>
                <rect width="120" height="120" fill="url(#dots-tr)" />
              </svg>
            </div>
            
            {/* Bottom Left Dots */}
            <div className="absolute -bottom-6 -left-6 lg:-bottom-10 lg:-left-12 -z-10 text-[#0a8296]/40">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <pattern id="dots-bl" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2.5" cy="2.5" r="2.5" fill="#0a8296" opacity="0.5" />
                </pattern>
                <rect width="120" height="120" fill="url(#dots-bl)" />
              </svg>
            </div>

            {/* Main Image */}
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl w-full aspect-[4/3]">
              <Image
                src={aboutImage}
                alt="Luxurious modern house at dusk"
                fill
                unoptimized={bypassImageOptimization(aboutImage)}
                className="object-cover"
                data-editor-media
                data-editor-media-type="image"
                data-editor-media-src={aboutImage}
              />
            </div>
            
          </div>
          
        </div>
      </div>
    </section>
  );
}
