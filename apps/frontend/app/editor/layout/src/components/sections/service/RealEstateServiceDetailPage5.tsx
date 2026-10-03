"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type ProcessStep = {
  title?: string;
  desc?: string;
  description?: string;
  iconPath?: string;
};

type CategoryItem = {
  id?: string;
  title?: string;
  name?: string;
};

const IMG = "/categories/realestate/template5";

const defaultSteps: ProcessStep[] = [
  {
    title: "Planning",
    desc: "We start by understanding your goals and creating a detailed roadmap.",
    iconPath: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
  },
  {
    title: "Execution",
    desc: "Our team implements the plan with utmost precision and quality.",
    iconPath: "M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  },
  {
    title: "Delivery",
    desc: "Final inspection and handover of your successfully completed project.",
    iconPath: "M5 12l5 5L20 7",
  },
];

const defaultBenefits = [
  "Expert consultation for your project",
  "High-quality materials and craftsmanship",
  "Timely execution and transparent communication",
];

export default function RealEstateServiceDetailPage5({
  data = {},
}: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const title = String(data.title || "Service");
  const detailImage = String(
    data.detailImage || data.image || `${IMG}/kitchen_reno.png`,
  );
  const description1 = String(
    data.description1 ||
      data.desc ||
      "Professional and comprehensive services tailored to your specific needs. Our expert team ensures that every aspect is handled with precision and care, delivering exceptional results that exceed expectations.",
  );
  const description2 = String(
    data.description2 ||
      "We leverage the latest technologies and industry best practices to bring your vision to life. From initial consultation to final delivery, our process is designed to be seamless, transparent, and highly efficient.",
  );
  const benefitsImage = String(
    data.benefitsImage || `${IMG}/bathroom_reno.png`,
  );
  const benefitsTitle = String(data.benefitsTitle || "Services Benefits:");
  const benefitsDescription = String(
    data.benefitsDescription ||
      "An architecture company thrives on innovation and creativity. Designers explore new materials, technologies, and design trends to deliver fresh and unique solutions.",
  );
  const benefits = (
    Array.isArray(data.benefits) && data.benefits.length
      ? data.benefits
      : defaultBenefits
  ).map((item) => String(item));
  const processTitle = String(
    data.processTitle || "3 Simple Steps to Process",
  );
  const processDesc = String(
    data.processDesc ||
      "Our streamlined approach ensures that your project is completed smoothly without unnecessary delays. Follow our simple steps to get started.",
  );
  const processSteps = (
    Array.isArray(data.processSteps) && data.processSteps.length
      ? data.processSteps
      : defaultSteps
  ) as ProcessStep[];
  const closingText = String(
    data.closingText ||
      "Industrial manufacturing companies often produce a diverse range of products, from small components to large machinery. These products serve various industries and sectors, contributing to economic growth and development and performance standards.",
  );
  const categoriesTitle = String(data.categoriesTitle || "Categories");
  const detailBase = String(data.detailBasePath || "/services").replace(
    /\/$/,
    "",
  );
  const categories = (
    Array.isArray(data.categories) && data.categories.length
      ? data.categories
      : Array.isArray(data.services) && data.services.length
        ? data.services
        : []
  ) as CategoryItem[];

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
      className="bg-white py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="serviceDetail"
      data-editor-fields="accentColor title detailImage description1 description2 benefitsImage benefitsTitle benefitsDescription benefits processTitle processDesc processSteps closingText categoriesTitle"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-10 px-6 max-md:flex-col max-md:gap-6 max-md:px-5">
        <div className="min-w-0 flex-1">
          <div className="mb-6 h-[500px] overflow-hidden max-md:h-[280px]">
            <img
              src={detailImage}
              alt={title}
              className="h-full w-full object-cover"
              data-editor-media="image"
              data-editor-media-type="image"
              data-editor-field="detailImage"
            />
          </div>

          <div className="mb-6 text-[1.05rem] leading-[1.8] text-[#666]">
            <p className="mb-5" data-editor-field="description1">
              {description1}
            </p>
            <p className="m-0" data-editor-field="description2">
              {description2}
            </p>
          </div>

          <div className="mb-8 flex gap-10 max-md:flex-col max-md:gap-[60px]">
            <div className="h-[300px] flex-1 overflow-hidden">
              <img
                src={benefitsImage}
                alt={title}
                className="h-full w-full object-cover"
                data-editor-media="image"
                data-editor-media-type="image"
                data-editor-field="benefitsImage"
              />
            </div>
            <div className="flex-1">
              <h3
                className="mb-6 text-[1.5rem] font-bold text-[#333]"
                data-editor-field="benefitsTitle"
              >
                {benefitsTitle}
              </h3>
              <p
                className="mb-6 leading-relaxed text-[#666]"
                data-editor-field="benefitsDescription"
              >
                {benefitsDescription}
              </p>
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 text-[#666]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] text-[var(--accent)]">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3
              className="mb-8 text-[1.5rem] font-bold text-[#333]"
              data-editor-field="processTitle"
            >
              {processTitle}
            </h3>
            <p
              className="mb-6 leading-relaxed text-[#666]"
              data-editor-field="processDesc"
            >
              {processDesc}
            </p>
            <div className="mb-10 grid grid-cols-1 gap-6 text-center md:grid-cols-3">
              {processSteps.map((step, index) => (
                <div
                  key={step.title || index}
                  className="flex flex-col items-center"
                >
                  <div className="relative flex h-[220px] w-[220px] items-center justify-center rounded-full border-2 border-dotted border-[var(--accent)] p-2">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[var(--accent)] p-4">
                      <h4
                        className="mb-3 text-[1.25rem] font-bold text-[#111]"
                        data-editor-field="title"
                      >
                        {step.title}
                      </h4>
                      <p
                        className="m-0 text-[0.85rem] leading-relaxed text-[#666]"
                        data-editor-field="desc"
                      >
                        {step.desc || step.description}
                      </p>
                    </div>
                    <div className="absolute top-[-10px] left-0 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_4px_12px_rgba(255,107,0,0.3)]">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path
                          d={
                            step.iconPath ||
                            "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                          }
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p
              className="m-0 leading-relaxed text-[#666]"
              data-editor-field="closingText"
            >
              {closingText}
            </p>
          </div>
        </div>

        <aside className="w-[350px] shrink-0 sticky top-[120px] h-fit max-md:w-full max-md:static">
          <div className="rounded-lg border border-[#eaeaea] bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3
              className="mb-2 text-[1.2rem] font-bold tracking-wide text-[#333] uppercase"
              data-editor-field="categoriesTitle"
            >
              {categoriesTitle}
            </h3>
            <div className="mb-6 h-0.5 w-10 bg-[var(--accent)]" />
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {categories.map((item, index) => {
                const label = String(item.title || item.name || "Service");
                const href = `${detailBase}/${item.id || ""}`;
                const isActive =
                  String(item.id || "").toLowerCase() ===
                  String(data.id || "").toLowerCase();
                return (
                  <li key={item.id || `${label}-${index}`}>
                    <Link
                      href={href}
                      onClick={(event) => handleNavigate(event, href, label)}
                      className={`flex items-center justify-between gap-2 text-[0.95rem] no-underline transition-colors ${
                        isActive
                          ? "text-[var(--accent)]"
                          : "text-[#666] hover:text-[var(--accent)]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="text-[var(--accent)]" aria-hidden="true">
                          ›
                        </span>
                        {label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
