"use client";

import type { SectionProps } from "../../../types/section";
import EventAbout from "./EventAbout";
import { mergeEventData } from "./eventPageDefaults";

export default function EventAboutPage({ data = {} }: SectionProps) {
  return (
    <EventAbout data={mergeEventData(data, "about", "About", "AboutEvent1")} />
  );
}
