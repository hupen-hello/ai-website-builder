"use client";

import type { SectionProps } from "../../../types/section";
import EventTeam from "./EventTeam";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventTeamPage({ data = {}, editorMode }: SectionProps) {
  return (
    <EventTeam
      editorMode={editorMode}
      data={mergeEventData(data, "team", "OurTeam", "OurTeamEvent1")}
    />
  );
}
