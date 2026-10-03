"use client";

import type { SectionProps } from "../../../types/section";
import EventCareer from "./EventCareer";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventCareerPage({ data = {} }: SectionProps) {
  return (
    <EventCareer
      data={mergeEventData(data, "career", "Career", "CareerEvent1")}
    />
  );
}
