"use client";

import type { SectionProps } from "../../../types/section";
import EventOurStory from "./EventOurStory";
import { mergeEventData } from "./eventPageDefaults";

export default function EventOurStoryPage({ data = {} }: SectionProps) {
  return (
    <EventOurStory
      data={mergeEventData(data, "story", "OurStory", "OurStoryEvent1")}
    />
  );
}
