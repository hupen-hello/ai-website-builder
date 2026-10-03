"use client";

import type { SectionProps } from "../../../types/section";
import EventFaq from "./EventFaq";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventFaqPage({ data = {} }: SectionProps) {
  return (
    <EventFaq data={mergeEventData(data, "faqs", "Faqs", "FaqsEvent1")} />
  );
}
