"use client";

import type { SectionProps } from "../../../types/section";
import EventList from "./EventList";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventListPage({ data = {} }: SectionProps) {
  return (
    <EventList
      data={mergeEventData(data, "events", "EventsList", "EventsListEvent1")}
    />
  );
}
