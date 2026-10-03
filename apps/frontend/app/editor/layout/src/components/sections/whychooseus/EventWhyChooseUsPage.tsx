"use client";

import type { SectionProps } from "../../../types/section";
import EventWhyChooseUs from "./EventWhyChooseUs";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventWhyChooseUsPage({ data = {} }: SectionProps) {
  return (
    <EventWhyChooseUs
      data={mergeEventData(
        data,
        "whyChooseUs",
        "WhyChooseUs",
        "WhyChooseUsEvent1",
      )}
    />
  );
}
