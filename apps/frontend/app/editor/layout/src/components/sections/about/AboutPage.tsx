import Image from "next/image";
import { SectionProps } from "./../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

export default function AboutPage({ data = {} }: SectionProps) {
  const sideImage = data.sideImage;
  const sideImageTitle = data.sideImageTitle ?? "";

  return (
    <main className="bg-white text-slate-950">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.05fr_0.95fr] md:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent" data-editor-inline-format-key="about-page:pretitle">
            <InlineRichText value={data.pretitle ?? ""} formatKey="about-page:pretitle" />
          </p>

          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl" data-editor-inline-format-key="about-page:title">
            <InlineRichText value={data.title ?? ""} formatKey="about-page:title" />
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600" data-editor-inline-format-key="about-page:description">
            <InlineRichText value={data.desc ?? ""} formatKey="about-page:description" />
          </p>

          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600" data-editor-inline-format-key="about-page:description-secondary">
            <InlineRichText value={data.desc2 ?? ""} formatKey="about-page:description-secondary" />
          </p>
        </div>

        {sideImage && <div className="relative min-h-[360px] overflow-hidden rounded-2xl bg-slate-100 shadow-xl">
          <Image
            src={sideImage}
            alt={sideImageTitle}
            data-editor-media
            data-editor-media-type="image"
            data-editor-media-src={sideImage}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 45vw, 100vw"
          />
        </div>}
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-[0.8fr_1.2fr] md:px-8 lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.22em] theme-accent" data-editor-inline-format-key="about-page:subtitle">
            <InlineRichText value={data.subtitle ?? ""} formatKey="about-page:subtitle" />
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950" data-editor-inline-format-key="about-page:philosophy-title">
            <InlineRichText value={data.philosophyTitle ?? ""} formatKey="about-page:philosophy-title" />
          </h2>
        </div>

        <div className="space-y-5 text-base leading-8 text-slate-600">
          <p data-editor-inline-format-key="about-page:philosophy-description">
            <InlineRichText value={data.philosophyDesc ?? ""} formatKey="about-page:philosophy-description" />
          </p>
        </div>
      </section>
    </main>
  );
}
