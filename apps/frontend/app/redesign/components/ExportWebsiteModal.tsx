"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, X } from "lucide-react";
import { getBuiltSiteTheme } from "@/lib/built-site-theme";
import { getRedesignBuildPayload } from "@/lib/redesign-build-storage";
import { downloadRedesignHtml } from "@/lib/redesign-export-html";

type ExportFormat = "html" | "next";

const EXPORT_OPTIONS = [
  {
    id: "html" as const,
    title: "Export in HTML",
    description: "Single index.html with Tailwind CDN",
  },
  {
    id: "next" as const,
    title: "Export in Next.js",
    description: "HTML download for now (Next.js ZIP soon)",
  },
];

type ExportWebsiteModalProps = {
  open: boolean;
  onClose: () => void;
  designId?: string;
};

export default function ExportWebsiteModal({
  open,
  onClose,
  designId,
}: ExportWebsiteModalProps) {
  const [format, setFormat] = useState<ExportFormat>("html");
  const [ownerName, setOwnerName] = useState("Your website");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;

      const themeName = getBuiltSiteTheme(designId)?.brandName?.trim() || "";
      const payloadName = getRedesignBuildPayload()?.websiteName?.trim() || "";
      setOwnerName(themeName || payloadName || "Your website");
      setFormat("html");
      setError("");
    });
    return () => {
      active = false;
    };
  }, [open, designId]);

  if (!open) return null;

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      downloadRedesignHtml(designId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-website-title"
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-[28px] bg-white p-6 text-slate-900 shadow-[0_40px_120px_rgba(8,19,47,.28)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className="grid size-11 place-items-center rounded-full bg-blue-50 text-blue-600">
            <Download size={20} />
          </span>
          <button
            type="button"
            aria-label="Close export dialog"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <h2 id="export-website-title" className="mt-4 text-center text-xl font-bold tracking-[-0.02em] text-[#08132f]">
          Export Website
        </h2>
        <p className="mt-2 text-center text-sm leading-6 text-slate-500">
          {ownerName} — choose a format and download instantly. No payment required.
        </p>

        <div className="mt-6 space-y-3">
          {EXPORT_OPTIONS.map((option) => {
            const selectedOption = format === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFormat(option.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                  selectedOption
                    ? "border-blue-500 bg-blue-50/80 ring-1 ring-blue-500"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                    selectedOption ? "border-blue-600" : "border-slate-300"
                  }`}
                >
                  {selectedOption && <span className="size-2.5 rounded-full bg-blue-600" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#08132f]">{option.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
        ) : (
          <p className="mt-5 text-xs leading-5 text-slate-400">
            Downloads a standalone HTML file you can open in any browser or host on any server.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="h-11 rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#315ff4] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(49,95,244,.28)] transition hover:bg-[#244ed8] disabled:opacity-60"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download HTML
          </button>
        </div>
      </div>
    </div>
  );
}
