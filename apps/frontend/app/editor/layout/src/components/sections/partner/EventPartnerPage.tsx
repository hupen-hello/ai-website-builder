"use client";

import type { SectionProps } from "../../../types/section";
import EventPartner from "./EventPartner";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventPartnerPage({ data = {} }: SectionProps) {
  return (
    <EventPartner
      data={mergeEventData(data, "partners", "Partners", "PartnersEvent1")}
    />
  );
}
