"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import type { FormFieldData, SectionProps } from "../../../types/section";
import { leadFieldName } from "../../../lib/leadFormFields";
import LeadFormWrapper from "../formdetail/LeadFormWrapper";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

const getFields = (value: unknown): FormFieldData[] =>
  Array.isArray(value)
    ? value.filter(
      (item): item is FormFieldData =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as FormFieldData).label === "string",
    )
    : [];

export default function RealEstateContactPage1({ data = {}, leadCapture }: SectionProps) {
  const privacyHref = publishedHrefFromData("/privacy", data);
  const fields = getFields(data.formFields);
  const contact = data.footerContact;
  const [submitted, setSubmitted] = useState(false);

  return (
      <section
        data-editor-section-label="Contact Details and Form"
        data-editor-fields="contactPretitle contactTitle footerContact phoneLabel emailLabel officeLabel formPretitle formTitle formFields consentText privacyPolicyLabel formSubmitLabel successTitle successMessage successButtonLabel"
        data-editor-form-fields="formPretitle formTitle formFields consentText privacyPolicyLabel formSubmitLabel successTitle successMessage successButtonLabel"
        className="bg-[#f8f6f1] px-5 py-14 text-[#141414] md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl items-start gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
          <aside className="rounded-[1.25rem] bg-[#14251f] p-7 text-white md:p-9 lg:sticky lg:top-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e9ad91]">
              {typeof data.contactPretitle === "string" ? data.contactPretitle : "Reach our advisors"}
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-[-0.025em]">
              {typeof data.contactTitle === "string" ? data.contactTitle : "We are ready to help with your next move."}
            </h2>
            <div className="mt-8 space-y-3">
              {contact?.phone && (
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-start gap-3 rounded-xl border border-white/12 p-4 transition hover:bg-white/5">
                  <Phone size={18} className="mt-0.5 shrink-0 text-[#e9ad91]" />
                  <span><span className="block text-[10px] uppercase tracking-[0.15em] text-white/40">{typeof data.phoneLabel === "string" ? data.phoneLabel : "Phone"}</span><span className="mt-1 block text-sm text-white/80">{contact.phone}</span></span>
                </a>
              )}
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="flex items-start gap-3 rounded-xl border border-white/12 p-4 transition hover:bg-white/5">
                  <Mail size={18} className="mt-0.5 shrink-0 text-[#e9ad91]" />
                  <span className="min-w-0"><span className="block text-[10px] uppercase tracking-[0.15em] text-white/40">{typeof data.emailLabel === "string" ? data.emailLabel : "Email"}</span><span className="mt-1 block break-all text-sm text-white/80">{contact.email}</span></span>
                </a>
              )}
              {contact?.location && (
                <div className="flex items-start gap-3 rounded-xl border border-white/12 p-4">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-[#e9ad91]" />
                  <span><span className="block text-[10px] uppercase tracking-[0.15em] text-white/40">{typeof data.officeLabel === "string" ? data.officeLabel : "Office"}</span><span className="mt-1 block text-sm leading-6 text-white/80">{contact.location}</span></span>
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-[1.25rem] border border-[#141414]/10 bg-white p-6 md:p-9">
            {submitted ? (
              <div className="py-16 text-center" role="status">
                <CheckCircle2 size={42} className="mx-auto text-[#a4472f]" />
                <h2 className="mt-5 text-2xl font-semibold">{typeof data.successTitle === "string" ? data.successTitle : "Message received."}</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#141414]/60">
                  {data.successMessage ?? "Thank you. A HAUS Group advisor will contact you shortly."}
                </p>
                <button type="button" onClick={() => setSubmitted(false)} className="mt-6 rounded-full bg-[#141414] px-6 py-3 text-sm font-semibold text-white">{typeof data.successButtonLabel === "string" ? data.successButtonLabel : "Send another message"}</button>
              </div>
            ) : leadCapture ? (
              <LeadFormWrapper
                leadCapture={leadCapture}
                onSuccess={() => setSubmitted(true)}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a4472f]">{typeof data.formPretitle === "string" ? data.formPretitle : "Property enquiry"}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] md:text-3xl">{typeof data.formTitle === "string" ? data.formTitle : "Tell us what you are looking for."}</h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  {fields.map((field) => {
                    const id = `contact-${field.label
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}`;

                    const className = field.fullWidth
                      ? "sm:col-span-2"
                      : "";

                    return (
                      <label
                        key={field.label}
                        htmlFor={id}
                        className={`text-sm font-semibold ${className}`}
                      >
                        {field.label}

                        {field.type === "textarea" ? (
                          <textarea
                            id={id}
                            name={leadFieldName(field.label)}
                            required
                            rows={5}
                            placeholder={field.placeholder}
                            className="mt-2 w-full resize-none rounded-xl border border-[#141414]/12 bg-[#f8f6f1] px-4 py-3 text-sm outline-none focus:border-[#a4472f]"
                          />
                        ) : (
                          <input
                            id={id}
                            name={leadFieldName(field.label)}
                            required
                            type={field.type ?? "text"}
                            placeholder={field.placeholder}
                            className="mt-2 w-full rounded-xl border border-[#141414]/12 bg-[#f8f6f1] px-4 py-3 text-sm outline-none focus:border-[#a4472f]"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
                <label className="mt-6 flex items-start gap-3 text-xs leading-6 text-[#141414]/55">
                  <input required type="checkbox" className="mt-1 accent-[#a4472f]" />
                  <span>{typeof data.consentText === "string" ? data.consentText : "I agree that HAUS Group may contact me about this enquiry. See our"} <Link href={privacyHref} className="font-semibold underline underline-offset-2">{typeof data.privacyPolicyLabel === "string" ? data.privacyPolicyLabel : "Privacy Policy"}</Link>.</span>
                </label>
                <button type="submit" className="mt-6 rounded-full bg-[#141414] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#a4472f]">{data.formSubmitLabel ?? "Send message"}</button>
              </LeadFormWrapper>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a4472f]">{typeof data.formPretitle === "string" ? data.formPretitle : "Property enquiry"}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.025em] md:text-3xl">{typeof data.formTitle === "string" ? data.formTitle : "Tell us what you are looking for."}</h2>
                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  {fields.map((field) => {
                    const id = `contact-${field.label
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")}`;

                    const className = field.fullWidth
                      ? "sm:col-span-2"
                      : "";

                    return (
                      <label
                        key={field.label}
                        htmlFor={id}
                        className={`text-sm font-semibold ${className}`}
                      >
                        {field.label}

                        {field.type === "textarea" ? (
                          <textarea
                            id={id}
                            name={id}
                            required
                            rows={5}
                            placeholder={field.placeholder}
                            className="mt-2 w-full resize-none rounded-xl border border-[#141414]/12 bg-[#f8f6f1] px-4 py-3 text-sm outline-none focus:border-[#a4472f]"
                          />
                        ) : (
                          <input
                            id={id}
                            name={id}
                            required
                            type={field.type ?? "text"}
                            placeholder={field.placeholder}
                            className="mt-2 w-full rounded-xl border border-[#141414]/12 bg-[#f8f6f1] px-4 py-3 text-sm outline-none focus:border-[#a4472f]"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
                <label className="mt-6 flex items-start gap-3 text-xs leading-6 text-[#141414]/55">
                  <input required type="checkbox" className="mt-1 accent-[#a4472f]" />
                  <span>{typeof data.consentText === "string" ? data.consentText : "I agree that HAUS Group may contact me about this enquiry. See our"} <Link href={privacyHref} className="font-semibold underline underline-offset-2">{typeof data.privacyPolicyLabel === "string" ? data.privacyPolicyLabel : "Privacy Policy"}</Link>.</span>
                </label>
                <button type="submit" className="mt-6 rounded-full bg-[#141414] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#a4472f]">{data.formSubmitLabel ?? "Send message"}</button>
              </form>
            )}
          </section>
        </div>
      </section>
  );
}
