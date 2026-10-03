"use client";

import React from "react";
import type { SectionProps } from "../../../types/section";
import Link from "next/link";
import { motion } from "framer-motion";
import { mergeEventData } from "../about/eventPageDefaults";

export interface SitemapGroup {
  id: string;
  title: string;
  links: { label: string; href: string }[];
}

export interface SitemapData {
  groups: SitemapGroup[];
}

export default function SitemapEvent1({ data = {} }: SectionProps) {
  data = mergeEventData(data, "sitemap", "Sitemap", "SitemapEvent1");
  const groups = Array.isArray(data.groups) ? data.groups : [];
  return (
    <section className="py-10 lg:py-12 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        
        <div className="flex flex-wrap border-t border-l border-gray-200 mt-8">
          {groups.map((group, idx) => {
            // lg: 5 items per row for first 10, then 3 items per row
            // md: 3 items per row
            // sm: 2 items per row
            // We use standard classes and custom w- based on index for lg
            
            let widthClass = "w-full sm:w-1/2 md:w-1/3";
            if (idx < 10) {
              widthClass += " lg:w-1/5";
            } else {
              widthClass += " lg:w-1/3";
            }

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (idx % 5) * 0.1 }}
                className={`
                  ${widthClass}
                  relative py-8 lg:py-10
                  border-b border-r border-gray-200
                `}
              >
                <div className="flex items-center gap-2 mb-8 px-6 lg:px-8">
                  <span className="text-[#6b3c9b] font-bold text-lg tracking-wide">{group.id}.</span>
                  <h3 className="text-[#6b3c9b] font-bold tracking-widest text-sm uppercase">
                    {group.title}
                  </h3>
                </div>
                
                <ul className="space-y-4 px-6 lg:px-8">
                  {group.links.map((link, linkIdx) => (
                    <li key={linkIdx} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-[#6b3c9b] rounded-full shrink-0"></span>
                      <Link 
                        href={link.href}
                        className="text-slate-700 font-semibold hover:text-[#6b3c9b] transition-colors text-[13px]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  );
}
