import type { SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

export default function WhyChooseUsFour({ data = {} }: SectionProps) {
  const items = Array.isArray(data.whyChooseUsItems) ? data.whyChooseUsItems : [];

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-3xl font-semibold text-slate-950 sm:text-4xl" data-editor-inline-format-key="why-four:title">
          <InlineRichText value={data.title ?? ""} formatKey="why-four:title" />
        </h2>
        <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {items.map((item, index) => (
            <article key={item.title} className="grid gap-4 py-6 md:grid-cols-[120px_1fr]">
              <span className="text-3xl font-semibold text-slate-300">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-xl font-semibold text-slate-950" data-editor-inline-format-key={`why-four:${index}:title`}><InlineRichText value={item.title} formatKey={`why-four:${index}:title`} /></h3>
                <p className="mt-2 text-sm leading-6 text-slate-600" data-editor-inline-format-key={`why-four:${index}:description`}><InlineRichText value={item.desc} formatKey={`why-four:${index}:description`} /></p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
