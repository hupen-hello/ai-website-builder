import { SectionProps } from "../../../types/section";
import InlineRichText from "../../builder/InlineRichText";

export default function BreadcrumbTwo({ data = {} }: SectionProps) {
  const title = String(data.title || "Page");
  const homeLabel = String(data.homeLabel || "Home");
  const parentLabel = String(data.parentLabel || "").trim();
  const background = String(data.breadcrumbBackgroundColor || "#0668ff");
  const textColor = String(data.breadcrumbTextColor || "#ffffff");
  const description = String(data.desc || "");

  return (
    <section style={{ background, color: textColor }}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-10 md:px-8">
        <nav aria-label="Breadcrumb" className="text-sm opacity-90">
          <ol className="flex flex-wrap items-center gap-2">
            <li data-editor-inline-format-key="breadcrumb-two:home-label">
              <InlineRichText value={homeLabel} formatKey="breadcrumb-two:home-label" />
            </li>
            {parentLabel ? (
              <>
                <li aria-hidden="true">›</li>
                <li data-editor-inline-format-key="breadcrumb-two:parent-label">
                  <InlineRichText
                    value={parentLabel}
                    formatKey="breadcrumb-two:parent-label"
                  />
                </li>
              </>
            ) : null}
            <li aria-hidden="true">›</li>
            <li
              className="font-semibold"
              data-editor-inline-format-key="breadcrumb-two:current-label"
            >
              <InlineRichText value={title} formatKey="breadcrumb-two:current-label" />
            </li>
          </ol>
        </nav>
        <h1
          className="text-3xl font-black tracking-tight md:text-4xl"
          data-editor-inline-format-key="breadcrumb-two:title"
        >
          <InlineRichText value={title} formatKey="breadcrumb-two:title" />
        </h1>
        {description ? (
          <p
            className="max-w-2xl text-sm leading-7 opacity-90"
            data-editor-inline-format-key="breadcrumb-two:description"
          >
            <InlineRichText value={description} formatKey="breadcrumb-two:description" />
          </p>
        ) : null}
      </div>
    </section>
  );
}
