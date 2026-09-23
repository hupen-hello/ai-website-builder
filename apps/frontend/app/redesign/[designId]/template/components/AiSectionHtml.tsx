"use client";

import { useEffect, useMemo, useRef } from "react";
import { normalizeSectionLayout } from "@/lib/redesign-section-layout";
import { initRedesignPreviewInteractions } from "@/lib/redesign-preview-runtime";

/** Renders AI section HTML while keeping EditableSection chrome (Code / Delete / Drag). */
export default function AiSectionHtml({
  html,
  fallback,
  sectionIndex = 0,
  sectionLabel = "",
}: {
  html?: string | null;
  fallback: React.ReactNode;
  sectionIndex?: number;
  sectionLabel?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const safeHtml = useMemo(() => {
    const raw = html || "";
    // finalizeRedesignSections already normalized — avoid double-pass layout breaks.
    if (/data-section-id=/i.test(raw)) return raw;
    return normalizeSectionLayout(raw, sectionIndex, sectionLabel);
  }, [html, sectionIndex, sectionLabel]);

  useEffect(() => {
    if (!safeHtml.trim()) return;
    const id = window.requestAnimationFrame(() => {
      initRedesignPreviewInteractions();
      (window as Window & { tailwind?: { refresh?: () => void } }).tailwind?.refresh?.();
    });
    return () => window.cancelAnimationFrame(id);
  }, [safeHtml]);

  if (safeHtml.trim()) {
    return (
      <div
        ref={rootRef}
        className="ai-redesign-section w-full max-w-full overflow-x-clip"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }
  return <>{fallback}</>;
}
