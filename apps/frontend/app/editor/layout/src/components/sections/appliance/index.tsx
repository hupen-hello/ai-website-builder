"use client";

import React from "react";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { resolveApplianceBreadcrumbView } from "../../../lib/applianceBreadcrumb";
import { ApplianceLink } from "./ApplianceLink";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Breadcrumb } from "./Breadcrumb";
import { HeroSection } from "./HeroSection";
import { AboutUsSection } from "./AboutUsSection";
import { AboutFirmSection } from "./AboutFirmSection";
import { ServicesSection } from "./ServicesSection";
import { ServiceDetailSection } from "./ServiceDetailSection";
import { AchievementSection } from "./AchievementSection";
import { BlogsSection } from "./BlogsSection";
import { BlogDetailSection } from "./BlogDetailSection";
import { TestimonialSection } from "./TestimonialSection";
import { TeamSection } from "./TeamSection";
import { FaqSection } from "./FaqSection";
import { GallerySection } from "./GallerySection";
import { ContactSection } from "./ContactSection";
import { EnquirySection } from "./EnquirySection";
import { FaArrowLeft } from "react-icons/fa";

export default function ServiceHeader10({ data = {} }: SectionProps) {
  return <Header data={data as never} />;
}

export function ServiceFooter10({ data = {} }: SectionProps) {
  return <Footer data={data as never} />;
}

export function ServiceBreadcrumb10({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const view = resolveApplianceBreadcrumbView({
    currentPage: preview?.currentPage,
    data: data as Record<string, unknown>,
  });
  return (
    <Breadcrumb
      data={{
        ...data,
        title: view.title,
        bgImage: view.bgImage,
        breadcrumbs: view.breadcrumbs,
      }}
    />
  );
}

export function ServiceBanner10({ data = {} }: SectionProps) {
  return <HeroSection data={data as never} />;
}

export function ServiceAbout10({ data = {} }: SectionProps) {
  return <AboutUsSection data={data as never} />;
}

export function ServiceAboutPage10({ data = {} }: SectionProps) {
  return (
    <AboutFirmSection
      data={data as never}
      hideButton={Boolean((data as { hideButton?: boolean }).hideButton)}
    />
  );
}

export function ServiceProduct10({ data = {}, editorMode }: SectionProps) {
  return <ServicesSection data={data as never} editorMode={editorMode} />;
}

export function ServicePage10({ data = {}, editorMode }: SectionProps) {
  return (
    <ServicesSection
      data={data as never}
      editorMode={editorMode}
      hideButton
    />
  );
}

export function ServiceDetail10({ data = {} }: SectionProps) {
  return <ServiceDetailSection data={data as never} />;
}

export function ServiceStats10({ data = {} }: SectionProps) {
  return <AchievementSection data={data as never} />;
}

export function ServiceBlog10({ data = {}, editorMode }: SectionProps) {
  return <BlogsSection data={data as never} editorMode={editorMode} />;
}

export function ServiceBlogPage10({ data = {}, editorMode }: SectionProps) {
  return (
    <BlogsSection data={data as never} editorMode={editorMode} isListingPage />
  );
}

export function ServiceBlogDetail10({ data = {} }: SectionProps) {
  const blog = (data as { blog?: unknown }).blog || data;
  return <BlogDetailSection blog={blog as never} />;
}

export function ServiceTestimonial10({ data = {} }: SectionProps) {
  return <TestimonialSection data={data as never} />;
}

export function ServiceTeam10({ data = {}, editorMode }: SectionProps) {
  return <TeamSection data={data as never} editorMode={editorMode} />;
}

export function ServiceFaq10({ data = {} }: SectionProps) {
  return <FaqSection data={data as never} />;
}

export function ServiceGalleryPage10({ data = {}, editorMode }: SectionProps) {
  return <GallerySection data={data as never} editorMode={editorMode} />;
}

export function ServiceContactPage10({ data = {} }: SectionProps) {
  return <ContactSection data={data as never} />;
}

export function ServiceEnquiryPage10({ data = {} }: SectionProps) {
  return <EnquirySection data={data as never} />;
}

export function ServiceErrorPage10({ data = {} }: SectionProps) {
  const title = String(data.title || "Oops! Page Not Found");
  const description = String(
    data.description ||
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
  );
  return (
    <section className="w-full flex-grow py-20 md:py-32 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-8xl md:text-9xl font-extrabold text-[var(--color-primary)] mb-4 drop-shadow-sm">
        404
      </h1>
      <h2 className="text-2xl md:text-4xl font-bold text-[#051024] mb-6">{title}</h2>
      <p className="text-gray-500 mb-10 max-w-lg text-sm md:text-base leading-relaxed">
        {description}
      </p>
      <ApplianceLink
        href="/"
        className="inline-flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-white font-bold py-4 px-8 rounded-xl transition-colors text-sm shadow-md"
      >
        <FaArrowLeft />
        Back to Home
      </ApplianceLink>
    </section>
  );
}
