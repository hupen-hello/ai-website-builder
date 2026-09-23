import Image from "next/image";
import { SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

export default function BreadcrumbThree({ data = {} }: SectionProps) {
  const title = String(data.title || "Page");
  const homeLabel = String(data.homeLabel || "Home");
  const parentLabel = String(data.parentLabel || "").trim();
  const image = String(data.backgroundImage || data.sideImage || "");

  return (
    <section className="relative overflow-hidden bg-slate-900 text-white">
      {image ? (
        <Image
          src={image}
          alt={String(data.sideImageTitle || title)}
          data-editor-media
          data-editor-media-type="image"
          data-editor-media-src={image}
          fill
          className="object-cover opacity-40"
          sizes="100vw"
        />
      ) : null}
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-14 md:px-8 md:py-16">
        <nav aria-label="Breadcrumb" className="text-sm text-white/80">
          <ol className="flex flex-wrap items-center gap-2">
            <li data-editor-inline-format-key="breadcrumb-three:home-label">
              <InlineRichText value={homeLabel} formatKey="breadcrumb-three:home-label" />
            </li>
            {parentLabel ? (
              <>
                <li aria-hidden="true">/</li>
                <li data-editor-inline-format-key="breadcrumb-three:parent-label">
                  <InlineRichText
                    value={parentLabel}
                    formatKey="breadcrumb-three:parent-label"
                  />
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li
              className="font-semibold text-white"
              data-editor-inline-format-key="breadcrumb-three:current-label"
            >
              <InlineRichText value={title} formatKey="breadcrumb-three:current-label" />
            </li>
          </ol>
        </nav>
        <h1
          className="text-3xl font-black tracking-tight md:text-5xl"
          data-editor-inline-format-key="breadcrumb-three:title"
        >
          <InlineRichText value={title} formatKey="breadcrumb-three:title" />
        </h1>
      </div>
    </section>
  );
}
