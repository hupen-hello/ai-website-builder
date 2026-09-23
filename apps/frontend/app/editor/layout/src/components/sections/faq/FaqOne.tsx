"use client";

import { useState } from "react";
import { BadgeHelp, Briefcase, ChevronDown, CreditCard, FileQuestion, Mail, Receipt, RefreshCw, ShieldQuestion, Sparkles, Users } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

const icons = [BadgeHelp, CreditCard, Receipt, Users, Sparkles, Briefcase, Mail, ShieldQuestion, RefreshCw, FileQuestion];

export default function FaqOne({ data = {} }: SectionProps) {
  const items = data.faqItems ?? [];
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-white bg-[linear-gradient(#f1f5f9_1px,transparent_1px),linear-gradient(90deg,#f1f5f9_1px,transparent_1px)] bg-[size:42px_42px] px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        {data.pretitle && (
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold">
            <BadgeHelp size={14} />
            <span data-editor-inline-format-key="faq-one:pretitle">
              <InlineRichText
                value={data.pretitle}
                formatKey="faq-one:pretitle"
              />
            </span>
          </div>
        )}
        {data.title && (
          <h2 className="mt-7 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl md:text-5xl" data-editor-inline-format-key="faq-one:title">
            <InlineRichText value={data.title} formatKey="faq-one:title" />
          </h2>
        )}
        {data.desc && <p className="mt-4 text-base text-slate-600" data-editor-inline-format-key="faq-one:description"><InlineRichText value={data.desc} formatKey="faq-one:description" /></p>}
        <div className="mt-10 grid gap-x-14 gap-y-8 sm:mt-16 lg:grid-cols-2" data-export-faq>
          {items.map((item, index) => {
            const Icon = icons[index % icons.length];
            const isOpen = openIndex === index;
            return (
              <article
                key={`faq-${index}-${item.question.slice(0, 24)}`}
                className="grid grid-cols-[36px_1fr] gap-3 sm:grid-cols-[42px_1fr] sm:gap-5"
                data-export-faq-item
                data-export-faq-open={isOpen ? "true" : "false"}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white">
                  <Icon size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-3 text-left text-sm font-bold text-slate-950"
                    data-editor-inline-format-key={`faq-one:${index}:question`}
                    data-export-faq-trigger
                  >
                    <InlineRichText value={item.question} formatKey={`faq-one:${index}:question`} />
                    <ChevronDown
                      size={16}
                      data-export-faq-chevron
                      className={`shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    data-export-faq-panel
                    className={`grid transition-all duration-300 ease-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="mt-2 text-sm leading-6 text-slate-600" data-editor-inline-format-key={`faq-one:${index}:answer`}><InlineRichText value={item.answer} formatKey={`faq-one:${index}:answer`} /></p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
