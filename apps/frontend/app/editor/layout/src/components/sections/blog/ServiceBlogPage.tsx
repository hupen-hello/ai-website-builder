"use client";

import type { SectionProps } from "../../../types/section";
import { BlogsSection } from "./ServiceBlogSection";

export default function ServiceBlogPage({ data = {}, editorMode }: SectionProps) {
  return (
    <BlogsSection data={data as never} editorMode={editorMode} isListingPage />
  );
}
