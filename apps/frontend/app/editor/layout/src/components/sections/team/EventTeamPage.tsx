"use client";

import type { SectionProps } from "../../../types/section";
import EventTeam from "./EventTeam";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventTeamPage({ data = {} }: SectionProps) {
  return (
    <EventTeam
      data={mergeEventData(data, "team", "OurTeam", "OurTeamEvent1")}
    />
  );
}
