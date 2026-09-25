"use client";

import type { ElementType } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Cookie,
  Database,
  DollarSign,
  Edit,
  Eye,
  EyeOff,
  FileText,
  FileX,
  Headphones,
  HelpCircle,
  Home,
  Info,
  Link as LinkIcon,
  Lock,
  Monitor,
  RefreshCcw,
  Scale,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { LegalPage4Data, LegalSection4 } from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  FileText,
  Monitor,
  Home,
  User,
  ShieldCheck,
  AlertTriangle,
  LinkIcon,
  Edit,
  Scale,
  Shield,
  Database,
  Settings,
  Lock,
  Eye,
  Info,
  HelpCircle,
  FileX,
  AlertCircle,
  RefreshCcw,
  DollarSign,
  Clock,
  Cookie,
  EyeOff,
  ShieldAlert,
  Headphones,
};

const interpolate = (value: string, title: string) =>
  value.replaceAll("{title}", title.toLowerCase());

export function RealEstateLegalPageLayout({
  data = {},
  authored,
  fallbackTitle,
}: SectionProps & {
  authored: LegalPage4Data;
  fallbackTitle: string;
}) {
  const content: LegalPage4Data = {
    ...authored,
    ...(data as LegalPage4Data),
  };
  const title = content.title ?? fallbackTitle;
  const sections = content.legalSections?.length
    ? content.legalSections
    : (authored.legalSections ?? []);
  const helpDescription = interpolate(
    content.helpDescription ??
      "If you have any questions about these {title}, feel free to contact us.",
    title,
  );
  const [activeSection, setActiveSection] = useState(
    sections[0]?.id ?? sections[0]?.title ?? "",
  );

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const target = document.getElementById(sectionId);
    if (!target) return;

    const scrollContainer = target.closest<HTMLElement>("[data-template-scroll]");
    if (scrollContainer) {
      const containerTop = scrollContainer.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + (targetTop - containerTop) - 24,
        behavior: "smooth",
      });
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="bg-gray-50 py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="legalPage"
      data-editor-fields="accentColor title onThisPageTitle helpTitle helpDescription helpButtonLabel helpHref legalSections"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="sticky top-24 flex h-max w-full flex-col gap-8 lg:w-1/4">
            <div className="rounded-2xl border border-[#e6f2f4] bg-[#f8fafa] p-6">
              <h3
                className="mb-6 text-[15px] font-bold tracking-wider text-secondary uppercase"
                data-editor-field="onThisPageTitle"
              >
                {content.onThisPageTitle ?? "ON THIS PAGE"}
              </h3>
              <ul className="flex flex-col space-y-4">
                {sections.map((section, index) => {
                  const sectionId = section.id ?? section.title;
                  const isActive = activeSection === sectionId;
                  return (
                    <li key={sectionId}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(sectionId)}
                        className={`flex w-full items-center gap-3 text-left text-[14px] transition-colors ${
                          isActive
                            ? "font-semibold text-[var(--accent)]"
                            : "text-gray-600 hover:text-[var(--accent)]"
                        }`}
                      >
                        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                        {index + 1}. {section.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm">
                <Headphones className="h-8 w-8" />
              </div>
              <h3
                className="mb-3 text-[15px] font-bold tracking-wider text-secondary uppercase"
                data-editor-field="helpTitle"
              >
                {content.helpTitle ?? "NEED HELP?"}
              </h3>
              <p
                className="mb-6 px-2 text-[13px] leading-relaxed text-gray-500"
                data-editor-field="helpDescription"
              >
                {helpDescription}
              </p>
              <Link
                href={content.helpHref ?? "/template4/contact"}
                className="inline-flex w-full items-center justify-center gap-2 rounded bg-[var(--accent)] px-6 py-3 text-[12px] font-bold tracking-wider text-white uppercase transition-colors hover:opacity-90"
              >
                <span data-editor-field="helpButtonLabel">
                  {content.helpButtonLabel ?? "CONTACT US"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-3/4">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] md:p-12">
              <div className="flex flex-col gap-0">
                {sections.map((section, index) => {
                  const Icon = iconMap[section.icon ?? "FileText"] ?? FileText;
                  return (
                    <article
                      key={section.id ?? section.title}
                      id={section.id ?? section.title}
                      className="relative flex scroll-mt-28 flex-col gap-6 py-10 first:pt-0 last:pb-0 md:flex-row"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#e6f2f4] bg-[#f2f9f9] text-[var(--accent)]">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="mb-3 flex gap-2 text-[16px] font-bold tracking-wide text-secondary uppercase">
                          <span className="text-[var(--accent)]">{index + 1}.</span>
                          <span data-editor-field="title">{section.title}</span>
                        </h3>
                        <div
                          className="space-y-4 text-[14px] leading-relaxed text-gray-500"
                          data-editor-field="content"
                        >
                          {section.content}
                        </div>
                      </div>
                      {index !== sections.length - 1 ? (
                        <div className="absolute right-0 bottom-0 left-0 border-b border-dashed border-gray-200 md:left-20" />
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function createLegalPage4(
  authored: LegalPage4Data,
  fallbackTitle: string,
  fallbackSections: LegalSection4[],
) {
  return function LegalPage4({ data = {} }: SectionProps) {
    return (
      <RealEstateLegalPageLayout
        data={data}
        authored={{
          ...authored,
          legalSections: authored.legalSections?.length
            ? authored.legalSections
            : fallbackSections,
        }}
        fallbackTitle={fallbackTitle}
      />
    );
  };
}
