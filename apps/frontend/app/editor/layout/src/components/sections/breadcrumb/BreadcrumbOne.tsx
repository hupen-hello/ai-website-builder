import { SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

export default function BreadcrumbOne({ data = {} }: SectionProps) {
  const title = String(data.title || "Page");
  const homeLabel = String(data.homeLabel || "Home");
  const parentLabel = String(data.parentLabel || "").trim();
  const pretitle = String(data.pretitle || "");

  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-8 md:px-8">
        {pretitle ? (
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] theme-accent"
            data-editor-inline-format-key="breadcrumb-one:pretitle"
          >
            <InlineRichText value={pretitle} formatKey="breadcrumb-one:pretitle" />
          </p>
        ) : null}
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li data-editor-inline-format-key="breadcrumb-one:home-label">
              <InlineRichText value={homeLabel} formatKey="breadcrumb-one:home-label" />
            </li>
            {parentLabel ? (
              <>
                <li aria-hidden="true">/</li>
                <li data-editor-inline-format-key="breadcrumb-one:parent-label">
                  <InlineRichText
                    value={parentLabel}
                    formatKey="breadcrumb-one:parent-label"
                  />
                </li>
              </>
            ) : null}
            <li aria-hidden="true">/</li>
            <li
              className="font-semibold text-slate-900"
              data-editor-inline-format-key="breadcrumb-one:current-label"
            >
              <InlineRichText value={title} formatKey="breadcrumb-one:current-label" />
            </li>
          </ol>
        </nav>
        <h1
          className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl"
          data-editor-inline-format-key="breadcrumb-one:title"
        >
          <InlineRichText value={title} formatKey="breadcrumb-one:title" />
        </h1>
      </div>
    </section>
  );
}
