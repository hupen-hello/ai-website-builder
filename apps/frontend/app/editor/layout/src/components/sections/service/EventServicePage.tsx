"use client";

import type { SectionProps } from "../../../types/section";
import EventService from "./EventService";
import { mergeEventData } from "../about/eventPageDefaults";

export default function EventServicePage({ data = {}, editorMode }: SectionProps) {
  const merged = mergeEventData(data, "services", "Services", "ServicesEvent1");
  return (
    <EventService
      editorMode={editorMode}
      data={{
        ...merged,
        ...(Array.isArray(data.productItems)
          ? { productItems: data.productItems }
          : {}),
        ...(Array.isArray(data.items) ? { items: data.items } : {}),
      }}
    />
  );
}
