"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import type { FormFieldData, SectionProps } from "../../../types/section";
import { leadFieldName } from "../../../lib/leadFormFields";
import LeadFormWrapper from "../formdetail/LeadFormWrapper";

type FieldProps = {
    field: FormFieldData;
    id: string;
    name: string;
    value: string;
    required?: boolean;
    onChange: (value: string) => void;
};

function ContactField({ field, id, name, value, required, onChange }: FieldProps) {
    const controlClasses =
        "mt-2 w-full border-b border-white/25 bg-transparent pb-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-white";

    return (
        <label htmlFor={id} className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">
                {field.label}
            </span>
            {field.type === "textarea" ? (
                <textarea
                    id={id}
                    name={name}
                    rows={3}
                    required={required}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={field.placeholder}
                    className={`${controlClasses} resize-none`}
                />
            ) : (
                <input
                    id={id}
                    name={name}
                    required={required}
                    type={field.type ?? "text"}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={field.placeholder}
                    className={controlClasses}
                />
            )}
        </label>
    );
}

export default function RealEstateContact1({ data = {}, leadCapture }: SectionProps) {
    const formId = useId();
    const [values, setValues] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const fields = data.formFields ?? [];

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitted(true);
    }

    return (
        <section id="contact" className="scroll-mt-24 bg-white px-5 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="relative mx-auto max-w-8xl overflow-hidden rounded-[2rem] bg-[#17241f] text-white">
                {data.backgroundImage && (
                    <Image
                        src={data.backgroundImage}
                        alt={data.backgroundImageTitle ?? ""}
                        data-editor-media
                        data-editor-media-type="image"
                        data-editor-media-src={data.backgroundImage}
                        fill
                        sizes="(max-width: 1024px) 100vw, 1152px"
                        className="object-cover opacity-25"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-black via-[#17241f]/80 to-[#a45b42]/45" />

                <div className="relative grid gap-12 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:px-16 lg:py-16">
                    <div className="flex flex-col justify-center justify-between">
                        <div>
                            {data.pretitle && (
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e9ad91]">
                                    {data.pretitle}
                                </p>
                            )}
                            {data.title && (
                                <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-[-0.03em] sm:text-4xl lg:text-5xl">
                                    {data.title}
                                </h2>
                            )}
                            {data.desc && (
                                <p className="mt-5 max-w-md text-sm leading-7 text-white/65 sm:text-base">
                                    {data.desc}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.08] p-6 backdrop-blur-sm sm:p-8">
                        {submitted ? (
                            <div className="flex min-h-64 flex-col items-center justify-center text-center" role="status">
                                <CheckCircle2 size={42} className="text-[#e9ad91]" />
                                <h3 className="mt-5 text-xl font-semibold">Request received</h3>
                                <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
                                    {data.successMessage ??
                                        "Thank you—we received your request. An advisor will reach out shortly."}
                                </p>
                            </div>
                        ) : leadCapture ? (
                            <LeadFormWrapper
                                leadCapture={leadCapture}
                                className="space-y-6"
                                onSuccess={() => setSubmitted(true)}
                            >
                                {fields.map((field, index) => {
                                    const key = `${field.label}-${index}`;
                                    return (
                                        <ContactField
                                            key={key}
                                            field={field}
                                            id={`${formId}-${index}`}
                                            name={leadFieldName(field.label)}
                                            required
                                            value={values[key] ?? ""}
                                            onChange={(value) =>
                                                setValues((current) => ({ ...current, [key]: value }))
                                            }
                                        />
                                    );
                                })}
                                <button
                                    type="submit"
                                    className="mt-2 inline-flex items-center gap-3 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#17241f] transition hover:bg-[#f2e9df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    {data.formSubmitLabel ?? "Submit"}
                                    <ArrowRight size={16} />
                                </button>
                            </LeadFormWrapper>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {fields.map((field, index) => {
                                    const key = `${field.label}-${index}`;
                                    return (
                                        <ContactField
                                            key={key}
                                            field={field}
                                            id={`${formId}-${index}`}
                                            name={leadFieldName(field.label)}
                                            value={values[key] ?? ""}
                                            onChange={(value) =>
                                                setValues((current) => ({ ...current, [key]: value }))
                                            }
                                        />
                                    );
                                })}
                                <button
                                    type="submit"
                                    className="mt-2 inline-flex items-center gap-3 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#17241f] transition hover:bg-[#f2e9df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    {data.formSubmitLabel ?? "Submit"}
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
