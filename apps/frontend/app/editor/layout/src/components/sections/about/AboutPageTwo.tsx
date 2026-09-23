import Image from "next/image";
import { SectionProps } from "./../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

export default function AboutPageTwo({ data = {} }: SectionProps) {
  const sideImage = data.sideImage;
  const sideImageTitle = data.sideImageTitle ?? "";

  return (
    <main className="bg-[#f8fafc] text-slate-950">
      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          {sideImage && <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-slate-200 shadow-xl">
            <Image
              src={sideImage}
              alt={sideImageTitle}
              data-editor-media
              data-editor-media-type="image"
              data-editor-media-src={sideImage}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>}

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent" data-editor-inline-format-key="about-page-two:pretitle">
              <InlineRichText value={data.pretitle ?? ""} formatKey="about-page-two:pretitle" />
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl" data-editor-inline-format-key="about-page-two:title">
              <InlineRichText value={data.title ?? ""} formatKey="about-page-two:title" />
            </h1>
            <div className="mt-6 space-y-4 text-base leading-8 text-slate-600">
              <p data-editor-inline-format-key="about-page-two:description"><InlineRichText value={data.desc ?? ""} formatKey="about-page-two:description" /></p>
              <p data-editor-inline-format-key="about-page-two:description-secondary"><InlineRichText value={data.desc2 ?? ""} formatKey="about-page-two:description-secondary" /></p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
