"use client";

import type { SectionProps } from "../../../types/section";
import EventList from "./EventList";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventListPage({ data = {}, editorMode }: SectionProps) {
  return (
    <EventList
      editorMode={editorMode}
      data={mergeEventData(data, "events", "EventsList", "EventsListEvent1")}
    />
  );
}
