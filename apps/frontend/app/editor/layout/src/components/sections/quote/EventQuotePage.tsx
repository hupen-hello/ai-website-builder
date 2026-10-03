"use client";

import type { SectionProps } from "../../../types/section";
import EventQuote from "./EventQuote";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventQuotePage({ data = {} }: SectionProps) {
  return (
    <EventQuote
      data={mergeEventData(data, "quote", "GetAQuote", "GetAQuoteEvent1")}
    />
  );
}
