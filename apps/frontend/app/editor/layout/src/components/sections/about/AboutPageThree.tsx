import { SectionProps } from "./../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

export default function AboutPageThree({ data = {} }: SectionProps) {
  return (
    <main className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent" data-editor-inline-format-key="about-three:pretitle">
          <InlineRichText value={data.pretitle ?? ""} formatKey="about-three:pretitle" />
        </p>
        <div className="mt-5 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl" data-editor-inline-format-key="about-three:title">
            <InlineRichText value={data.title ?? ""} formatKey="about-three:title" />
          </h1>
          <div className="space-y-5 text-base leading-8 text-slate-300">
            <p data-editor-inline-format-key="about-three:description"><InlineRichText value={data.desc ?? ""} formatKey="about-three:description" /></p>
            <p data-editor-inline-format-key="about-three:description-secondary"><InlineRichText value={data.desc2 ?? ""} formatKey="about-three:description-secondary" /></p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent" data-editor-inline-format-key="about-three:subtitle">
            <InlineRichText value={data.subtitle ?? ""} formatKey="about-three:subtitle" />
          </p>
          <h2 className="mt-3 text-3xl font-black" data-editor-inline-format-key="about-three:philosophy-title">
            <InlineRichText value={data.philosophyTitle ?? ""} formatKey="about-three:philosophy-title" />
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-300" data-editor-inline-format-key="about-three:philosophy-description">
            <InlineRichText value={data.philosophyDesc ?? ""} formatKey="about-three:philosophy-description" />
          </p>
        </div>
      </section>
    </main>
  );
}
