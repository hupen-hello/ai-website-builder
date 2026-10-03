"use client";

import type { SectionProps } from "../../../types/section";
import EventVision from "./EventVision";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventVisionPage({ data = {} }: SectionProps) {
  return (
    <EventVision
      data={mergeEventData(data, "vision", "Vision", "VisionEvent1")}
    />
  );
}
