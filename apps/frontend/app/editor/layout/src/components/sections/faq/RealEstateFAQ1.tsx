"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { SectionProps } from "../../../types/section";

export default function RealEstateFAQ1({ data = {} }: SectionProps) {
  const items = data.faqItems ?? [];
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="bg-[#f7f4ee] px-5 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          {data.pretitle && (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a45b42]">
              {data.pretitle}
            </p>
          )}
          {data.title && (
            <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#1d2925] sm:text-4xl lg:text-5xl">
              {data.title}
            </h2>
          )}
          {data.desc && (
            <p className="mt-5 max-w-md text-base leading-7 text-[#1d2925]/65">
              {data.desc}
            </p>
          )}
        </div>

        <div className="border-t border-[#1d2925]/15">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            const answerId = `real-estate-faq-answer-${index}`;

            return (
              <article key={`${item.question}-${index}`} className="border-b border-[#1d2925]/15">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left text-base font-semibold leading-6 text-[#1d2925] transition-colors hover:text-[#a45b42] sm:py-7 sm:text-lg"
                  >
                    <span>{item.question}</span>
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1d2925]/20"
                    >
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                </h3>
                <div
                  id={answerId}
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-2xl pb-7 pr-12 text-sm leading-7 text-[#1d2925]/65 sm:text-base">
                      {item.answer}
                    </p>
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
