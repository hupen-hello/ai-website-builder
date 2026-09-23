import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SectionProps } from "./../../../types/section";
import InlineRichText from "../../builder/InlineRichText";
import LeadFormWrapper from "../formdetail/LeadFormWrapper";
import { leadFieldName } from "../../../lib/leadFormFields";

export default function ContactPageTwo({ data = {}, leadCapture }: SectionProps) {
  const contact = data.footerContact;
  const fields = data.formFields ?? [];

  return (
    <main className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent" data-editor-inline-format-key="contact-two:pretitle">
              <InlineRichText value={data.pretitle ?? ""} formatKey="contact-two:pretitle" />
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-6xl" data-editor-inline-format-key="contact-two:title">
              <InlineRichText value={data.title ?? ""} formatKey="contact-two:title" />
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300" data-editor-inline-format-key="contact-two:description">
              <InlineRichText value={data.desc ?? ""} formatKey="contact-two:description" />
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {contact?.location && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <MapPin className="theme-accent" size={22} />
                <p className="mt-4 text-sm text-slate-300" data-editor-inline-format-key="contact-two:location"><InlineRichText value={contact.location} formatKey="contact-two:location" /></p>
              </div>
            )}
            {contact?.email && (
              <Link
                href={`mailto:${contact.email}`}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <Mail className="theme-accent" size={22} />
                <p className="mt-4 text-sm text-slate-300" data-editor-inline-format-key="contact-two:email"><InlineRichText value={contact.email} formatKey="contact-two:email" /></p>
              </Link>
            )}
            {contact?.phone && (
              <Link
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <Phone className="theme-accent" size={22} />
                <p className="mt-4 text-sm text-slate-300" data-editor-inline-format-key="contact-two:phone"><InlineRichText value={contact.phone} formatKey="contact-two:phone" /></p>
              </Link>
            )}
          </div>
        </div>

        <LeadFormWrapper
          leadCapture={leadCapture}
          className="mt-12 grid gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 md:grid-cols-2"
        >
          {fields.map((field, index) =>
            field.type === "textarea" ? (
              <textarea
                key={`${field.label}-${index}`}
                name={leadCapture ? leadFieldName(field.label) : undefined}
                placeholder={field.placeholder}
                required={Boolean(leadCapture)}
                className="h-32 resize-none rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-slate-950 outline-none md:col-span-2"
              />
            ) : (
              <input
                key={`${field.label}-${index}`}
                name={leadCapture ? leadFieldName(field.label) : undefined}
                type={field.type ?? "text"}
                placeholder={field.placeholder}
                required={
                  Boolean(leadCapture) &&
                  (field.type === "email" || field.type === "tel")
                }
                className="h-12 rounded-xl border border-white/10 bg-white px-4 text-sm text-slate-950 outline-none"
              />
            ),
          )}
          <button
            type={leadCapture ? "submit" : "button"}
            className="theme-btn h-12 rounded-xl px-5 text-sm font-bold md:col-span-2"
            data-editor-inline-format-key="contact-two:submit"
          >
            <InlineRichText
              value={data.formSubmitLabel ?? ""}
              formatKey="contact-two:submit"
            />
          </button>
        </LeadFormWrapper>
      </section>
    </main>
  );
}
