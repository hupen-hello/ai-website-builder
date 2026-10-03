"use client";

import type { SectionProps } from "../../../types/section";
import EventService from "./EventService";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventServicePage({ data = {} }: SectionProps) {
  return (
    <EventService
      data={mergeEventData(data, "services", "Services", "ServicesEvent1")}
    />
  );
}
