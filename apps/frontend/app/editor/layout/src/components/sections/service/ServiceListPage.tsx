"use client";

import type { SectionProps } from "../../../types/section";
import { ServicesSection } from "./ServiceSection1";

export default function ServiceListPage({
  data = {},
  editorMode,
}: SectionProps) {
  return (
    <ServicesSection data={data as never} editorMode={editorMode} hideButton />
  );
}
