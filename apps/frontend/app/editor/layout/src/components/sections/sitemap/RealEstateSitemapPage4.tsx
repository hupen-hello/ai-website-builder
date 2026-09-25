"use client";

import type { ElementType } from "react";
import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Download,
  Edit,
  Factory,
  FileText,
  Home,
  Phone,
  User,
} from "lucide-react";
import { sitemapPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  SitemapGroup4,
  SitemapPage4Data,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  Home,
  User,
  Building2,
  Factory,
  FileText,
  Edit,
  Phone,
  Download,
};

const defaultGroups: SitemapGroup4[] = [
  {
    title: "Home",
    icon: "Home",
    links: [
      { label: "Home Page", href: "/" },
      { label: "Get a Quote", href: "/template4/quote" },
      { label: "Featured Properties", href: "/template4/properties" },
      { label: "Why Choose Us", href: "/template4/about" },
      { label: "Testimonials", href: "/template4/testimonials" },
      { label: "Latest News", href: "/template4/blog" },
    ],
  },
];

export default function RealEstateSitemapPage4({ data = {} }: SectionProps) {
  const authored = sitemapPage4Content.RealEstateSitemapPage4;
  const content: SitemapPage4Data = {
    ...authored,
    ...(data as SitemapPage4Data),
  };
  const groups = content.groups?.length
    ? content.groups
    : (authored.groups ?? defaultGroups);

  return (
    <section
      className="bg-[#f8fafa] py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="sitemap"
      data-editor-fields="accentColor title description groups"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-16 text-center">
          <h2
            className="mb-4 text-3xl font-bold text-secondary lg:text-4xl"
            data-editor-field="title"
          >
            {content.title ?? "Everything You Need, In One Place"}
          </h2>
          <p
            className="mb-6 font-medium text-gray-500"
            data-editor-field="description"
          >
            {content.description ??
              "Use this sitemap to quickly find the information you're looking for. We're here to help you every step of the way."}
          </p>
          <div className="mx-auto h-[2px] w-12 bg-[var(--accent)]" />
        </div>

        <div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
          data-box-layout-grid="grid"
        >
          {groups.map((section) => {
            const Icon = iconMap[section.icon ?? "FileText"] ?? FileText;
            const links = section.links ?? [];
            return (
              <article
                key={section.id ?? section.title}
                className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="mb-5 flex items-center gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#f2f9f9] text-[var(--accent)]">
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <h3
                    className="text-[17px] font-bold text-secondary"
                    data-editor-field="title"
                  >
                    {section.title}
                  </h3>
                </div>
                <div className="mb-6 h-[2px] w-6 bg-[var(--accent)]" />
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={`${section.title}-${link.href}-${link.label}`}>
                      <Link
                        href={link.href ?? "#"}
                        className="flex items-center gap-3 text-[14px] font-medium text-gray-600 transition-colors hover:text-[var(--accent)]"
                      >
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-[var(--accent)]"
                          strokeWidth={2}
                        />
                        <span data-editor-field="label">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
