import { Award, BookOpen, Clock, Rocket, Target, Users } from "lucide-react";
import type { SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

const icons = [Users, Rocket, Target, Clock, Award, BookOpen];

export default function WhyChooseUsOne({ data = {} }: SectionProps) {
  const items = Array.isArray(data.whyChooseUsItems) ? data.whyChooseUsItems : [];
  const firstItems = items.slice(0, 3);
  const featured = firstItems[2];

  return (
    <section className="bg-white px-5 py-16 text-[#050505]">
      <div className="mx-auto max-w-7xl">
        <span className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-xs font-medium uppercase" data-editor-inline-format-key="why-one:pretitle">
          <InlineRichText value={data.pretitle ?? ""} formatKey="why-one:pretitle" />
        </span>
        <h2 className="mt-7 text-3xl font-medium leading-tight sm:text-4xl md:text-5xl" data-editor-inline-format-key="why-one:title">
          <InlineRichText value={data.title ?? ""} formatKey="why-one:title" />
        </h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1fr_1.05fr]">
          <div className="grid gap-5 lg:col-span-2 lg:grid-cols-2">
            {firstItems.slice(0, 2).map((item, index) => {
              const Icon = icons[index];
              return (
                <article
                  key={item.title}
                  className="rounded-lg bg-[#f1f4f8] p-5 sm:p-7"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-900">
                    <Icon size={21} strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-7 text-xl font-medium sm:mt-10 sm:text-2xl" data-editor-inline-format-key={`why-one:${index}:title`}>
                    <InlineRichText value={item.title} formatKey={`why-one:${index}:title`} />
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate-700 sm:mt-6" data-editor-inline-format-key={`why-one:${index}:description`}>
                    <InlineRichText value={item.desc} formatKey={`why-one:${index}:description`} />
                  </p>
                </article>
              );
            })}

            {featured && (
              <article className="rounded-lg bg-[#f1f4f8] p-5 sm:p-7 lg:col-span-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-900">
                  <Target size={21} strokeWidth={1.5} />
                </span>
                <h3 className="mt-7 text-xl font-medium sm:mt-10 sm:text-2xl" data-editor-inline-format-key="why-one:2:title">
                  <InlineRichText value={featured.title} formatKey="why-one:2:title" />
                </h3>
                <p className="mt-4 text-sm leading-6 text-slate-700 sm:mt-6" data-editor-inline-format-key="why-one:2:description">
                  <InlineRichText value={featured.desc} formatKey="why-one:2:description" />
                </p>
              </article>
            )}
          </div>

          {items[3] && (
            <article className="rounded-lg bg-[#063a78] p-6 text-white sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/80">
                <Clock size={22} strokeWidth={1.5} />
              </span>
              <h3 className="mt-7 text-xl font-medium sm:mt-10 sm:text-2xl" data-editor-inline-format-key="why-one:3:title">
                <InlineRichText value={items[3].title} formatKey="why-one:3:title" />
              </h3>
              <p className="mt-7 text-sm leading-7 text-blue-50" data-editor-inline-format-key="why-one:3:description">
                <InlineRichText value={items[3].desc} formatKey="why-one:3:description" />
              </p>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
