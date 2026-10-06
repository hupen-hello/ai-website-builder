"use client";

import type { SectionProps } from "../../../types/section";
import EventBlog from "./EventBlog";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventBlogPage({ data = {}, editorMode }: SectionProps) {
  return (
    <EventBlog
      editorMode={editorMode}
      data={mergeEventData(data, "blog", "Blog", "BlogEvent1")}
    />
  );
}
