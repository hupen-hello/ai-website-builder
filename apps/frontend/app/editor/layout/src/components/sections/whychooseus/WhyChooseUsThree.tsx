import { Award, BookOpen, Clock, Rocket, Target, Users } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

const icons = [Users, Rocket, Target, Clock, Award, BookOpen];

export default function WhyChooseUsThree({ data = {} }: SectionProps) {
  const items = Array.isArray(data.whyChooseUsItems) ? data.whyChooseUsItems : [];

  return (
    <section className="bg-[#f8fafc] px-6 py-20">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold text-slate-950 sm:text-4xl" data-editor-inline-format-key="why-three:title">
          <InlineRichText value={data.title ?? ""} formatKey="why-three:title" />
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((item, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article key={item.title} className="bg-white p-6 shadow-sm sm:p-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                  <Icon size={24} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-slate-950" data-editor-inline-format-key={`why-three:${index}:title`}><InlineRichText value={item.title} formatKey={`why-three:${index}:title`} /></h3>
                <p className="mt-3 text-sm leading-6 text-slate-600" data-editor-inline-format-key={`why-three:${index}:description`}><InlineRichText value={item.desc} formatKey={`why-three:${index}:description`} /></p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
