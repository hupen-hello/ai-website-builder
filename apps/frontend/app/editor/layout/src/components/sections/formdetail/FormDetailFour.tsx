import type { SectionProps } from "../../../types/section";
import FormFieldControl from "./FormFieldControl";
import InlineRichText from "../../builder/InlineRichText";
import LeadFormWrapper from "./LeadFormWrapper";
import { leadFieldName } from "../../../lib/leadFormFields";

export default function FormDetailFour({ data = {}, leadCapture }: SectionProps) {
  return (
    <section className="bg-white px-5 py-12 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl border-y border-slate-200 py-10 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div>
            {data.title && (
              <h2
                className="text-3xl font-semibold text-slate-950 sm:text-4xl"
                data-editor-inline-format-key="form-four:title"
              >
                <InlineRichText
                  value={data.title}
                  formatKey="form-four:title"
                />
              </h2>
            )}
            {data.desc && (
              <p
                className="mt-4 max-w-xl text-slate-600"
                data-editor-inline-format-key="form-four:description"
              >
                <InlineRichText
                  value={data.desc}
                  formatKey="form-four:description"
                />
              </p>
            )}
          </div>
          <LeadFormWrapper leadCapture={leadCapture} className="space-y-4">
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
                data-editor-inline-format-key="form-four:submit"
              >
                <InlineRichText
                  value={data.formSubmitLabel}
                  formatKey="form-four:submit"
                />
              </button>
            )}
          </LeadFormWrapper>
        </div>
      </div>
    </section>
  );
}
