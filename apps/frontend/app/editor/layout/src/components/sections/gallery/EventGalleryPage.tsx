"use client";

import type { SectionProps } from "../../../types/section";
import EventGallery from "./EventGallery";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventGalleryPage({ data = {} }: SectionProps) {
  return (
    <EventGallery
      data={mergeEventData(data, "gallery", "ImageGallery", "ImageGallery1")}
    />
  );
}
