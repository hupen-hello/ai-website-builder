"use client";

import type { ElementType } from "react";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  ChevronRight,
  Home,
  Shield,
  Users,
  Wrench,
} from "lucide-react";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type SitemapLink = {
  label?: string;
  url?: string;
  href?: string;
};

type SitemapGroup = {
  id?: string;
  title?: string;
  icon?: string;
  links?: SitemapLink[];
};

const iconMap: Record<string, ElementType> = {
  Home,
  Wrench,
  Users,
  BookOpen,
  Shield,
  Building2,
};

const defaultGroups: SitemapGroup[] = [
  {
    id: "main",
    title: "Main Pages",
    icon: "Home",
    links: [
      { label: "Home", url: "/" },
      { label: "About Us", url: "/about" },
      { label: "Services", url: "/services" },
      { label: "Properties", url: "/properties" },
      { label: "Gallery", url: "/gallery" },
      { label: "Contact Us", url: "/contact" },
    ],
  },
  {
    id: "services",
    title: "Services",
    icon: "Wrench",
    links: [
      { label: "Building Construction", url: "/services/building-construction" },
      { label: "House Renovation", url: "/services/house-renovation" },
      { label: "Architecture Design", url: "/services/architecture-design" },
      { label: "Interior Design", url: "/services/interior-design" },
      { label: "Fixing & Support", url: "/services/fixing-support" },
    ],
  },
  {
    id: "company",
    title: "Company",
    icon: "Users",
    links: [
      { label: "Our Team", url: "/teams" },
      { label: "Careers", url: "/career" },
      { label: "Testimonials", url: "/testimonial" },
      { label: "Awards", url: "/awards" },
      { label: "Partners", url: "/partners" },
    ],
  },
  {
    id: "resources",
    title: "Resources",
    icon: "BookOpen",
    links: [
      { label: "Blogs", url: "/blogs" },
      { label: "Brochure", url: "/brochure" },
      { label: "Pricing Packages", url: "/package" },
      { label: "FAQs", url: "/faq" },
      { label: "Get a Quote", url: "/quote" },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    icon: "Shield",
    links: [
      { label: "Terms & Conditions", url: "/terms" },
      { label: "Privacy Policy", url: "/privacy-policy" },
      { label: "Cookie Policy", url: "/cookies-policy" },
      { label: "Sitemap", url: "/sitemap" },
    ],
  },
];

export default function RealEstateSitemapPage5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const tagline = String(data.tagline || data.pretitle || "EXPLORE OUR WEBSITE");
  const title = String(data.title || "Complete Guide to Our Pages");
  const description = String(
    data.description ||
      data.desc ||
      "Easily find what you're looking for. Navigate through all the important pages of our website.",
  );

  const groups = (
    Array.isArray(data.groups) && data.groups.length
      ? data.groups
      : Array.isArray(data.sitemapGroups) && data.sitemapGroups.length
        ? data.sitemapGroups
        : defaultGroups
  ) as SitemapGroup[];

  const ctaTitleStart = String(data.ctaTitleStart || "Need Immediate ");
  const ctaTitleHighlight = String(data.ctaTitleHighlight || "Assistance?");
  const ctaDescription = String(
    data.ctaDescription ||
      "Our team is available to help you. Call us now for quick support and details.",
  );
  const ctaPhone = String(data.ctaPhone || data.phone || "+91 123 456 7890");
  const ctaPhoneLink = String(
    data.ctaPhoneLink || data.phoneLink || `tel:${ctaPhone.replace(/\s+/g, "")}`,
  );
  const showCta = data.showCta !== false;

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  return (
    <section
      className="bg-[#fafafa] py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="sitemap"
      data-editor-fields="accentColor tagline title description groups ctaTitleStart ctaTitleHighlight ctaDescription ctaPhone ctaPhoneLink"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:overflow-x-hidden max-md:px-5">
        <div className="mb-8 text-center">
          <div
            className="mb-4 font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
            data-editor-field="tagline"
          >
            {tagline}
          </div>
          <h2
            className="mb-4 text-[2rem] font-bold text-[#222] max-md:text-[1.6rem]"
            data-editor-field="title"
          >
            {title}
          </h2>
          <p
            className="mx-auto m-0 max-w-[600px] leading-[1.6] text-[#666]"
            data-editor-field="description"
          >
            {description}
          </p>
        </div>

        <div
          className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-6"
          data-box-layout-grid="grid"
        >
          {groups.map((group, index) => {
            const Icon =
              iconMap[group.icon ?? ""] ??
              [Home, Wrench, Users, BookOpen, Shield][index % 5] ??
              Building2;
            const links = group.links ?? [];

            return (
              <article
                key={group.id ?? group.title ?? index}
                className="flex flex-col rounded-lg border border-[#eaeaea] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,107,0,0.1)] text-[var(--accent)]">
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3
                  className="mb-5 text-[1.25rem] font-semibold text-[#222]"
                  data-editor-field="title"
                >
                  {group.title}
                </h3>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {links.map((link) => {
                    const href = String(link.url || link.href || "#");
                    const label = String(link.label || "Link");
                    return (
                      <li key={`${group.title}-${href}-${label}`}>
                        <Link
                          href={href}
                          onClick={(event) =>
                            handleNavigate(event, href, label)
                          }
                          className="flex items-center gap-2 text-[0.95rem] text-[#666] no-underline transition-colors hover:text-[var(--accent)]"
                        >
                          <ChevronRight
                            className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]"
                            strokeWidth={2}
                          />
                          <span data-editor-field="label">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>

        {showCta ? (
          <div className="mt-20 flex flex-wrap items-center justify-between gap-6 rounded-lg border border-[#ffe4d6] bg-[#fff7f0] px-10 py-8 max-md:flex-col max-md:items-stretch max-md:gap-6 max-md:px-6 max-md:py-6 max-md:text-center">
            <div className="flex items-center gap-6 max-md:flex-col max-md:gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_15px_rgba(255,107,0,0.1)] max-md:mx-auto">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-[1.4rem] font-bold text-[#111]">
                  <span data-editor-field="ctaTitleStart">{ctaTitleStart}</span>
                  <span
                    className="text-[var(--accent)]"
                    data-editor-field="ctaTitleHighlight"
                  >
                    {ctaTitleHighlight}
                  </span>
                </h3>
                <p
                  className="m-0 text-[0.95rem] text-[#666]"
                  data-editor-field="ctaDescription"
                >
                  {ctaDescription}
                </p>
              </div>
            </div>

            <a
              href={ctaPhoneLink}
              className="inline-flex items-center gap-2.5 whitespace-nowrap rounded border border-[var(--accent)] bg-white px-6 py-3 text-[1.05rem] font-semibold text-[var(--accent)] no-underline max-md:justify-center"
              data-editor-field="ctaPhone"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {ctaPhone}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
