"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FaArrowRight,
  FaBroom,
  FaChartLine,
  FaClipboardCheck,
  FaFileInvoiceDollar,
  FaHouseChimney,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { SectionProps } from "../../../types/section";

type ProcessStep = {
  number: string;
  title: string;
  desc: string;
  icon?: string;
  image?: string;
};

const processIcons: Record<string, IconType> = {
  inspect: FaClipboardCheck,
  quote: FaFileInvoiceDollar,
  finish: FaBroom,
  quality: FaChartLine,
};

const fallbackIcons: IconType[] = [
  FaClipboardCheck,
  FaFileInvoiceDollar,
  FaBroom,
  FaChartLine,
];

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const getSteps = (value: unknown): ProcessStep[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const title = getString(item.title);
    if (!title) return [];

    return [{
      number: getString(item.step, String(index + 1).padStart(2, "0")),
      title,
      desc: getString(item.desc, getString(item.description)),
      icon: getString(item.icon) || undefined,
      image: getString(item.image) || undefined,
    }];
  });
};

export default function RealEstateProcess1({ data = {} }: SectionProps) {
  const steps = getSteps(data.steps).slice(0, 4);
  const desktopGridClass =
    steps.length === 1
      ? "lg:grid-cols-1"
      : steps.length === 2
        ? "lg:grid-cols-2"
        : steps.length === 3
          ? "lg:grid-cols-3"
          : "lg:grid-cols-4";
  const button =
    data.button && typeof data.button === "object"
      ? (data.button as Record<string, unknown>)
      : null;
  const buttonLabel = getString(button?.label);
  const buttonHref = getString(button?.href);

  if (!steps.length) return null;

  const connectorClass =
    steps.length === 2
      ? "left-[25%] right-[25%]"
      : steps.length === 3
        ? "left-[16.66%] right-[16.66%]"
        : "left-[12.5%] right-[12.5%]";

  return (
    <section
      id="property-process"
      className="relative overflow-hidden bg-[#faf8f4] py-14 md:py-20"
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#141414]/5 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c44536]">
            <FaHouseChimney className="text-[10px]" aria-hidden />
            {getString(data.pretitle, "Our Process")}
            <FaHouseChimney className="text-[10px]" aria-hidden />
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] text-[#141414] md:text-5xl">
            {getString(data.title, "Standard Property Process")}
          </h2>
          {data.desc && (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#141414]/60 md:text-base">
              {getString(data.desc)}
            </p>
          )}
        </div>

        <div
          data-box-layout-grid="grid"
          className={`relative mt-12 grid gap-8 sm:grid-cols-2 ${desktopGridClass} lg:gap-5`}
        >
          {steps.length > 1 && (
            <div
              className={`pointer-events-none absolute top-16 hidden border-t border-dashed border-[#141414]/25 lg:block ${connectorClass}`}
              aria-hidden
            />
          )}

          {steps.map((step, index) => {
            const Icon =
              processIcons[step.icon || ""] ||
              fallbackIcons[index % fallbackIcons.length];

            return (
              <article
                key={`${step.number}-${step.title}`}
                className="group relative flex flex-col items-center text-center"
              >
                <span className="absolute left-1/2 top-0 -translate-x-[140px] text-5xl font-semibold text-[#141414]/10">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-[#141414]/15 bg-[#faf8f4]">
                  <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-dashed border-[#141414]/35 bg-white text-[color:var(--secondary-text)] shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:bg-[#141414] group-hover:text-white">
                    {step.image ? (
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        unoptimized={step.image.startsWith("data:") || step.image.startsWith("http")}
                        data-editor-media
                        data-editor-media-type="image"
                        data-editor-media-src={step.image}
                        sizes="80px"
                        className="object-contain p-5"
                      />
                    ) : (
                      <Icon className="text-3xl fill-current text-current" aria-hidden />
                    )}
                  </div>
                </div>
                <span className="mt-5 h-0.5 w-10 rounded-full bg-[#c44536]" />
                <h3 className="mt-4 text-lg font-semibold text-[#141414]">
                  {step.title}
                </h3>
                {step.desc && (
                  <p className="mt-2 max-w-[17rem] text-sm leading-6 text-[#141414]/60">
                    {step.desc}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        {buttonLabel && buttonHref && (
          <div className="mt-12 flex justify-center">
            <Link
              href={buttonHref}
              className="inline-flex items-center gap-2 rounded-full bg-[#141414] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c44536]"
            >
              {buttonLabel}
              <FaArrowRight className="text-xs" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
