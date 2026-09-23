import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SectionProps } from "./../../../types/section";
import InlineRichText from "../../builder/InlineRichText";
import LeadFormWrapper from "../formdetail/LeadFormWrapper";
import { leadFieldName } from "../../../lib/leadFormFields";

export default function ContactPage({ data = {}, leadCapture }: SectionProps) {
  const contact = data.footerContact;
  const fields = data.formFields ?? [];
  const sideImage = data.sideImage;
  const sideImageTitle = data.sideImageTitle ?? "";

  return (
    <main className="bg-white text-slate-950">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[0.95fr_1.05fr] md:px-8 lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent" data-editor-inline-format-key="contact-page:pretitle">
            <InlineRichText value={data.pretitle ?? ""} formatKey="contact-page:pretitle" />
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl" data-editor-inline-format-key="contact-page:title">
            <InlineRichText value={data.title ?? ""} formatKey="contact-page:title" />
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600" data-editor-inline-format-key="contact-page:description">
            <InlineRichText value={data.desc ?? ""} formatKey="contact-page:description" />
          </p>

          <div className="mt-8 space-y-4">
            {contact?.location && (
              <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <MapPin className="mt-1 theme-accent" size={20} />
                <span data-editor-inline-format-key="contact-page:location"><InlineRichText value={contact.location} formatKey="contact-page:location" /></span>
              </div>
            )}
            {contact?.email && (
              <Link
                href={`mailto:${contact.email}`}
                className="flex gap-3 rounded-2xl bg-slate-50 p-4 transition hover:theme-soft"
              >
                <Mail className="mt-1 theme-accent" size={20} />
                <span data-editor-inline-format-key="contact-page:email"><InlineRichText value={contact.email} formatKey="contact-page:email" /></span>
              </Link>
            )}
            {contact?.phone && (
              <Link
                href={`tel:${contact.phone.replace(/\s/g, "")}`}
                className="flex gap-3 rounded-2xl bg-slate-50 p-4 transition hover:theme-soft"
              >
                <Phone className="mt-1 theme-accent" size={20} />
                <span data-editor-inline-format-key="contact-page:phone"><InlineRichText value={contact.phone} formatKey="contact-page:phone" /></span>
              </Link>
            )}
          </div>
        </div>

        <div className="rounded-[28px] bg-slate-50 p-5 shadow-xl">
          {sideImage && (
            <div className="relative mb-5 h-52 overflow-hidden rounded-2xl bg-slate-200">
              <Image
                src={sideImage}
                alt={sideImageTitle}
                data-editor-media
                data-editor-media-type="image"
                data-editor-media-src={sideImage}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 45vw, 100vw"
              />
            </div>
          )}

          <LeadFormWrapper leadCapture={leadCapture} className="grid gap-3">
            {fields.map((field, index) =>
              field.type === "textarea" ? (
                <textarea
                  key={`${field.label}-${index}`}
                  name={leadCapture ? leadFieldName(field.label) : undefined}
                  placeholder={field.placeholder}
                  required={Boolean(leadCapture)}
                  className="h-28 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
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
                  className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none"
                />
              ),
            )}
            <button
              type={leadCapture ? "submit" : "button"}
              className="theme-btn h-12 rounded-xl px-5 text-sm font-bold"
              data-editor-inline-format-key="contact-page:submit"
            >
              <InlineRichText
                value={data.formSubmitLabel ?? ""}
                formatKey="contact-page:submit"
              />
            </button>
          </LeadFormWrapper>
        </div>
      </section>
    </main>
  );
}
