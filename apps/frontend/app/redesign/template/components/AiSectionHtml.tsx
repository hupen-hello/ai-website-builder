"use client";

import { useMemo, useRef } from "react";
import { normalizeSectionLayout } from "@/lib/redesign-section-layout";

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
  const safeHtml = useMemo(
    () => normalizeSectionLayout(html || "", sectionIndex, sectionLabel),
    [html, sectionIndex, sectionLabel],
  );

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
