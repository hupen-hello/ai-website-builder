"use client";

import type { SectionProps } from "../../../types/section";
import EventAwards from "./EventAwards";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventAwardsPage({ data = {} }: SectionProps) {
  return (
    <EventAwards
      data={mergeEventData(data, "awards", "Awards", "AwardsEvent1")}
    />
  );
}
