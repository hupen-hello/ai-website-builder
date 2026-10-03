"use client";

import type { SectionProps } from "../../../types/section";
import EventMission from "./EventMission";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventMissionPage({ data = {} }: SectionProps) {
  return (
    <EventMission
      data={mergeEventData(data, "mission", "Mission", "MissionEvent1")}
    />
  );
}
