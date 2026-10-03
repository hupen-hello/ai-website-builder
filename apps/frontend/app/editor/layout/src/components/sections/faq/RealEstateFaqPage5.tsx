"use client";

import { useState } from "react";
import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type FaqItem = {
  id?: string;
  question?: string;
  answer?: string;
};

type SubjectOption = {
  value?: string;
  label?: string;
};

const defaultFaqs: FaqItem[] = [
  {
    id: "1",
    question: "How do we manage quality assurance?",
    answer:
      "We have a dedicated QA team that performs rigorous checks at every stage of the construction process. From material selection to final finishing, everything is monitored.",
  },
  {
    id: "2",
    question: "Where should I incorporate my business?",
    answer:
      "Globally administrate bleeding-edge content via viral solution. Phosfluo rescently grow progressive schemas and front-end portal. Conveniently. Authoritatively visioneer strategic technology with optimal synergy. Professionally productize magnetic metrics.",
  },
  {
    id: "3",
    question: "How to process the funtion for construction?",
    answer:
      "Detailed processing guidelines and protocols are followed by our project managers to ensure smooth execution.",
  },
  {
    id: "4",
    question: "Kitchen Cabinets Remodeling & Renovation?",
    answer:
      "We offer custom solutions for kitchen cabinets, using high-quality materials and modern designs tailored to your space.",
  },
  {
    id: "5",
    question: "Where should I incorporate my business?",
    answer: "Globally administrate bleeding-edge content via viral solution.",
  },
  {
    id: "6",
    question: "How many types of parapets are there?",
    answer:
      "There are several types including plain, perforated, paneled, and embattled parapets, each serving different architectural purposes.",
  },
  {
    id: "7",
    question: "How many types of engineer are there?",
    answer:
      "In construction, we primarily work with civil, structural, mechanical, electrical, and geotechnical engineers.",
  },
  {
    id: "8",
    question: "What will happen when I have sent my application?",
    answer:
      "Our team will review your inquiry within 24 hours and get back to you to schedule an initial consultation.",
  },
  {
    id: "9",
    question: "What should I include in my personal statement?",
    answer:
      "Please include your project goals, preferred timeline, budget constraints, and any specific design inspirations you have.",
  },
  {
    id: "10",
    question: "How can I pay for my purchases?",
    answer:
      "We accept wire transfers, major credit cards, and offer flexible financing plans through our partners.",
  },
  {
    id: "11",
    question: "How many Themes are there?",
    answer:
      "We provide a variety of architectural themes ranging from modern minimalist to classic colonial and industrial.",
  },
];

const defaultSubjectOptions: SubjectOption[] = [
  { value: "1", label: "General Enquiry" },
  { value: "2", label: "Project Estimate" },
];

export default function RealEstateFaqPage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const subtitle = String(
    data.subtitle || data.pretitle || "Frequently Asked Any Question",
  );
  const title = String(
    data.title || "Talk To About Your Next Dream Projects",
  );
  const description = String(
    data.description ||
      "Construction engineers ensure that projects are completed on time, within budget, and meet quality standard. Their expertise ensures that construction sites are safe, secure.",
  );
  const formSubtitle = String(data.formSubtitle || "Contact Us");
  const formTitle = String(data.formTitle || "Need to Make An Enquiry");
  const namePlaceholder = String(data.namePlaceholder || "Your Name*");
  const emailPlaceholder = String(data.emailPlaceholder || "Email Address*");
  const subjectPlaceholder = String(
    data.subjectPlaceholder || "Select Subject*",
  );
  const phonePlaceholder = String(data.phonePlaceholder || "Phone Number*");
  const messagePlaceholder = String(
    data.messagePlaceholder || "Write Your Message*",
  );
  const submitButtonText = String(data.submitButtonText || "SEND MESSAGE");
  const submittingText = String(data.submittingText || "SENDING...");
  const successMessage = String(
    data.successMessage || "Message sent successfully!",
  );

  const faqs = (
    Array.isArray(data.faqs) && data.faqs.length
      ? data.faqs
      : Array.isArray(data.faqList) && data.faqList.length
        ? data.faqList
        : defaultFaqs
  ) as FaqItem[];

  const subjectOptions = (
    Array.isArray(data.subjectOptions) && data.subjectOptions.length
      ? data.subjectOptions
      : defaultSubjectOptions
  ) as SubjectOption[];

  const [openIndex, setOpenIndex] = useState<number | null>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitted(false);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      event.currentTarget.reset();
    }, 800);
  };

  return (
    <section
      className="bg-white py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="faq"
      data-editor-fields="accentColor subtitle title description formSubtitle formTitle namePlaceholder emailPlaceholder subjectPlaceholder phonePlaceholder messagePlaceholder submitButtonText faqs subjectOptions"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-10 px-6 max-md:flex-col max-md:gap-6 max-md:px-5">
        <div className="min-w-0 flex-1" data-editor-field="faqs">
          {faqs.map((faq, index) => {
            const question = String(faq.question || `Question ${index + 1}`);
            const answer = String(faq.answer || "");
            const isOpen = openIndex === index;

            return (
              <div key={String(faq.id || `${question}-${index}`)} className="mb-4">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full cursor-pointer items-center justify-between border-0 bg-[#f8f9fa] px-6 py-5 text-left text-[1.1rem] font-bold text-[#333]"
                >
                  <span>{question}</span>
                  <span className="flex items-center justify-center text-[var(--accent)]">
                    {isOpen ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <polyline points="19 12 12 19 5 12" />
                      </svg>
                    )}
                  </span>
                </button>
                {isOpen ? (
                  <div className="border border-t-0 border-[#f8f9fa] bg-white p-6 text-[0.95rem] leading-[1.6] text-[#666]">
                    {answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <aside className="w-[400px] shrink-0 max-md:w-full">
          <div className="mb-6">
            <div
              className="mb-2 text-[0.9rem] font-semibold text-[var(--accent)]"
              data-editor-field="subtitle"
            >
              {subtitle}
            </div>
            <h2
              className="mb-4 font-extrabold text-[#333]"
              data-editor-field="title"
            >
              {title}
            </h2>
            <div className="mb-8 flex items-center gap-1.5">
              <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            </div>
            <p
              className="text-[0.95rem] leading-[1.6] text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          </div>

          <div className="rounded bg-[#f8f9fa] p-10 max-md:p-6">
            <div className="mb-8 text-center">
              <div
                className="mb-2 text-[0.9rem] font-semibold text-[var(--accent)]"
                data-editor-field="formSubtitle"
              >
                {formSubtitle}
              </div>
              <h3
                className="text-[1.5rem] font-bold text-[#333]"
                data-editor-field="formTitle"
              >
                {formTitle}
              </h3>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              data-editor-no-inline
            >
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={namePlaceholder}
                  className="w-full rounded border-0 px-4 py-4 pr-12 text-[#333] outline-none"
                  data-editor-field="namePlaceholder"
                />
                <svg
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#666]"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={emailPlaceholder}
                  className="w-full rounded border-0 px-4 py-4 pr-12 text-[#333] outline-none"
                  data-editor-field="emailPlaceholder"
                />
                <svg
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#666]"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>

              <div className="relative">
                <select
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded border-0 px-4 py-4 pr-12 text-[#666] outline-none"
                  data-editor-field="subjectPlaceholder"
                >
                  <option value="" disabled>
                    {subjectPlaceholder}
                  </option>
                  {subjectOptions.map((option) => (
                    <option
                      key={String(option.value || option.label)}
                      value={String(option.value || "")}
                    >
                      {String(option.label || option.value || "")}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#666]"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  placeholder={phonePlaceholder}
                  className="w-full rounded border-0 px-4 py-4 pr-12 text-[#333] outline-none"
                  data-editor-field="phonePlaceholder"
                />
                <svg
                  className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#666]"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>

              <div className="relative">
                <textarea
                  required
                  rows={5}
                  placeholder={messagePlaceholder}
                  className="w-full resize-y rounded border-0 px-4 py-4 pr-12 text-[#333] outline-none"
                  data-editor-field="messagePlaceholder"
                />
                <svg
                  className="pointer-events-none absolute top-4 right-4 text-[#666]"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 w-full rounded border-0 bg-[var(--accent)] px-7 py-4 text-[0.95rem] font-medium text-white transition hover:-translate-y-0.5 hover:brightness-95 disabled:opacity-70"
                data-editor-field="submitButtonText"
              >
                {isSubmitting ? submittingText : submitButtonText}
                <span className="ml-2">→</span>
              </button>

              {submitted ? (
                <p
                  className="m-0 text-center text-sm font-medium text-[var(--accent)]"
                  data-editor-field="successMessage"
                >
                  {successMessage}
                </p>
              ) : null}
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
}
