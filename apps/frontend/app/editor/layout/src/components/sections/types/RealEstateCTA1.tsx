import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

type CTAButton = {
  label: string;
  href: string;
  secondary?: boolean;
};

export type RealEstateCTAContent = {
  pretitle: string;
  title: string;
  description?: string;
  buttons: CTAButton[];
};

type RealEstateCTA1Props = {
  content?: RealEstateCTAContent;
  editor?: {
    sectionLabel: string;
    fields: string[];
  };
  className?: string;
  data?: Record<string, unknown>;
};

const isButton = (value: unknown): value is CTAButton => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.label === "string" && typeof item.href === "string";
};

const buttonsFromData = (data: Record<string, unknown>): CTAButton[] => {
  if (Array.isArray(data.buttons)) {
    const buttons = data.buttons.filter(isButton);
    if (buttons.length) return buttons;
  }

  return [
    {
      label:
        typeof data.ctaPrimaryLabel === "string"
          ? data.ctaPrimaryLabel
          : "Browse properties",
      href:
        typeof data.ctaPrimaryHref === "string"
          ? data.ctaPrimaryHref
          : "/buy-a-property",
    },
    {
      label:
        typeof data.ctaSecondaryLabel === "string"
          ? data.ctaSecondaryLabel
          : "Contact us",
      href:
        typeof data.ctaSecondaryHref === "string"
          ? data.ctaSecondaryHref
          : "/contact",
      secondary: true,
    },
  ];
};

const contentFromData = (data: Record<string, unknown>): RealEstateCTAContent => ({
  pretitle:
    typeof data.pretitle === "string"
      ? data.pretitle
      : typeof data.ctaPretitle === "string"
        ? data.ctaPretitle
        : "Start your search",
  title:
    typeof data.title === "string"
      ? data.title
      : typeof data.ctaTitle === "string"
        ? data.ctaTitle
        : "Let us help you find the right next move.",
  description:
    typeof data.description === "string" ? data.description : undefined,
  buttons: buttonsFromData(data),
});

export default function RealEstateCTA1({
  content,
  editor,
  className,
  data = {},
}: RealEstateCTA1Props) {
  const resolved = content ?? contentFromData(data);
  const resolvedEditor = editor ?? {
    sectionLabel: "Call to action",
    fields: ["pretitle", "title", "description", "buttons"],
  };
  const resolvedClassName =
    className ??
    (content
      ? "px-5 pb-14 md:px-8 md:pb-20 lg:px-10"
      : "px-5 py-14 md:px-8 md:py-20 lg:px-10");
  const pub = (href: string) => publishedHrefFromData(href, data);

  return (
    <section
      data-editor-section-label={resolvedEditor.sectionLabel}
      data-editor-fields={resolvedEditor.fields.join(" ")}
      className={resolvedClassName}
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-[1.5rem] bg-[#14251f] px-7 py-10 text-white md:flex-row md:items-center md:px-10 md:py-12">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e9ad91]">
            {resolved.pretitle}
          </p>
          <h2 className="mt-3 text-2xl font-medium tracking-[-0.025em] md:text-3xl">
            {resolved.title}
          </h2>
          {resolved.description && (
            <p className="mt-3 text-sm leading-7 text-white/60">
              {resolved.description}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {resolved.buttons.map((button, index) => (
            <Link
              key={`${button.label}-${button.href}`}
              href={pub(button.href)}
              className={
                button.secondary
                  ? "inline-flex items-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  : "inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#14251f] transition hover:bg-[#f1e5dc]"
              }
            >
              {button.label}
              {!button.secondary && index === 0 && (
                <ArrowRight size={15} aria-hidden />
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
