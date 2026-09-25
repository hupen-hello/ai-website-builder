"use client";

import type { ElementType } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Clock,
  FileText,
  Home,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { quotePage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  ContactFeature4Item,
  EnquiryField4,
  EnquiryMethod4,
  QuotePage4Data,
  QuoteStep4Item,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  Award,
  Tag,
  Clock,
  ShieldCheck,
  FileText,
  Mail,
  MessageSquare,
  Home,
  Phone,
};

const defaultFeatures: ContactFeature4Item[] = [
  {
    id: "consultation",
    icon: "Award",
    title: "Expert Consultation",
    description:
      "Get professional advice from experienced real estate experts.",
  },
  {
    id: "price",
    icon: "Tag",
    title: "Best Price Guarantee",
    description: "We ensure you get the best value for your investment.",
  },
  {
    id: "response",
    icon: "Clock",
    title: "Quick Response",
    description: "Our team will get back to you within 24 hours.",
  },
  {
    id: "confidential",
    icon: "ShieldCheck",
    title: "100% Confidential",
    description: "Your information is safe and secure with us.",
  },
];

const defaultSteps: QuoteStep4Item[] = [
  {
    id: "step-1",
    num: "01",
    icon: "FileText",
    title: "Fill Out the Form",
    description: "Share your requirements by filling out our quick form.",
  },
  {
    id: "step-2",
    num: "02",
    icon: "Mail",
    title: "We Get in Touch",
    description: "Our experts will contact you to understand your needs.",
  },
  {
    id: "step-3",
    num: "03",
    icon: "MessageSquare",
    title: "Get Expert Advice",
    description: "Receive personalized solutions tailored to your goals.",
  },
  {
    id: "step-4",
    num: "04",
    icon: "Home",
    title: "Find Your Perfect Property",
    description: "We help you find the best property that fits your needs.",
  },
];

const defaultFields: EnquiryField4[] = [
  {
    label: "Full Name *",
    name: "fullName",
    type: "text",
    placeholder: "Enter your full name",
  },
  {
    label: "Email Address *",
    name: "email",
    type: "email",
    placeholder: "Enter your email address",
  },
  {
    label: "Phone Number *",
    name: "phone",
    type: "tel",
    placeholder: "Enter your phone number",
  },
  {
    label: "Property Type *",
    name: "propertyType",
    type: "select",
    placeholder: "Select property type",
    options: "Residential, Commercial, Industrial",
  },
  {
    label: "City *",
    name: "city",
    type: "text",
    placeholder: "Enter city",
  },
  {
    label: "Budget Range *",
    name: "budget",
    type: "select",
    placeholder: "Select budget range",
    options: "Under $500k, $500k - $1M, $1M - $5M, Over $5M",
  },
  {
    label: "Project Details *",
    name: "details",
    type: "textarea",
    placeholder: "Tell us more about your requirements...",
    fullWidth: true,
  },
];

const defaultMethods: EnquiryMethod4[] = [
  { id: "phone", icon: "Phone", label: "Phone Call" },
  { id: "email", icon: "Mail", label: "Email" },
  { id: "whatsapp", icon: "MessageSquare", label: "WhatsApp" },
];

const parseOptions = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function RealEstateQuotePage4({ data = {} }: SectionProps) {
  const authored = quotePage4Content.RealEstateQuotePage4;
  const content: QuotePage4Data = {
    ...authored,
    ...(data as QuotePage4Data),
  };
  const features = content.features?.length
    ? content.features
    : (authored.features ?? defaultFeatures);
  const steps = content.steps?.length
    ? content.steps
    : (authored.steps ?? defaultSteps);
  const fields = content.formFields?.length
    ? content.formFields
    : (authored.formFields ?? defaultFields);
  const methods = content.contactMethods?.length
    ? content.contactMethods
    : (authored.contactMethods ?? defaultMethods);
  const [selectedMethod, setSelectedMethod] = useState(
    methods[0]?.id ?? methods[0]?.label ?? "",
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  return (
    <>
      <section
        className="bg-white py-8 md:py-12"
        style={getAccentStyle(content.accentColor)}
        data-editor-section-label="quote"
        data-editor-fields="accentColor pretitle title description formSubmitLabel contactMethodLabel consentText privacyLabel privacyHref termsLabel termsHref featuresTitle howItWorksPretitle features formFields contactMethods steps"
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-col gap-12 lg:flex-row">
            <div className="flex w-full flex-col gap-8 lg:w-1/3">
              <div>
                <div className="mb-4 flex items-center gap-4">
                  <div className="h-[2px] w-12 bg-[var(--accent)]" />
                  <h3
                    className="text-[13px] font-bold tracking-widest text-secondary uppercase"
                    data-editor-field="pretitle"
                  >
                    {content.pretitle ?? "GET A FREE QUOTE"}
                  </h3>
                </div>
                <h2
                  className="mb-4 text-3xl font-bold text-secondary lg:text-4xl"
                  data-editor-field="title"
                >
                  {content.title ?? "Tell Us About Your Project"}
                </h2>
                <p
                  className="text-[15px] leading-relaxed text-gray-500"
                  data-editor-field="description"
                >
                  {content.description ??
                    "Fill out the form and our real estate experts will get in touch with you shortly with the best solutions tailored to your needs."}
                </p>
              </div>

              <div className="rounded-2xl border border-[#e6f2f4] bg-[#f2f9f9] p-8">
                <h3
                  className="mb-8 text-[18px] font-bold text-secondary"
                  data-editor-field="featuresTitle"
                >
                  {content.featuresTitle ?? "Why Get a Quote From Us?"}
                </h3>
                <div className="flex flex-col gap-8">
                  {features.map((feature) => {
                    const Icon =
                      (feature.icon ? iconMap[feature.icon] : null) || Award;
                    return (
                      <div
                        key={feature.id ?? feature.title}
                        className="flex items-start gap-4"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#e6f2f4] bg-white text-[var(--accent)] shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4
                            className="mb-1 text-[14px] font-bold text-secondary"
                            data-editor-field="title"
                          >
                            {feature.title}
                          </h4>
                          <p
                            className="text-[13px] text-gray-500"
                            data-editor-field="description"
                          >
                            {feature.description ?? feature.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="w-full rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] md:p-12 lg:w-2/3">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {fields.map((field) => {
                    const options = parseOptions(field.options);
                    const isWide = field.fullWidth || field.type === "textarea";

                    return (
                      <div
                        key={field.name ?? field.label}
                        className={isWide ? "md:col-span-2" : undefined}
                      >
                        <label className="mb-2 block text-[13px] font-bold text-secondary">
                          {field.label}
                        </label>
                        {field.type === "select" ? (
                          <select className="h-12 w-full appearance-none rounded border border-gray-200 bg-white px-4 text-[14px] focus:border-[var(--accent)] focus:outline-none">
                            <option value="">
                              {field.placeholder ?? "Select an option"}
                            </option>
                            {options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "textarea" ? (
                          <textarea
                            placeholder={field.placeholder}
                            rows={5}
                            className="w-full resize-none rounded border border-gray-200 p-4 text-[14px] focus:border-[var(--accent)] focus:outline-none"
                          />
                        ) : (
                          <input
                            type={
                              field.type === "email"
                                ? "email"
                                : field.type === "tel"
                                  ? "tel"
                                  : "text"
                            }
                            placeholder={field.placeholder}
                            className="h-12 w-full rounded border border-gray-200 px-4 text-[14px] focus:border-[var(--accent)] focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label
                    className="mb-3 block text-[13px] font-bold text-secondary"
                    data-editor-field="contactMethodLabel"
                  >
                    {content.contactMethodLabel ?? "Preferred Contact Method"}
                  </label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {methods.map((method) => {
                      const methodId = method.id ?? method.label;
                      const selected = selectedMethod === methodId;
                      const Icon =
                        (method.icon ? iconMap[method.icon] : null) || Phone;

                      return (
                        <label
                          key={methodId}
                          className={`relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-xl border p-4 transition-colors ${
                            selected
                              ? "border-[var(--accent)] bg-[#e6f2f4]/30"
                              : "border-gray-200 hover:border-[var(--accent)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="contact_method"
                            className="hidden"
                            checked={selected}
                            onChange={() => setSelectedMethod(methodId)}
                          />
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected
                                ? "border-[var(--accent)]"
                                : "border-gray-300"
                            }`}
                          >
                            {selected ? (
                              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                            ) : null}
                          </div>
                          <Icon
                            className={`h-5 w-5 ${
                              selected ? "text-[var(--accent)]" : "text-gray-500"
                            }`}
                          />
                          <span
                            className={`text-[13px] font-bold ${
                              selected ? "text-secondary" : "text-gray-600"
                            }`}
                            data-editor-field="label"
                          >
                            {method.label}
                          </span>
                          {selected ? (
                            <div className="absolute top-0 right-0 h-0 w-0 border-t-[20px] border-l-[20px] border-t-[var(--accent)] border-l-transparent" />
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="quote-terms"
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <label
                    htmlFor="quote-terms"
                    className="cursor-pointer text-[13px] font-medium text-gray-500"
                  >
                    <span data-editor-field="consentText">
                      {content.consentText ?? "I agree to the"}
                    </span>{" "}
                    <Link
                      href={content.privacyHref ?? "/template4/privacy"}
                      className="font-bold text-[var(--accent)] hover:underline"
                      data-editor-field="privacyLabel"
                    >
                      {content.privacyLabel ?? "Privacy Policy"}
                    </Link>{" "}
                    and{" "}
                    <Link
                      href={content.termsHref ?? "/template4/terms"}
                      className="font-bold text-[var(--accent)] hover:underline"
                      data-editor-field="termsLabel"
                    >
                      {content.termsLabel ?? "Terms & Conditions"}
                    </Link>
                    .
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded bg-[var(--accent)] px-8 py-3.5 text-[13px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)] md:w-auto"
                  >
                    <span data-editor-field="formSubmitLabel">
                      {content.formSubmitLabel ?? "SUBMIT REQUEST"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section
        className="bg-white py-8 md:py-12 pb-16"
        style={getAccentStyle(content.accentColor)}
        data-editor-section-label="quoteSteps"
        data-editor-fields="accentColor howItWorksPretitle steps"
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-[#f8fafa] p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] lg:p-16">
            <div className="relative z-10 mb-20 flex items-center justify-center gap-4">
              <div className="h-[2px] w-12 bg-[var(--accent)]" />
              <h3
                className="text-[13px] font-bold tracking-widest text-secondary uppercase"
                data-editor-field="howItWorksPretitle"
              >
                {content.howItWorksPretitle ?? "HOW IT WORKS"}
              </h3>
              <div className="h-[2px] w-12 bg-[var(--accent)]" />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-between gap-16 lg:flex-row lg:gap-0 lg:px-8">
              {steps.map((step, index) => {
                const Icon = (step.icon ? iconMap[step.icon] : null) || FileText;
                return (
                  <div
                    key={step.id ?? `${step.num}-${step.title}`}
                    className="relative flex w-full flex-col items-center text-center lg:w-1/4"
                  >
                    <div className="relative mb-6">
                      <div className="absolute -top-4 left-1/2 z-20 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-white">
                        {step.num}
                      </div>
                      <div className="relative z-10 pt-4 text-secondary">
                        <Icon className="h-14 w-14" strokeWidth={1.2} />
                      </div>
                    </div>
                    <h4
                      className="mb-2 text-[15px] font-bold text-secondary"
                      data-editor-field="title"
                    >
                      {step.title}
                    </h4>
                    <p
                      className="px-4 text-[13px] text-gray-500"
                      data-editor-field="description"
                    >
                      {step.description ?? step.desc}
                    </p>
                    {index !== steps.length - 1 ? (
                      <div className="absolute top-10 -right-8 hidden w-16 items-center justify-center text-gray-300 lg:flex">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
