import { formatInr } from "@/lib/razorpayPlans";

export type ExportFormat = "html" | "nextjs";

export const EXPORT_MAX_DOWNLOADS = 5;

export const EXPORT_PACKAGES = {
  html: {
    format: "html" as const,
    label: "Export in HTML",
    description: "Static HTML + CSS + media ZIP",
    priceInr: 2500,
    chargeAmount: 250_000,
    chargeCurrency: "INR" as const,
  },
  nextjs: {
    format: "nextjs" as const,
    label: "Export in Next.js",
    description: "Runnable Next.js project ZIP",
    priceInr: 4500,
    chargeAmount: 450_000,
    chargeCurrency: "INR" as const,
  },
} as const;

export function getExportPackage(format: ExportFormat) {
  return EXPORT_PACKAGES[format];
}

export function formatExportPrice(format: ExportFormat) {
  return formatInr(EXPORT_PACKAGES[format].priceInr);
}

export function isExportFormat(value: unknown): value is ExportFormat {
  return value === "html" || value === "nextjs";
}
