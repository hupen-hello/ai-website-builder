"use client";

import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";

type SearchField = {
  label: string;
  name?: string;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  placeholder?: string;
  options?: string;
};

const defaultFields: SearchField[] = [
  {
    label: "Interested In",
    name: "interestedIn",
    type: "select",
    placeholder: "Select",
    options: "Buying, Selling, Renting",
  },
  {
    label: "Location",
    name: "location",
    type: "text",
    placeholder: "Enter location",
  },
  {
    label: "Property Type",
    name: "propertyType",
    type: "select",
    placeholder: "Select type",
    options: "House, Apartment, Villa",
  },
  {
    label: "Price Range",
    name: "priceRange",
    type: "select",
    placeholder: "Min - Max",
    options: "Up to $1M, Up to $2M, Up to $5M",
  },
  { label: "Name", name: "name", type: "text", placeholder: "Your name" },
  { label: "Email", name: "email", type: "email", placeholder: "Your email" },
  { label: "Phone", name: "phone", type: "tel", placeholder: "Your phone" },
  {
    label: "Additional Info",
    name: "additionalInfo",
    type: "text",
    placeholder: "Any additional info",
  },
];

const parseOptions = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const inputClassName =
  "w-full text-[14.5px] text-gray-500 border border-gray-200 bg-white shadow-sm h-[46px] rounded-md px-3 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]";

export default function PropertySearch1({ data = {} }: SectionProps) {
  const title = String(data.title || "Ask Our Agents");
  const desc = String(
    data.desc ||
      "Fill in the form below and one of our agents will contact you soon",
  );
  const submitLabel = String(data.formSubmitLabel || "Submit");
  const fields = Array.isArray(data.formFields) && data.formFields.length
    ? (data.formFields as SearchField[])
    : defaultFields;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  return (
    <section
      className="relative z-30 -mt-24 pt-8 pb-2 md:pt-12 md:pb-4"
      style={getAccentStyle(data.accentColor as string | undefined)}
      data-editor-section-label="propertySearch"
      data-editor-fields="accentColor title desc formSubmitLabel formFields"
    >
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto w-full rounded-xl border border-gray-100 bg-white p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] md:p-12">
          <div className="mb-10 text-center">
            <h2
              className="mb-4 text-[28px] font-extrabold tracking-wide text-[#101820] uppercase"
              data-editor-field="title"
            >
              {title}
            </h2>
            <div className="mx-auto mb-5 h-[3px] w-10 bg-[var(--accent,#0a8296)]" />
            <p className="text-[15px] text-gray-500" data-editor-field="desc">
              {desc}
            </p>
          </div>

          <form
            className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2 lg:grid-cols-4"
            onSubmit={handleSubmit}
          >
            {fields.map((field) => {
              const options = parseOptions(field.options);
              const isWide = field.type === "textarea";

              return (
                <div
                  key={field.name ?? field.label}
                  className={`space-y-2.5 ${isWide ? "lg:col-span-2" : ""}`}
                >
                  <label
                    className="text-[14px] font-bold text-[#101820]"
                    data-editor-field="label"
                  >
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select className={inputClassName}>
                      <option value="">
                        {field.placeholder ?? "Select"}
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
                      rows={3}
                      className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-[14.5px] text-gray-500 shadow-sm placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
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
                      className={inputClassName}
                    />
                  )}
                </div>
              );
            })}

            <div className="mt-8 flex justify-center lg:col-span-4">
              <button
                type="submit"
                className="h-[46px] w-full max-w-[220px] rounded bg-[var(--accent,#0a8296)] text-[14px] font-bold tracking-wider text-white uppercase shadow-md transition-colors hover:opacity-90"
                data-editor-field="formSubmitLabel"
              >
                {submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
