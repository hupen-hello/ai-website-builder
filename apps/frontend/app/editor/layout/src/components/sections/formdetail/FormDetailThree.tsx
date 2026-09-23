import type { SectionProps } from "../../../types/section";
import FormFieldControl from "./FormFieldControl";
import InlineRichText from "../../builder/InlineRichText";
import LeadFormWrapper from "./LeadFormWrapper";
import { leadFieldName } from "../../../lib/leadFormFields";

export default function FormDetailThree({ data = {}, leadCapture }: SectionProps) {
  return (
    <section className="bg-[#f8fafc] px-5 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-0 overflow-hidden bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="theme-surface-accent p-6 sm:p-10">
          {data.title && (
            <h2
              className="text-3xl font-semibold sm:text-4xl"
              data-editor-inline-format-key="form-three:title"
            >
              <InlineRichText
                value={data.title}
                formatKey="form-three:title"
              />
            </h2>
          )}
          {data.desc && (
            <p
              className="mt-4 text-blue-50"
              data-editor-inline-format-key="form-three:description"
            >
              <InlineRichText
                value={data.desc}
                formatKey="form-three:description"
              />
            </p>
          )}
          <div className="mt-8 space-y-2 text-sm font-semibold">
            {data.phone && (
              <p data-editor-inline-format-key="form-three:phone">
                <InlineRichText value={data.phone} formatKey="form-three:phone" />
              </p>
            )}
            {data.email && (
              <p data-editor-inline-format-key="form-three:email">
                <InlineRichText value={data.email} formatKey="form-three:email" />
              </p>
            )}
            {data.location && (
              <p data-editor-inline-format-key="form-three:location">
                <InlineRichText
                  value={data.location}
                  formatKey="form-three:location"
                />
              </p>
            )}
          </div>
        </div>
        <LeadFormWrapper
          leadCapture={leadCapture}
          className="space-y-4 p-5 sm:p-8"
        >
          {(Array.isArray(data.formFields) ? data.formFields : []).map((field) => (
            <FormFieldControl
              key={field.label}
              field={field}
              name={leadCapture ? leadFieldName(field.label) : undefined}
              className="h-11 w-full border border-slate-300 px-3"
            />
          ))}
          {data.formSubmitLabel && (
            <button
              type={leadCapture ? "submit" : "button"}
              className="theme-btn w-full px-5 py-3 font-semibold"
              data-editor-inline-format-key="form-three:submit"
            >
              <InlineRichText
                value={data.formSubmitLabel}
                formatKey="form-three:submit"
              />
            </button>
          )}
        </LeadFormWrapper>
      </div>
    </section>
  );
}
