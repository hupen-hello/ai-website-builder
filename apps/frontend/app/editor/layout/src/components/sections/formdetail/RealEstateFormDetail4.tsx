"use client";

import type { ElementType } from "react";
import {
  ArrowRight,
  Clock,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  User,
} from "lucide-react";
import { contactPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { FormFieldData } from "../../../types/section";
import type { SectionProps } from "../../../types/section";
import FormFieldControl from "./FormFieldControl";

const fieldIconMap: Record<string, ElementType> = {
  text: User,
  email: Mail,
  tel: Phone,
  textarea: Pencil,
};

const defaultFields: FormFieldData[] = [
  { label: "Your Name", type: "text", placeholder: "Enter your full name" },
  { label: "Email Address", type: "email", placeholder: "Enter your email" },
  { label: "Phone Number", type: "tel", placeholder: "Enter your phone number" },
  { label: "Subject", type: "text", placeholder: "Select a subject" },
  { label: "Message", type: "textarea", placeholder: "Type your message here..." },
];

const renderMultiline = (content: string) =>
  content.split("\n").map((line, index) => (
    <span key={`${line}-${index}`}>
      {index > 0 ? <br /> : null}
      {line}
    </span>
  ));

export default function RealEstateFormDetail4({ data = {} }: SectionProps) {
  const authored = contactPage4Content.RealEstateFormDetail4;
  const content = {
    ...authored,
    ...data,
  };
  const fields =
    content.formFields?.length ? content.formFields : (authored.formFields ?? defaultFields);
  const inputClassName =
    "h-12 w-full rounded border border-gray-200 pr-4 pl-10 text-[14px] focus:border-[var(--accent)] focus:outline-none";
  const sidebarItems = [
    {
      icon: MapPin,
      title: content.locationTitle ?? "Our Office",
      content: content.location ?? "123 Luxury Lane,\nBeverly Hills, CA 90210,\nUnited States",
      field: "location",
    },
    {
      icon: Phone,
      title: content.phoneTitle ?? "Phone Number",
      content: content.phone ?? "+1 555-555-5555\n+1 555-444-4444",
      field: "phone",
    },
    {
      icon: Mail,
      title: content.emailTitle ?? "Email Address",
      content: content.email ?? "info@villaestates.com\nsupport@villaestates.com",
      field: "email",
    },
    {
      icon: Clock,
      title: content.hoursTitle ?? "Office Hours",
      content:
        content.hours ??
        "Mon - Fri: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed",
      field: "hours",
    },
  ];

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  return (
    <section
      className="bg-gray-50 py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="formDetail"
      data-editor-fields="accentColor title desc formSubmitLabel privacyText sidebarTitle locationTitle location phoneTitle phone emailTitle email hoursTitle hours formFields"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full rounded-xl border border-gray-100 bg-white p-8 shadow-sm md:p-12 lg:w-2/3">
            <h2
              className="mb-3 text-2xl font-bold text-secondary md:text-3xl"
              data-editor-field="title"
            >
              {content.title ?? "Get In Touch"}
            </h2>
            <p
              className="mb-8 text-[15px] text-gray-500"
              data-editor-field="desc"
            >
              {content.desc ??
                content.description ??
                "Have a question or need assistance? Fill out the form and our team will get back to you shortly."}
            </p>
            <div className="mb-8 h-1 w-12 bg-[var(--accent)]" />

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {fields.map((field) => {
                  const Icon = fieldIconMap[field.type ?? "text"] ?? User;
                  const isTextarea = field.type === "textarea";

                  return (
                    <div
                      key={field.label}
                      className={isTextarea ? "md:col-span-2" : undefined}
                    >
                      <label className="mb-2 block text-[13px] font-bold text-secondary">
                        {field.label} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Icon
                          className={`absolute left-4 h-4 w-4 text-gray-400 ${
                            isTextarea
                              ? "top-4"
                              : "top-1/2 -translate-y-1/2"
                          }`}
                        />
                        <FormFieldControl
                          field={field}
                          className={
                            isTextarea
                              ? "w-full resize-none rounded border border-gray-200 p-4 pl-10 text-[14px] focus:border-[var(--accent)] focus:outline-none"
                              : inputClassName
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-6 pt-2 md:flex-row md:items-center">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded bg-[var(--accent)] px-8 py-3 font-medium text-white transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_80%,black)] md:w-auto"
                >
                  <span data-editor-field="formSubmitLabel">
                    {content.formSubmitLabel ?? "Send Message"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 text-[13px] text-gray-500">
                  <Lock className="h-4 w-4" />
                  <span data-editor-field="privacyText">
                    {content.privacyText ??
                      "Your information is safe with us. We never share your details."}
                  </span>
                </div>
              </div>
            </form>
          </div>

          <div className="flex h-full w-full flex-col rounded-xl border border-gray-100 bg-white p-8 shadow-sm md:p-10 lg:w-1/3">
            <h3
              className="mb-6 border-b border-gray-100 pb-4 text-[17px] font-bold text-secondary"
              data-editor-field="sidebarTitle"
            >
              {content.sidebarTitle ?? "Contact Information"}
            </h3>

            <div className="flex flex-grow flex-col divide-y divide-gray-100">
              {sidebarItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.field}
                    className="flex items-start gap-4 py-6 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f2f9f9] text-[var(--accent)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="mb-1 text-[15px] font-bold text-secondary">
                        {item.title}
                      </h4>
                      <p
                        className="text-[14px] leading-relaxed text-gray-500"
                        data-editor-field={item.field}
                      >
                        {renderMultiline(item.content)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
