"use client";

import { useState } from "react";
import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type SubjectOption = {
  value?: string;
  label?: string;
};

const defaultSubjectOptions: SubjectOption[] = [
  { value: "general", label: "General Enquiry" },
  { value: "support", label: "Support" },
];

export default function RealEstateContactPage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const headingStart = String(data.headingStart || "Get In");
  const headingHighlight = String(data.headingHighlight || "Touch");
  const introText = String(
    data.introText ||
      "We're here to help! Whether you have a question, need support, or want to discuss your next property investment, feel free to reach out to us.",
  );
  const callLabel = String(data.callLabel || "Call Us");
  const emailLabel = String(data.emailLabel || "Email Us");
  const visitLabel = String(data.visitLabel || "Visit Us");
  const hoursLabel = String(data.hoursLabel || "Working Hours");
  const phone1 = String(data.phone1 || "+91 123 456 7890");
  const phone2 = String(data.phone2 || "+91 987 654 3210");
  const email1 = String(data.email1 || "info@associatesproperty.com");
  const email2 = String(data.email2 || "support@associatesproperty.com");
  const address = String(
    data.address ||
      "123, Business Park, Sector 62, Noida, Uttar Pradesh - 201301, India",
  );
  const hours = String(
    data.hours || "Monday - Saturday\n10:00 AM - 07:00 PM",
  );

  const formTitleNormal = String(data.formTitleNormal || data.titleNormal || "Send Us");
  const formTitleHighlight = String(
    data.formTitleHighlight || data.titleHighlight || "A Message",
  );
  const namePlaceholder = String(data.namePlaceholder || "Your Name*");
  const emailPlaceholder = String(data.emailPlaceholder || "Your Email*");
  const phonePlaceholder = String(data.phonePlaceholder || "Your Phone*");
  const subjectPlaceholder = String(
    data.subjectPlaceholder || "Select Subject*",
  );
  const messagePlaceholder = String(
    data.messagePlaceholder || "Your Message*",
  );
  const submitButtonText = String(data.submitButtonText || "Send Message");
  const submittingText = String(data.submittingText || "Sending...");
  const successMessage = String(
    data.successMessage ||
      "Message sent successfully! We will get back to you soon.",
  );

  const mapPrefix = String(data.mapPrefix || "Our");
  const mapTitle = String(data.mapTitle || "Location");
  const mapEmbed = String(
    data.mapEmbed ||
      `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`,
  );

  const ctaTitleStart = String(data.ctaTitleStart || "Need Immediate ");
  const ctaTitleHighlight = String(data.ctaTitleHighlight || "Assistance?");
  const ctaDescription = String(
    data.ctaDescription ||
      "Our team is available to help you. Call us now for quick support and details.",
  );
  const ctaPhone = String(data.ctaPhone || phone1);
  const ctaPhoneLink = String(
    data.ctaPhoneLink || `tel:${ctaPhone.replace(/\s+/g, "")}`,
  );
  const showCta = data.showCta !== false;

  const subjectOptions = (
    Array.isArray(data.subjectOptions) && data.subjectOptions.length
      ? data.subjectOptions
      : defaultSubjectOptions
  ) as SubjectOption[];

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
      className="bg-[#fafafa] py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="contact"
      data-editor-fields="accentColor headingStart headingHighlight introText callLabel emailLabel visitLabel hoursLabel phone1 phone2 email1 email2 address hours formTitleNormal formTitleHighlight namePlaceholder emailPlaceholder phonePlaceholder subjectPlaceholder messagePlaceholder submitButtonText mapPrefix mapTitle mapEmbed ctaTitleStart ctaTitleHighlight ctaDescription ctaPhone subjectOptions"
    >
      <div className="mx-auto flex w-full max-w-[1320px] items-start gap-8 px-6 max-md:flex-col max-md:gap-6 max-md:px-5">
        <aside className="w-[400px] shrink-0 max-md:w-full">
          <div
            className="mb-4 font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
            data-editor-field="headingStart"
          >
            {headingStart}{" "}
            <span data-editor-field="headingHighlight">{headingHighlight}</span>
          </div>
          <div className="mb-6 h-0.5 w-10 bg-[var(--accent)]" />
          <p
            className="mb-6 text-[1.05rem] leading-[1.8] text-[#666]"
            data-editor-field="introText"
          >
            {introText}
          </p>

          <div className="flex flex-col gap-8">
            <div className="flex gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(255,107,0,0.1)] text-[var(--accent)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-[1.2rem] font-bold text-[#333]" data-editor-field="callLabel">
                  {callLabel}
                </h3>
                <div className="leading-[1.6] text-[#666]">
                  <div data-editor-field="phone1">{phone1}</div>
                  <div data-editor-field="phone2">{phone2}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(255,107,0,0.1)] text-[var(--accent)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-[1.2rem] font-bold text-[#333]" data-editor-field="emailLabel">
                  {emailLabel}
                </h3>
                <div className="leading-[1.6] text-[#666]">
                  <div data-editor-field="email1">{email1}</div>
                  <div data-editor-field="email2">{email2}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(255,107,0,0.1)] text-[var(--accent)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-[1.2rem] font-bold text-[#333]" data-editor-field="visitLabel">
                  {visitLabel}
                </h3>
                <div className="leading-[1.6] text-[#666]" data-editor-field="address">
                  {address}
                </div>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[rgba(255,107,0,0.1)] text-[var(--accent)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-[1.2rem] font-bold text-[#333]" data-editor-field="hoursLabel">
                  {hoursLabel}
                </h3>
                <div
                  className="whitespace-pre-line leading-[1.6] text-[#666]"
                  data-editor-field="hours"
                >
                  {hours}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-[#eaeaea] bg-white p-10 shadow-[0_20px_40px_rgba(0,0,0,0.05)] max-md:p-6">
            <div
              className="mb-4 text-[1.5rem] font-semibold text-[var(--accent)]"
              data-editor-field="formTitleNormal"
            >
              {formTitleNormal}{" "}
              <span data-editor-field="formTitleHighlight">{formTitleHighlight}</span>
            </div>
            <div className="mb-8 h-0.5 w-10 bg-[var(--accent)]" />

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
              data-editor-no-inline
            >
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={namePlaceholder}
                  className="w-full rounded border border-[#eaeaea] py-4 pr-4 pl-14 text-[#333] outline-none"
                  data-editor-field="namePlaceholder"
                />
                <svg className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-[#666]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder={emailPlaceholder}
                  className="w-full rounded border border-[#eaeaea] py-4 pr-4 pl-14 text-[#333] outline-none"
                  data-editor-field="emailPlaceholder"
                />
                <svg className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-[#666]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>

              <div className="relative">
                <input
                  type="tel"
                  placeholder={phonePlaceholder}
                  className="w-full rounded border border-[#eaeaea] py-4 pr-4 pl-14 text-[#333] outline-none"
                  data-editor-field="phonePlaceholder"
                />
                <svg className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-[#666]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>

              <div className="relative">
                <select
                  required
                  defaultValue=""
                  className="w-full appearance-none rounded border border-[#eaeaea] bg-white py-4 pr-10 pl-14 text-[#333] outline-none"
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
                <svg className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-[#666]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <svg className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              <div className="relative">
                <textarea
                  required
                  rows={6}
                  placeholder={messagePlaceholder}
                  className="w-full resize-y rounded border border-[#eaeaea] py-4 pr-4 pl-14 text-[#333] outline-none"
                  data-editor-field="messagePlaceholder"
                />
                <svg className="pointer-events-none absolute top-4 left-5 text-[#666]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-fit items-center justify-center gap-2 rounded border-0 bg-[var(--accent)] px-8 py-4 text-[0.95rem] font-medium text-white transition hover:-translate-y-0.5 hover:brightness-95 disabled:opacity-70 max-md:w-full"
                data-editor-field="submitButtonText"
              >
                {isSubmitting ? submittingText : submitButtonText}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>

              {submitted ? (
                <p
                  className="m-0 text-sm font-medium text-[var(--accent)]"
                  data-editor-field="successMessage"
                >
                  {successMessage}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 w-full max-w-[1320px] px-6 max-md:mt-12 max-md:overflow-x-hidden max-md:px-5">
        <div
          className="mb-4 text-[1.5rem] font-semibold text-[var(--accent)]"
          data-editor-field="mapPrefix"
        >
          {mapPrefix}{" "}
          <span data-editor-field="mapTitle">{mapTitle}</span>
        </div>
        <div className="mb-8 h-0.5 w-10 bg-[var(--accent)]" />

        <div className="relative mb-6 h-[400px] overflow-hidden rounded-lg bg-[#e5e3df]">
          <iframe
            src={mapEmbed}
            title={`${mapPrefix} ${mapTitle}`}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            data-editor-field="mapEmbed"
          />
        </div>

        {showCta ? (
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-lg border border-[#ffe4d6] bg-[#fff7f0] px-10 py-8 max-md:flex-col max-md:items-stretch max-md:gap-6 max-md:px-6 max-md:py-6 max-md:text-center">
            <div className="flex items-center gap-6 max-md:flex-col max-md:gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_15px_rgba(255,107,0,0.1)] max-md:mx-auto">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-[1.4rem] font-bold text-[#111]">
                  <span data-editor-field="ctaTitleStart">{ctaTitleStart}</span>
                  <span className="text-[var(--accent)]" data-editor-field="ctaTitleHighlight">
                    {ctaTitleHighlight}
                  </span>
                </h3>
                <p className="m-0 text-[0.95rem] text-[#666]" data-editor-field="ctaDescription">
                  {ctaDescription}
                </p>
              </div>
            </div>

            <a
              href={ctaPhoneLink}
              className="inline-flex items-center gap-2.5 whitespace-nowrap rounded border border-[var(--accent)] bg-white px-6 py-3 text-[1.05rem] font-semibold text-[var(--accent)] no-underline max-md:justify-center"
              data-editor-field="ctaPhone"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
