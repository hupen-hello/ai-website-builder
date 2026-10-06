"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import InlineRichText from "../../builder/InlineRichText";
import { handleManagerCardClick } from "../../../lib/editorManagerCards";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ServicesEvent1({ data = {}, editorMode }: SectionProps) {
  const eventItems = Array.isArray(data.items) ? data.items : [];
  const productItems = Array.isArray(data.productItems) ? data.productItems : [];
  const source = eventItems.length ? eventItems : productItems;
  const rawItems = source
    .filter((item) => item.active !== false)
    .map((item, index) => {
      const title = String(item.title || item.productTitle || "");
      const tags = Array.isArray(item.tags)
        ? item.tags.map((tag) => String(tag))
        : item.category
          ? [String(item.category)]
          : item.productSubtitle
            ? [String(item.productSubtitle)]
            : [];
      return {
        title,
        image: String(item.image || ""),
        tags,
        description: String(
          item.description ||
            item.desc ||
            item.productInfoDesc ||
            tags.join(", "),
        ),
        slug: String(item.slug || slugify(title) || `service-${index + 1}`),
        id: typeof item.id === "string" ? item.id : undefined,
      };
    });

  return (
    <section className="py-12 lg:py-12 bg-white relative">
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px]">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8 lg:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4 mb-6"
          >
            <h5 className="text-[#6b3c9b] font-bold tracking-[0.2em] text-xs sm:text-sm uppercase flex items-center justify-center gap-6">
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>
              <span data-editor-inline-format-key="event-services:subtitle">
                <InlineRichText value={String(data.subtitle || "")} formatKey="event-services:subtitle" />
              </span>
              <span className="w-12 h-[2px] bg-[#6b3c9b]/40"></span>
            </h5>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif leading-[1.15] mb-6 text-[#15072b]"
            data-editor-inline-format-key="event-services:title"
          >
            <InlineRichText value={String(data.title || "")} formatKey="event-services:title" />
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-500 text-sm md:text-base leading-relaxed max-w-xl mx-auto"
            data-editor-inline-format-key="event-services:description"
          >
            <InlineRichText value={String(data.description || "")} formatKey="event-services:description" />
          </motion.p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {rawItems.slice(0, 6).map((item, idx) => {
            const href = `/services/${item.slug}`;
            return (
              <Link
                href={href}
                key={`${item.slug}-${idx}`}
                data-editor-no-inline="true"
                className="relative block group cursor-pointer"
                onClick={(event) => {
                  handleManagerCardClick(event, editorMode, "Services", {
                    id: item.id,
                    slug: item.slug,
                    href,
                    title: item.title,
                  });
                }}
              >
                <span className="absolute inset-0 z-20" aria-hidden="true" />
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (idx % 3) * 0.1 }}
                  className="relative bg-[#0d0417] overflow-hidden h-[440px] rounded-tl-[40px] rounded-br-[80px]"
                >
                  <div className="absolute inset-0 w-full h-[75%] transition-transform duration-700 group-hover:scale-110">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-[#6b3c9b]/10 mix-blend-multiply"></div>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 bg-white rounded-tl-[32px] rounded-br-[40px] p-6 pt-10 z-10">
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-[#321654] text-white flex items-center justify-center rounded-[14px] shadow-lg group-hover:bg-[#6b3c9b] transition-colors duration-300">
                      <ArrowUpRight
                        size={24}
                        className="transition-transform duration-500 group-hover:rotate-[360deg]"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-[#15072b] leading-snug mb-3">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 text-base leading-relaxed font-medium">
                      {(item.tags || []).join(", ")}
                    </p>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
