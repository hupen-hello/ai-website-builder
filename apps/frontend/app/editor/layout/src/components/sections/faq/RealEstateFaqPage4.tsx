"use client";

import { useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import { faqPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { FaqPage4Data, FaqPage4Item } from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

export default function RealEstateFaqPage4({ data = {} }: SectionProps) {
  const authored = faqPage4Content.RealEstateFaqPage4;
  const content: FaqPage4Data = {
    ...authored,
    ...(data as FaqPage4Data),
  };
  const faqs: FaqPage4Item[] =
    content.faqList?.length
      ? content.faqList
      : content.faqItems?.length
        ? content.faqItems
        : (authored.faqList ?? authored.faqItems ?? []);
  const [openId, setOpenId] = useState<string | null>(
    faqs.find((faq) => faq.id === "2")?.id ?? faqs[0]?.id ?? null,
  );

  const toggleFaq = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="faq"
      data-editor-fields="accentColor faqList newsletterPretitle newsletterTitle newsletterPlaceholder sidebarImage sidebarImageAlt"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-12 lg:flex-row">
          <div className="lg:w-2/3">
            <div
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              data-box-layout-grid="stack"
            >
              {faqs.map((faq) => {
                const isOpen = openId === faq.id;
                const answerId = `faq-answer-${faq.id}`;

                return (
                  <div
                    key={faq.id}
                    className={`border-b border-gray-200 last:border-b-0 ${
                      isOpen ? "bg-gray-50/50" : "bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => toggleFaq(faq.id)}
                      className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50"
                    >
                      <span
                        className="text-lg font-bold text-secondary"
                        data-editor-field="question"
                      >
                        {faq.question}
                      </span>
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center ${
                          isOpen ? "text-[var(--accent)]" : "text-gray-400"
                        }`}
                      >
                        {isOpen ? (
                          <Minus className="h-5 w-5" />
                        ) : (
                          <Plus className="h-5 w-5" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div
                        id={answerId}
                        className="animate-in slide-in-from-top-2 px-6 pb-8 duration-300"
                      >
                        {faq.image ? (
                          <div className="flex flex-col gap-6 sm:flex-row">
                            <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg">
                              <img
                                src={faq.image}
                                alt={faq.question}
                                className="h-full w-full object-cover"
                                data-editor-media="image"
                                data-editor-media-type="image"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                                  <div className="ml-1 h-0 w-0 border-t-6 border-b-6 border-l-[10px] border-t-transparent border-b-transparent border-l-[var(--accent)]" />
                                </div>
                              </div>
                            </div>
                            <p
                              className="text-sm leading-relaxed text-gray-600"
                              data-editor-field="answer"
                            >
                              {faq.answer}
                            </p>
                          </div>
                        ) : (
                          <p
                            className="text-sm leading-relaxed text-gray-600"
                            data-editor-field="answer"
                          >
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-8 lg:w-1/3">
            <div className="relative overflow-hidden rounded-lg bg-[#0f0f11] p-10 text-white">
              <div className="pointer-events-none absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 scale-150 opacity-10">
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>

              <div className="relative z-10">
                <span
                  className="mb-2 block text-sm font-bold tracking-wider text-[var(--accent)]"
                  data-editor-field="newsletterPretitle"
                >
                  {content.newsletterPretitle ?? "// subscribe"}
                </span>
                <h3
                  className="mb-8 text-3xl font-bold"
                  data-editor-field="newsletterTitle"
                >
                  {content.newsletterTitle ?? "Get Newsletter"}
                </h3>

                <form
                  className="flex rounded bg-[#1a1a1a]"
                  onSubmit={(event) => event.preventDefault()}
                >
                  <input
                    type="text"
                    placeholder={content.newsletterPlaceholder ?? "Search"}
                    className="w-full border-none bg-transparent px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                    data-editor-field="newsletterPlaceholder"
                    aria-label={content.newsletterPlaceholder ?? "Search"}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-r bg-[var(--accent)] px-4 py-3 text-white transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
                    aria-label="Submit"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>

            <div className="h-[400px] overflow-hidden rounded-lg">
              <img
                src={
                  content.sidebarImage ??
                  "/categories/realestate/template4/unsplash-b4412356.jpg"
                }
                alt={content.sidebarImageAlt ?? "Cabin View"}
                className="h-full w-full object-cover"
                data-editor-media="sidebarImage"
                data-editor-media-type="image"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
