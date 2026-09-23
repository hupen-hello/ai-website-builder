"use client";

import { CheckCircle2 } from "lucide-react";
import type { SectionProps } from "../../../types/section";

type CareerItem = { title: string; desc: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getCareerItems = (value: unknown): CareerItem[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        isRecord(item) &&
        typeof item.title === "string" &&
        typeof item.desc === "string"
          ? [{ title: item.title, desc: item.desc }]
          : [],
      )
    : [];

export default function RealEstateCareerPage1({ data = {} }: SectionProps) {
  const benefits = getCareerItems(data.benefits);

  return (
    <section
      data-editor-section-label="Employee Benefits"
      data-editor-fields="benefits"
      className="border-b border-[#141414]/10 bg-[#f8f6f1] px-5 py-12 md:px-8 md:py-16 lg:px-10"
    >
      <div
        data-box-layout-grid="grid"
        className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-[1.25rem] border border-[#141414]/10 bg-[#141414]/10 sm:grid-cols-2 lg:grid-cols-4"
      >
        {benefits.map((benefit) => (
          <article key={benefit.title} className="bg-white p-6 md:p-7">
            <CheckCircle2 size={20} className="text-[#a4472f]" />
            <h2 className="mt-4 text-lg font-semibold">{benefit.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#141414]/60">
              {benefit.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
