"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type PackageItem = {
  id?: string;
  name?: string;
  price?: number | string;
  recommended?: boolean;
  popular?: boolean;
  features?: string[];
};

const defaultPackages: PackageItem[] = [
  {
    id: "basic",
    name: "Basic Package",
    price: 99,
    recommended: false,
    features: [
      "Basic property listing",
      "Standard support",
      "Up to 5 images",
      "1 Month duration",
    ],
  },
  {
    id: "premium",
    name: "Premium Package",
    price: 199,
    recommended: true,
    features: [
      "Featured property listing",
      "Priority 24/7 support",
      "Unlimited images",
      "Virtual tours included",
      "6 Months duration",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise Package",
    price: 399,
    recommended: false,
    features: [
      "Top tier search placement",
      "Dedicated account manager",
      "Custom branding",
      "API access",
      "1 Year duration",
    ],
  },
];

export default function RealEstatePackagePage5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const pretitle = String(data.pretitle || data.subtitle || "Pricing Package");
  const title = String(
    data.title || "Our Wonderful Industrial Pricing Package",
  );
  const periodSuffix = String(data.periodSuffix || "/Per Month");
  const chooseText = String(data.chooseText || "CHOOSE PACKAGE");
  const chooseUrl = String(data.chooseUrl || "/contact");

  const packages = (
    Array.isArray(data.packages) && data.packages.length
      ? data.packages
      : Array.isArray(data.plans) && data.plans.length
        ? data.plans
        : defaultPackages
  ) as PackageItem[];

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  const formatPrice = (price: number | string | undefined) => {
    const numeric = Number(price);
    if (Number.isFinite(numeric)) return `${numeric}.00`;
    return String(price ?? "0");
  };

  return (
    <section
      className="bg-white py-[30px]"
      style={getAccentStyle(accent)}
      data-editor-section-label="package"
      data-editor-fields="accentColor pretitle title periodSuffix chooseText chooseUrl packages"
    >
      <div className="mx-auto w-full max-w-[1320px] px-6 max-md:overflow-x-hidden max-md:px-5">
        <div className="mb-6 text-center">
          <div
            className="mb-4 inline-block rounded-[20px] bg-[rgba(255,107,0,0.1)] px-4 py-1 font-semibold tracking-[0.05em] text-[var(--accent)]"
            data-editor-field="pretitle"
          >
            {pretitle}
          </div>
          <h2
            className="mx-auto max-w-[800px] font-extrabold text-[#333]"
            data-editor-field="title"
          >
            {title}
          </h2>
          <div className="mx-auto mb-8 mt-4 flex items-center justify-center gap-1.5">
            <div className="h-[5px] w-[45px] rounded-[10px] bg-[var(--accent)]" />
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
        </div>

        <div
          className="flex flex-wrap justify-center gap-8"
          data-box-layout-grid="grid"
          data-editor-field="packages"
        >
          {packages.map((pkg, index) => {
            const recommended = Boolean(pkg.recommended || pkg.popular);
            const name = String(pkg.name || `Package ${index + 1}`);
            const features = Array.isArray(pkg.features) ? pkg.features : [];

            return (
              <div
                key={String(pkg.id || name)}
                className={`relative max-w-[350px] flex-[1_1_300px] overflow-hidden rounded-lg px-10 py-[50px] ${
                  recommended
                    ? "border-0 bg-[#1a1a1a] text-white shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
                    : "border border-[#eaeaea] bg-white text-[#333] shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
                }`}
              >
                {recommended ? (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                ) : null}

                <div className="relative z-[1]">
                  <h3
                    className={`mb-8 inline-block pb-4 text-[1.25rem] font-bold ${
                      recommended
                        ? "border-b-2 border-white/20"
                        : "border-b-2 border-[#eaeaea]"
                    }`}
                  >
                    {name}
                  </h3>

                  <div className="mb-6 flex items-baseline gap-2">
                    <span className="text-[3.5rem] leading-none font-bold text-[var(--accent)]">
                      ${formatPrice(pkg.price)}
                    </span>
                    <span
                      className={`text-[0.9rem] ${
                        recommended ? "text-white/60" : "text-[#666]"
                      }`}
                      data-editor-field="periodSuffix"
                    >
                      {periodSuffix}
                    </span>
                  </div>

                  <ul className="mb-10 flex list-none flex-col gap-5 p-0">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className={`flex items-center gap-3 text-[0.95rem] ${
                          recommended ? "text-white/80" : "text-[#666]"
                        }`}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--accent)"
                          strokeWidth="3"
                          aria-hidden="true"
                          className="shrink-0"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={chooseUrl}
                    onClick={(event) =>
                      handleNavigate(event, chooseUrl, chooseText)
                    }
                    className="block w-full rounded bg-[var(--accent)] px-4 py-4 text-center text-[0.95rem] font-medium text-white no-underline transition hover:-translate-y-0.5 hover:brightness-95 max-md:px-4 max-md:py-2"
                    data-editor-field="chooseText"
                  >
                    {chooseText}
                    <span className="ml-2">→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
