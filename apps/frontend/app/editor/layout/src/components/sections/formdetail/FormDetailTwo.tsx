import type { SectionProps } from "../../../types/section";
import FormFieldControl from "./FormFieldControl";
import InlineRichText from "../../builder/InlineRichText";
import LeadFormWrapper from "./LeadFormWrapper";
import { leadFieldName } from "../../../lib/leadFormFields";

export default function FormDetailTwo({ data = {}, leadCapture }: SectionProps) {
  const fields = Array.isArray(data.formFields) ? data.formFields : [];

  return (
    <section className="bg-slate-950 px-5 py-12 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          {data.title && <h2 className="mt-4 text-3xl font-semibold sm:text-4xl" data-editor-inline-format-key="form-two:title"><InlineRichText value={data.title} formatKey="form-two:title" /></h2>}
        </div>
        <LeadFormWrapper
          leadCapture={leadCapture}
          className="mt-8 space-y-4 bg-white p-5 text-slate-950 sm:mt-10 sm:p-6"
        >
          {fields.map((field) => (
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
              data-editor-inline-format-key="form-two:submit"
            >
              <InlineRichText
                value={data.formSubmitLabel}
                formatKey="form-two:submit"
              />
            </button>
          )}
        </LeadFormWrapper>
      </div>
    </section>
  );
}
