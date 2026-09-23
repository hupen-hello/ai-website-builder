import { Award, BookOpen, Clock, Rocket, Target, Users } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

const icons = [Users, Rocket, Target, Clock, Award, BookOpen];

export default function WhyChooseUsTwo({ data = {} }: SectionProps) {
  const items = Array.isArray(data.whyChooseUsItems) ? data.whyChooseUsItems : [];

  return (
    <section className="bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        {data.title && <h2 className="text-3xl font-semibold sm:text-4xl" data-editor-inline-format-key="why-two:title"><InlineRichText value={data.title} formatKey="why-two:title" /></h2>}
        <div className="mt-10 grid gap-px overflow-hidden bg-white/15 md:grid-cols-3">
          {items.map((item, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article key={item.title} className="bg-slate-950 p-6 sm:p-8">
                <Icon className="text-cyan-300" size={32} />
                <h3 className="mt-6 text-xl font-semibold" data-editor-inline-format-key={`why-two:${index}:title`}><InlineRichText value={item.title} formatKey={`why-two:${index}:title`} /></h3>
                <p className="mt-3 text-sm leading-6 text-slate-300" data-editor-inline-format-key={`why-two:${index}:description`}><InlineRichText value={item.desc} formatKey={`why-two:${index}:description`} /></p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
