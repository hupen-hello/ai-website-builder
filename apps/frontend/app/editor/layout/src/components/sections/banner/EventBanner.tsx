"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import Link from "next/link";
import { motion } from "framer-motion";
import { mergeEventData, mediaUrl } from "../about/eventPageDefaults";
import InlineRichText from "../../builder/InlineRichText";
import EditorRemoteImage from "../../EditorRemoteImage";

export default function HeroEvent1({ data = {} }: SectionProps) {
  data = mergeEventData(data, "hero", "Hero", "HeroEvent1");
  const bgImage = mediaUrl(data.bgImage || data.backgroundImage);
  const pretitle = String(data.superTitle || data.pretitle || "");
  const title = String(data.title || "");
  const description = String(data.description || data.desc || "");
  const buttons = Array.isArray(data.buttons) ? data.buttons : [];
  const primaryCta =
    buttons[0]?.label || data.primaryCta || "GET A QUOTE";
  const primaryCtaLink =
    buttons[0]?.href || data.primaryCtaLink || "/contact";
  const bannerHeight = Number(data.bannerHeight) || 75;

  return (
    <section
      className="relative w-full flex items-center bg-zinc-950 overflow-hidden pt-12 pb-16 md:pt-16 md:pb-20"
      style={{ minHeight: `${bannerHeight}dvh` }}
    >
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <EditorRemoteImage
            src={bgImage}
            alt={title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
            data-editor-media="bgImage"
            data-editor-media-type="image"
            data-editor-media-src={bgImage}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a052b]/95 via-[#2c0e44]/80 to-transparent" />
      </div>
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] relative z-10 w-full">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="h-px w-16 bg-white/50" />
            <span
              className="text-white tracking-[0.25em] text-xs font-medium uppercase"
              data-editor-inline-format-key="event-banner:pretitle"
            >
              <InlineRichText
                value={pretitle}
                formatKey="event-banner:pretitle"
              />
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-[1.15] mb-6"
            data-editor-inline-format-key="event-banner:title"
          >
            <InlineRichText value={title} formatKey="event-banner:title" />
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-white/80 text-base md:text-lg max-w-xl mb-10 leading-relaxed font-light"
            data-editor-inline-format-key="event-banner:description"
          >
            <InlineRichText
              value={description}
              formatKey="event-banner:description"
            />
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap items-center gap-8"
          >
            <Link
              href={primaryCtaLink}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#9d5baf] hover:bg-[#1a0b2e] text-white text-sm font-medium rounded-full uppercase tracking-wider transition-colors duration-300 border border-purple-400/50 group shadow-[0_0_15px_rgba(66,29,110,0.5)]"
              data-editor-inline-format-key="event-banner:cta"
            >
              <InlineRichText
                value={String(primaryCta)}
                formatKey="event-banner:cta"
              />
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
