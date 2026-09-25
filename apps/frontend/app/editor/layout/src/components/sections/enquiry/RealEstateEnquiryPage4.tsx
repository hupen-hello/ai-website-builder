"use client";

import type { ElementType } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Handshake,
  Headphones,
  Home,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Send,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { enquiryPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  ContactFeature4Item,
  EnquiryField4,
  EnquiryMethod4,
  EnquiryPage4Data,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  Users,
  Home,
  ShieldCheck,
  Lock,
  Headphones,
  User,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Handshake,
  Calendar,
  Search,
};

const defaultFeatures: ContactFeature4Item[] = [
  {
    id: "assistance",
    icon: "Users",
    title: "Personalized Assistance",
    description: "Get tailored solutions that match your needs.",
  },
  {
    id: "options",
    icon: "Home",
    title: "Wide Range of Options",
    description: "Explore the best properties with us.",
  },
  {
    id: "trusted",
    icon: "ShieldCheck",
    title: "Trusted by Thousands",
    description: "Reliable service with complete transparency.",
  },
  {
    id: "confidential",
    icon: "Lock",
    title: "100% Confidential",
    description: "Your information is safe and secure.",
  },
];

const defaultHighlights: ContactFeature4Item[] = [
  {
    id: "response",
    icon: "MessageSquare",
    title: "Instant Response",
    description: "We respond to all enquiries as quickly as possible.",
  },
  {
    id: "guidance",
    icon: "Handshake",
    title: "Expert Guidance",
    description: "Our experts provide the right advice.",
  },
  {
    id: "visit",
    icon: "Calendar",
    title: "Book a Visit",
    description: "Schedule a visit at your convenience.",
  },
  {
    id: "search",
    icon: "Search",
    title: "Find Your Perfect Property",
    description: "We help you find the best property that fits your goals.",
  },
];

const defaultFields: EnquiryField4[] = [
  {
    label: "Full Name *",
    name: "fullName",
    type: "text",
    placeholder: "Enter your full name",
    icon: "User",
  },
  {
    label: "Email Address *",
    name: "email",
    type: "email",
    placeholder: "Enter your email address",
    icon: "Mail",
  },
  {
    label: "Phone Number *",
    name: "phone",
    type: "tel",
    placeholder: "Enter your phone number",
    icon: "Phone",
  },
  {
    label: "Property Type *",
    name: "propertyType",
    type: "select",
    placeholder: "Select property type",
    options: "Apartment, Villa, Townhouse, Commercial, Land",
  },
  {
    label: "City *",
    name: "city",
    type: "text",
    placeholder: "Enter city",
    icon: "MapPin",
  },
  {
    label: "Budget Range *",
    name: "budget",
    type: "select",
    placeholder: "Select budget range",
    options: "Under $500k, $500k–$1M, $1M–$2M, $2M+",
  },
  {
    label: "Preferred Location",
    name: "location",
    type: "text",
    placeholder: "Enter preferred location",
    icon: "MapPin",
    fullWidth: true,
  },
  {
    label: "Message / Requirements *",
    name: "message",
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

export default function RealEstateEnquiryPage4({ data = {} }: SectionProps) {
  const authored = enquiryPage4Content.RealEstateEnquiryPage4;
  const content: EnquiryPage4Data = {
    ...authored,
    ...(data as EnquiryPage4Data),
  };
  const features = content.features?.length
    ? content.features
    : (authored.features ?? defaultFeatures);
  const highlights = content.highlights?.length
    ? content.highlights
    : (authored.highlights ?? defaultHighlights);
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
    <section
      className="bg-gray-50 py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="enquiry"
      data-editor-fields="accentColor pretitle title description image expertTitle expertDescription formTitle formSubmitLabel contactMethodLabel consentText privacyLabel privacyHref termsLabel termsHref features highlights formFields contactMethods"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-16 flex flex-col gap-12 lg:flex-row">
          <div className="w-full lg:w-5/12">
            <h4 className="mb-4 flex items-center gap-4 text-sm font-bold tracking-wider text-[var(--accent)] uppercase">
              <div className="h-px w-8 bg-[var(--accent)]" />
              <span data-editor-field="pretitle">
                {content.pretitle ?? "LET'S GET STARTED"}
              </span>
            </h4>
            <h2
              className="mb-6 text-4xl leading-tight font-extrabold text-secondary md:text-5xl"
              data-editor-field="title"
            >
              {content.title ??
                "Tell Us What You Need and We'll Take Care of the Rest."}
            </h2>
            <p
              className="mb-8 text-[16px] leading-relaxed text-gray-500"
              data-editor-field="description"
            >
              {content.description ??
                "Share a few details about your requirements and we'll get in touch with the best solutions."}
            </p>

            <div className="relative mb-8 h-[240px] overflow-hidden rounded-2xl shadow-lg">
              <img
                src={
                  content.image ??
                  "/categories/realestate/template4/unsplash-4723c13d.jpg"
                }
                alt={content.imageAlt ?? "Enquiry"}
                className="h-full w-full object-cover"
                data-editor-media="image"
                data-editor-media-type="image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute right-0 bottom-0 left-0 flex items-start gap-4 p-6 text-white">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[var(--accent)]">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h4
                    className="mb-1 text-[18px] font-bold"
                    data-editor-field="expertTitle"
                  >
                    {content.expertTitle ?? "Our Experts Are Ready to Help"}
                  </h4>
                  <p
                    className="text-[13px] text-gray-200"
                    data-editor-field="expertDescription"
                  >
                    {content.expertDescription ?? "Quick response within 24 hours."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {features.map((feature) => {
                const Icon =
                  (feature.icon ? iconMap[feature.icon] : null) || Users;

                return (
                  <div key={feature.id ?? feature.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e6f2f4] text-[var(--accent)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h5
                        className="mb-1 text-[15px] font-bold text-secondary"
                        data-editor-field="title"
                      >
                        {feature.title}
                      </h5>
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

          <div className="w-full lg:w-7/12">
            <div className="relative rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] md:p-12">
              <div className="mb-10 flex items-center justify-center gap-4 text-center">
                <div className="h-px w-10 bg-gray-300" />
                <div className="relative z-10 -my-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f2f4] text-[var(--accent)]">
                  <Send className="h-6 w-6" />
                </div>
                <h3
                  className="text-2xl font-extrabold tracking-tight text-secondary"
                  data-editor-field="formTitle"
                >
                  {content.formTitle ?? "Send Us an Enquiry"}
                </h3>
                <div className="h-px w-10 bg-gray-300" />
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {fields.map((field) => {
                    const Icon =
                      (field.icon ? iconMap[field.icon] : null) || User;
                    const options = parseOptions(field.options);
                    const isWide =
                      field.fullWidth ||
                      field.type === "textarea" ||
                      field.name === "location" ||
                      field.name === "message";

                    return (
                      <div
                        key={field.name ?? field.label}
                        className={isWide ? "md:col-span-2" : undefined}
                      >
                        <label className="mb-2 block text-[13px] font-bold text-secondary">
                          {field.label}
                        </label>
                        {field.type === "select" ? (
                          <select
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-[14px] text-gray-500 transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                            defaultValue=""
                          >
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
                            rows={4}
                            placeholder={field.placeholder}
                            className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-[14px] transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                          />
                        ) : (
                          <div className="relative">
                            <Icon className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                              type={
                                field.type === "email"
                                  ? "email"
                                  : field.type === "tel"
                                    ? "tel"
                                    : "text"
                              }
                              placeholder={field.placeholder}
                              className="w-full rounded-lg border border-gray-200 bg-white py-3.5 pr-4 pl-12 text-[14px] transition-all focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none"
                            />
                          </div>
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
                            name="contactMethod"
                            className="sr-only"
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

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="enquiry-terms"
                    className="mt-1 rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <label
                    htmlFor="enquiry-terms"
                    className="text-[13px] leading-relaxed text-gray-500"
                  >
                    <span data-editor-field="consentText">I agree to the</span>{" "}
                    <Link
                      href={content.privacyHref ?? "/template4/privacy"}
                      className="font-semibold text-[var(--accent)] hover:underline"
                      data-editor-field="privacyLabel"
                    >
                      {content.privacyLabel ?? "Privacy Policy"}
                    </Link>{" "}
                    and{" "}
                    <Link
                      href={content.termsHref ?? "/template4/terms"}
                      className="font-semibold text-[var(--accent)] hover:underline"
                      data-editor-field="termsLabel"
                    >
                      {content.termsLabel ?? "Terms & Conditions"}
                    </Link>
                    .
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-4 text-[14px] font-bold tracking-wider text-white uppercase transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)]"
                >
                  <span data-editor-field="formSubmitLabel">
                    {content.formSubmitLabel ?? "SUBMIT ENQUIRY"}
                  </span>
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] md:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => {
            const Icon =
              (item.icon ? iconMap[item.icon] : null) || MessageSquare;

            return (
              <div key={item.id ?? item.title} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f8fafa] text-[var(--accent)]">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h5
                    className="mb-1 text-[14px] font-bold text-secondary"
                    data-editor-field="title"
                  >
                    {item.title}
                  </h5>
                  <p
                    className="text-[12px] leading-relaxed text-gray-500"
                    data-editor-field="description"
                  >
                    {item.description ?? item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
