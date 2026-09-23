"use client";

import { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import {
  applyInlineTextFormats,
  type InlineTextFormat,
} from "../../lib/inlineTextFormatting";
import {
  createInlineFormatRegistry,
  getUnconsumedInlineTextFormats,
  InlineTextFormattingProvider,
} from "./InlineRichText";

type InlineFormattedSectionProps = {
  children: ReactNode;
  className?: string;
  anchorId?: string;
  sectionType?: string;
  formats: InlineTextFormat[];
};

export default function InlineFormattedSection({
  children,
  className,
  anchorId,
  sectionType,
  formats,
}: InlineFormattedSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const formatRegistry = useMemo(
    () => createInlineFormatRegistry(formats),
    [formats],
  );

  useLayoutEffect(() => {
    if (!sectionRef.current) return;

    applyInlineTextFormats(
      sectionRef.current,
      getUnconsumedInlineTextFormats(formatRegistry),
    );
  }, [formatRegistry]);

  return (
    <InlineTextFormattingProvider registry={formatRegistry}>
      <section
        ref={sectionRef}
        id={anchorId}
        data-section-id={anchorId}
        data-section-type={sectionType}
        className={className}
      >
        {children}
      </section>
    </InlineTextFormattingProvider>
  );
}
