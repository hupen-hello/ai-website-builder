"use client";

import { useState } from "react";
import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type Option = { value?: string; label?: string };
type FeatureItem = { icon?: string; title?: string; desc?: string; description?: string };
type SidebarFeature = { title?: string; desc?: string; description?: string };

const defaultProjectTypes: Option[] = [
  { value: "new", label: "New Construction" },
  { value: "renovation", label: "Renovation" },
];
const defaultPropertyTypes: Option[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
];
const defaultContactOptions: Option[] = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
];
const defaultBudgetOptions: Option[] = [
  { value: "low", label: "Under $50,000" },
  { value: "mid", label: "$50,000 - $150,000" },
  { value: "high", label: "Over $150,000" },
];
const defaultBottomFeatures: FeatureItem[] = [
  { icon: "secure", title: "100% Secure", desc: "Your data is protected with the highest security." },
  { icon: "clock", title: "Quick Response", desc: "We respond to all quote requests within 24 hours." },
  { icon: "building", title: "No Obligation", desc: "Request a quote with no commitment." },
  { icon: "handshake", title: "Trusted Experts", desc: "12+ years of experience in real estate & construction." },
];
const defaultSidebarFeatures: SidebarFeature[] = [
  { title: "Accurate Estimation", desc: "Get precise and transparent pricing for your project." },
  { title: "Expert Consultation", desc: "Our experts will understand your needs and guide you better." },
  { title: "Customized Solutions", desc: "We provide tailored solutions that fit your budget and style." },
  { title: "On-Time Delivery", desc: "We value your time and ensure timely project completion." },
  { title: "Quality Assurance", desc: "We never compromise on quality and workmanship." },
];

function FeatureIcon({ type }: { type: string }) {
  if (type === "secure") {
    return (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </>
    );
  }
  if (type === "clock") {
    return (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    );
  }
  if (type === "building") {
    return (
      <>
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
        <path d="M6 12H4a2 2 0 0 0-2 2v8Z" />
        <path d="M18 20h2a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2Z" />
      </>
    );
  }
  return (
    <>
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87" />
    </>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-[0.9rem] font-semibold text-[#333]">
      {label}
      {required ? <span className="text-[var(--accent)]"> *</span> : null}
    </label>
  );
}

export default function RealEstateQuotePage5({ data = {} }: SectionProps) {
  const accent = String(data.accentColor || "#ff6b00");
  const tagline = String(data.tagline || data.pretitle || "GET STARTED");
  const title = String(data.title || "Share Your Requirements");
  const description = String(
    data.description ||
      "Fill out the form below and we'll get back to you with the best solution and estimate.",
  );

  const projectInformationLabel = String(
    data.projectInformationLabel || "Project Information",
  );
  const projectTypeLabel = String(data.projectTypeLabel || "Project Type");
  const projectTypePlaceholder = String(
    data.projectTypePlaceholder || "Select project type",
  );
  const propertyTypeLabel = String(data.propertyTypeLabel || "Property Type");
  const propertyTypePlaceholder = String(
    data.propertyTypePlaceholder || "Select property type",
  );
  const projectLocationLabel = String(
    data.projectLocationLabel || "Project Location",
  );
  const projectLocationPlaceholder = String(
    data.projectLocationPlaceholder || "Enter project location",
  );
  const estimatedAreaLabel = String(
    data.estimatedAreaLabel || "Estimated Area (sq ft)",
  );
  const estimatedAreaPlaceholder = String(
    data.estimatedAreaPlaceholder || "Enter area in sq ft",
  );
  const yourDetailsLabel = String(data.yourDetailsLabel || "Your Details");
  const fullNameLabel = String(data.fullNameLabel || "Full Name");
  const fullNamePlaceholder = String(
    data.fullNamePlaceholder || "Enter your full name",
  );
  const emailAddressLabel = String(data.emailAddressLabel || "Email Address");
  const emailAddressPlaceholder = String(
    data.emailAddressPlaceholder || "Enter your email",
  );
  const phoneNumberLabel = String(data.phoneNumberLabel || "Phone Number");
  const phoneNumberPlaceholder = String(
    data.phoneNumberPlaceholder || "Enter your phone number",
  );
  const preferredContactLabel = String(
    data.preferredContactLabel || "Preferred Contact",
  );
  const preferredContactPlaceholder = String(
    data.preferredContactPlaceholder || "Select preferred contact",
  );
  const projectRequirementsLabel = String(
    data.projectRequirementsLabel || "Project Requirements",
  );
  const preferredBudgetLabel = String(
    data.preferredBudgetLabel || "Preferred Budget Range",
  );
  const preferredBudgetPlaceholder = String(
    data.preferredBudgetPlaceholder || "Select budget range",
  );
  const expectedStartDateLabel = String(
    data.expectedStartDateLabel || "Expected Start Date",
  );
  const expectedStartDatePlaceholder = String(
    data.expectedStartDatePlaceholder || "mm/dd/yyyy",
  );
  const projectDescriptionLabel = String(
    data.projectDescriptionLabel || "Tell us about your project",
  );
  const projectDescriptionPlaceholder = String(
    data.projectDescriptionPlaceholder ||
      "Describe your project, requirements, and any specific needs...",
  );
  const submitButtonText = String(data.submitButtonText || "SUBMIT REQUEST");
  const submittingText = String(data.submittingText || "SUBMITTING...");
  const securityDisclaimer = String(
    data.securityDisclaimer ||
      "Your information is 100% secure and will not be shared.",
  );
  const successMessage = String(
    data.successMessage ||
      "Quote request submitted successfully! Our team will contact you shortly.",
  );

  const sidebarTitle = String(
    data.sidebarTitle || "Why Get a Quote From Us?",
  );
  const helpTitle = String(data.helpTitle || "Need Immediate Help?");
  const helpDescription = String(
    data.helpDescription || "We are available 24/7 to answer your queries.",
  );
  const helpPhone = String(data.helpPhone || "+91 123 456 7890");
  const helpPhoneLink = String(
    data.helpPhoneLink || `tel:${helpPhone.replace(/\s+/g, "")}`,
  );

  const projectTypeOptions = (
    Array.isArray(data.projectTypeOptions) && data.projectTypeOptions.length
      ? data.projectTypeOptions
      : defaultProjectTypes
  ) as Option[];
  const propertyTypeOptions = (
    Array.isArray(data.propertyTypeOptions) && data.propertyTypeOptions.length
      ? data.propertyTypeOptions
      : defaultPropertyTypes
  ) as Option[];
  const preferredContactOptions = (
    Array.isArray(data.preferredContactOptions) &&
    data.preferredContactOptions.length
      ? data.preferredContactOptions
      : defaultContactOptions
  ) as Option[];
  const budgetOptions = (
    Array.isArray(data.budgetOptions) && data.budgetOptions.length
      ? data.budgetOptions
      : defaultBudgetOptions
  ) as Option[];
  const sidebarFeatures = (
    Array.isArray(data.sidebarFeatures) && data.sidebarFeatures.length
      ? data.sidebarFeatures
      : defaultSidebarFeatures
  ) as SidebarFeature[];
  const bottomFeatures = (
    Array.isArray(data.features) && data.features.length
      ? data.features
      : defaultBottomFeatures
  ) as FeatureItem[];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [descriptionLength, setDescriptionLength] = useState(0);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitted(false);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setDescriptionLength(0);
      event.currentTarget.reset();
    }, 800);
  };

  return (
    <>
      <section
        className="bg-[#fafafa] py-[30px]"
        style={getAccentStyle(accent)}
        data-editor-section-label="quote"
        data-editor-fields="accentColor tagline title description projectInformationLabel yourDetailsLabel projectRequirementsLabel submitButtonText sidebarTitle helpTitle helpPhone sidebarFeatures features"
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
              className="mb-4 font-extrabold text-[#333]"
              data-editor-field="title"
            >
              {title}
            </h2>
            <div className="mx-auto mb-8 flex items-center justify-center gap-1.5">
              <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            </div>
            <p
              className="mx-auto max-w-[500px] text-[#666]"
              data-editor-field="description"
            >
              {description}
            </p>
          </div>

          <div className="flex items-start gap-10 max-md:flex-col max-md:gap-6">
            <div className="min-w-0 flex-1 rounded-lg border border-[#eaeaea] bg-white p-10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] max-md:p-6">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-10"
                data-editor-no-inline
              >
                <div>
                  <h3
                    className="mb-6 flex items-center gap-3 text-[1.2rem] font-bold text-[#333]"
                    data-editor-field="projectInformationLabel"
                  >
                    <span className="text-[var(--accent)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                    </span>
                    {projectInformationLabel}
                  </h3>
                  <div className="flex flex-col gap-5">
                    <div className="flex gap-5 max-md:flex-col">
                      <div className="flex-1">
                        <FieldLabel label={projectTypeLabel} required />
                        <div className="relative">
                          <select required defaultValue="" className="w-full appearance-none rounded border border-[#eaeaea] bg-white p-3 pr-10 outline-none">
                            <option value="" disabled>{projectTypePlaceholder}</option>
                            {projectTypeOptions.map((opt) => (
                              <option key={String(opt.value || opt.label)} value={String(opt.value || "")}>{String(opt.label || "")}</option>
                            ))}
                          </select>
                          <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <FieldLabel label={propertyTypeLabel} required />
                        <div className="relative">
                          <select required defaultValue="" className="w-full appearance-none rounded border border-[#eaeaea] bg-white p-3 pr-10 outline-none">
                            <option value="" disabled>{propertyTypePlaceholder}</option>
                            {propertyTypeOptions.map((opt) => (
                              <option key={String(opt.value || opt.label)} value={String(opt.value || "")}>{String(opt.label || "")}</option>
                            ))}
                          </select>
                          <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-5 max-md:flex-col">
                      <div className="flex-1">
                        <FieldLabel label={projectLocationLabel} required />
                        <input required type="text" placeholder={projectLocationPlaceholder} className="w-full rounded border border-[#eaeaea] p-3 outline-none" />
                      </div>
                      <div className="flex-1">
                        <FieldLabel label={estimatedAreaLabel} required />
                        <input required type="number" placeholder={estimatedAreaPlaceholder} className="w-full rounded border border-[#eaeaea] p-3 outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3
                    className="mb-6 flex items-center gap-3 text-[1.2rem] font-bold text-[#333]"
                    data-editor-field="yourDetailsLabel"
                  >
                    <span className="text-[var(--accent)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    {yourDetailsLabel}
                  </h3>
                  <div className="flex flex-col gap-5">
                    <div className="flex gap-5 max-md:flex-col">
                      <div className="flex-1">
                        <FieldLabel label={fullNameLabel} required />
                        <div className="relative">
                          <input required type="text" placeholder={fullNamePlaceholder} className="w-full rounded border border-[#eaeaea] p-3 pr-10 outline-none" />
                          <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <FieldLabel label={emailAddressLabel} required />
                        <div className="relative">
                          <input required type="email" placeholder={emailAddressPlaceholder} className="w-full rounded border border-[#eaeaea] p-3 pr-10 outline-none" />
                          <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-5 max-md:flex-col">
                      <div className="flex-1">
                        <FieldLabel label={phoneNumberLabel} required />
                        <div className="relative">
                          <input required type="tel" placeholder={phoneNumberPlaceholder} className="w-full rounded border border-[#eaeaea] p-3 pr-10 outline-none" />
                          <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <FieldLabel label={preferredContactLabel} />
                        <div className="relative">
                          <select defaultValue="" className="w-full appearance-none rounded border border-[#eaeaea] bg-white p-3 pr-10 outline-none">
                            <option value="" disabled>{preferredContactPlaceholder}</option>
                            {preferredContactOptions.map((opt) => (
                              <option key={String(opt.value || opt.label)} value={String(opt.value || "")}>{String(opt.label || "")}</option>
                            ))}
                          </select>
                          <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3
                    className="mb-6 flex items-center gap-3 text-[1.2rem] font-bold text-[#333]"
                    data-editor-field="projectRequirementsLabel"
                  >
                    <span className="text-[var(--accent)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </span>
                    {projectRequirementsLabel}
                  </h3>
                  <div className="flex flex-col gap-5">
                    <div className="flex gap-5 max-md:flex-col">
                      <div className="flex-1">
                        <FieldLabel label={preferredBudgetLabel} />
                        <div className="relative">
                          <select defaultValue="" className="w-full appearance-none rounded border border-[#eaeaea] bg-white p-3 pr-10 outline-none">
                            <option value="" disabled>{preferredBudgetPlaceholder}</option>
                            {budgetOptions.map((opt) => (
                              <option key={String(opt.value || opt.label)} value={String(opt.value || "")}>{String(opt.label || "")}</option>
                            ))}
                          </select>
                          <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <FieldLabel label={expectedStartDateLabel} />
                        <div className="relative">
                          <input type="text" placeholder={expectedStartDatePlaceholder} className="w-full rounded border border-[#eaeaea] p-3 pr-10 outline-none" />
                          <svg className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#666]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <FieldLabel label={projectDescriptionLabel} required />
                      <textarea
                        required
                        rows={5}
                        maxLength={500}
                        placeholder={projectDescriptionPlaceholder}
                        onChange={(event) =>
                          setDescriptionLength(event.target.value.length)
                        }
                        className="w-full resize-y rounded border border-[#eaeaea] p-3 outline-none"
                      />
                      <div className="mt-1 text-right text-[0.8rem] text-[#666]">
                        {descriptionLength}/500
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded border-0 bg-[var(--accent)] px-7 py-4 text-[1.1rem] font-medium text-white transition hover:-translate-y-0.5 hover:brightness-95 disabled:opacity-70"
                  data-editor-field="submitButtonText"
                >
                  {isSubmitting ? submittingText : submitButtonText}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>

                <div
                  className="flex items-center justify-center gap-2 text-[0.85rem] text-[#666]"
                  data-editor-field="securityDisclaimer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  {securityDisclaimer}
                </div>

                {submitted ? (
                  <p className="m-0 text-center text-sm font-medium text-[var(--accent)]" data-editor-field="successMessage">
                    {successMessage}
                  </p>
                ) : null}
              </form>
            </div>

            <aside className="flex w-[350px] shrink-0 flex-col gap-6 max-md:w-full">
              <div className="rounded-lg bg-[rgba(255,107,0,0.05)] p-8">
                <h3
                  className="mb-6 text-[1.25rem] font-bold text-[#333]"
                  data-editor-field="sidebarTitle"
                >
                  {sidebarTitle}
                </h3>
                <div className="flex flex-col gap-6" data-editor-field="sidebarFeatures">
                  {sidebarFeatures.map((feature) => (
                    <div key={String(feature.title)} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white opacity-80">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div>
                        <div className="mb-1 text-[0.95rem] font-semibold text-[#333]">
                          {String(feature.title || "")}
                        </div>
                        <div className="text-[0.85rem] leading-[1.5] text-[#666]">
                          {String(feature.desc || feature.description || "")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-lg bg-[var(--accent)] p-8 text-white">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                  </svg>
                </div>
                <div>
                  <div className="mb-1 text-base font-semibold" data-editor-field="helpTitle">
                    {helpTitle}
                  </div>
                  <a
                    href={helpPhoneLink}
                    className="mb-2 block text-[1.5rem] font-bold text-white no-underline transition-opacity hover:opacity-80"
                    data-editor-field="helpPhone"
                  >
                    {helpPhone}
                  </a>
                  <div className="text-[0.85rem] opacity-90" data-editor-field="helpDescription">
                    {helpDescription}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-[#fafafa] pb-5" style={getAccentStyle(accent)}>
        <div className="mx-auto w-full max-w-[1320px] px-6 max-md:px-5">
          <div
            className="grid grid-cols-4 gap-0 rounded-2xl border border-[#eaeaea] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)] max-[992px]:grid-cols-2 max-[992px]:gap-6 max-md:grid-cols-1"
            data-box-layout-grid="grid"
            data-editor-field="features"
          >
            {bottomFeatures.map((feature) => (
              <div
                key={String(feature.title)}
                className="flex items-center gap-5"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[rgba(255,107,0,0.1)] text-[var(--accent)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <FeatureIcon type={String(feature.icon || "handshake")} />
                  </svg>
                </div>
                <div>
                  <div className="mb-1.5 text-[1.05rem] font-bold text-[#333]">
                    {String(feature.title || "")}
                  </div>
                  <div className="text-[0.9rem] leading-[1.5] text-[#666]">
                    {String(feature.desc || feature.description || "")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
