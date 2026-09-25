"use client";

import { Check } from "lucide-react";
import { pricingPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  PricingTable4Data,
  PricingTable4Row,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const tiers = ["basic", "standard", "premium", "ultimate"] as const;

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-[var(--accent)]" strokeWidth={2.5} />
    ) : (
      <span className="font-bold text-gray-400">—</span>
    );
  }

  return <>{value}</>;
}

export default function RealEstatePricingTable4({ data = {} }: SectionProps) {
  const authored = pricingPage4Content.RealEstatePricingTable4;
  const content: PricingTable4Data = {
    ...authored,
    ...(data as PricingTable4Data),
  };
  const rows: PricingTable4Row[] = content.rows?.length
    ? content.rows
    : (authored.rows ?? []);

  return (
    <section
      className="bg-white py-8 pb-16 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="pricingTable"
      data-editor-fields="accentColor title rows"
    >
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h3
            className="mb-2 text-[22px] font-bold text-secondary"
            data-editor-field="title"
          >
            {content.title ?? "Compare All Features"}
          </h3>
          <div className="h-[3px] w-12 bg-[var(--accent)]" />
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full min-w-[800px] border-collapse bg-white">
            <thead>
              <tr className="bg-[var(--accent)] text-white">
                <th className="px-6 py-4 text-left font-semibold tracking-wide">
                  Features
                </th>
                <th className="px-6 py-4 text-center font-semibold tracking-wide">
                  Basic
                </th>
                <th className="px-6 py-4 text-center font-semibold tracking-wide">
                  Standard
                </th>
                <th className="px-6 py-4 text-center font-semibold tracking-wide">
                  Premium
                </th>
                <th className="px-6 py-4 text-center font-semibold tracking-wide">
                  Ultimate
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((feature) => (
                <tr
                  key={feature.name}
                  className="border-b border-gray-200 last:border-b-0 transition-colors hover:bg-gray-50/50"
                >
                  <td
                    className={`px-6 py-4 text-[15px] ${
                      feature.isPrice
                        ? "font-bold text-secondary"
                        : "font-medium text-gray-700"
                    }`}
                    data-editor-field="name"
                  >
                    {feature.name}
                  </td>
                  {tiers.map((tier) => (
                    <td
                      key={tier}
                      className={`px-6 py-4 text-center text-[15px] ${
                        feature.isPrice
                          ? "font-bold text-secondary"
                          : "text-gray-600"
                      }`}
                    >
                      <CellValue value={feature[tier]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
