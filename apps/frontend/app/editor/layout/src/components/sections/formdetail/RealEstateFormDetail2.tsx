import type { SectionProps } from "../../../types/section";
import FormFieldControl from "./FormFieldControl";

export default function RealEstateFormDetail2({ data = {} }: SectionProps) {
  const fields = Array.isArray(data.formFields) ? data.formFields : [];

  return (
    <section className="bg-slate-950 px-5 py-12 text-white sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          {data.title && <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">{data.title}</h2>}
        </div>
        <div className="mt-8 space-y-4 bg-white p-5 text-slate-950 sm:mt-10 sm:p-6">
          {fields.map((field) => (
            <FormFieldControl
              key={field.label}
              field={field}
              className="h-11 w-full border border-slate-300 px-3"
            />
          ))}
          {data.formSubmitLabel && (
            <button className="w-full bg-blue-600 px-5 py-3 font-semibold text-white">{data.formSubmitLabel}</button>
          )}
        </div>
      </div>
    </section>
  );
}
