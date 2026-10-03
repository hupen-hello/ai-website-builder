"use client";

import type { SectionProps } from "../../../types/section";
import EventContact from "./EventContact";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventContactPage({ data = {} }: SectionProps) {
  return (
    <EventContact
      data={mergeEventData(data, "form", "ContactForm", "ContactFormEvent1")}
    />
  );
}
