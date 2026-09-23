import type { ReactNode } from "react";

export type RealEstateBreadCrumb1Props = {
  pretitle: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  footer?: ReactNode;
  editorFields?: string[];
};

export default function RealEstateBreadCrumb1({
  pretitle,
  title,
  desc,
  footer,
  editorFields = ["pretitle", "title", "desc"],
}: RealEstateBreadCrumb1Props) {
  return (
    <section
      data-editor-section-label="Page Banner"
      data-embedded-page-banner
      data-editor-fields={editorFields.join(" ")}
      className="border-b border-[#141414]/10 bg-[#f8f6f1] px-5 py-14 text-[#141414] md:px-8 md:py-20 lg:px-10"
    >
      <div className="mx-auto w-full max-w-7xl text-center">
        <p
          data-editor-field="pretitle"
          className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#a4472f]"
        >
          {pretitle}
        </p>
        <h1
          data-editor-field="title"
          className="mt-4 whitespace-nowrap text-[clamp(0.75rem,3.6vw,3.25rem)] font-medium leading-tight tracking-[-0.04em]"
        >
          {title}
        </h1>
        {desc && (
          <div
            data-editor-field="desc"
            className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#141414]/65 md:text-lg"
          >
            {desc}
          </div>
        )}
        {footer && <div className="mt-5">{footer}</div>}
      </div>
    </section>
  );
}
