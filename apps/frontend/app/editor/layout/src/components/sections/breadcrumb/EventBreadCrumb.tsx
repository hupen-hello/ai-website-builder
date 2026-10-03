"use client";
import React from "react";
import type { SectionProps } from "../../../types/section";
import { motion } from "framer-motion";
import { Breadcrumb } from "./EventBreadcrumbNav";
import { useOptionalPreview } from "../../context/PreviewContext";
import { eventVariant } from "../about/eventPageDefaults";

const BANNER_BY_SLUG: Record<string, string> = {
  "about-us": "PageBannerEvent1",
  about: "PageBannerEvent1",
  mission: "MissionPageBanner",
  vision: "VisionPageBanner",
  awards: "AwardsPageBanner",
  "our-story": "OurStoryPageBanner",
  "our-team": "OurTeamPageBanner",
  "team-detail": "TeamDetailPageBanner",
  "why-choose-us": "WhyChooseUsPageBanner",
  services: "ServicesPageBanner",
  "services-detail": "ServiceDetailPageBanner",
  event: "EventsPageBanner",
  events: "EventsPageBanner",
  "event-detail": "EventDetailPageBanner",
  gallery: "GalleryPageBanner",
  testimonials: "TestimonialsPageBanner",
  partners: "PartnersPageBanner",
  faqs: "FaqsPageBanner",
  faq: "FaqsPageBanner",
  career: "CareerPageBanner",
  "career-detail": "CareerDetailPageBanner",
  "get-a-quote": "GetAQuotePageBanner",
  blog: "BlogPageBanner",
  blogs: "BlogPageBanner",
  "blog-detail": "BlogDetailPageBanner",
  "terms-conditions": "TermsPageBanner",
  "privacy-policy": "PrivacyPageBanner",
  disclaimer: "DisclaimerPageBanner",
  "refund-cancellation": "RefundPageBanner",
  "cookies-policy": "CookiesPageBanner",
  contact: "ContactPageBanner",
  sitemap: "SitemapPageBanner",
};

function slugFromLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, "-");
}

export default function PageBannerEvent1({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const current =
    preview?.currentPage && preview.currentPage.toLowerCase() !== "home"
      ? preview.currentPage
      : "";
  const slug = slugFromLabel(current || String(data.title || ""));
  const banner = eventVariant(
    "PageBanner",
    BANNER_BY_SLUG[slug] || "PageBannerEvent1",
  );
  const title =
    current ||
    (typeof data.title === "string" && data.title !== "About Us"
      ? data.title
      : "") ||
    String(banner.title || data.title || "");
  const bgImage = String(data.bgImage || banner.bgImage || "");
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: title },
  ];

  return (
    <section className="relative py-12 lg:py-12 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#2a133f]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a133f] to-transparent opacity-80" />
      </div>
      <div className="container mx-auto px-4 md:px-8 lg:px-12 max-w-[1300px] relative z-10 ">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {title}
          </h1>
          <Breadcrumb items={breadcrumbs} />
        </motion.div>
      </div>
    </section>
  );
}
