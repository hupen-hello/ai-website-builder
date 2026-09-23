"use client";

import {
  Award,
  BadgeCheck,
  Building2,
  Clock,
  Handshake,
  Heart,
  Home,
  Key,
  MapPin,
  Phone,
  Scale,
  Shield,
  Star,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import type { SectionProps } from "../../../types/section";

type TextItem = { title: string; desc: string; icon?: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const valueIcons: Record<string, ComponentType<{ size?: number }>> = {
  scale: Scale,
  verified: BadgeCheck,
  handshake: Handshake,
  home: Home,
  shield: Shield,
  star: Star,
  heart: Heart,
  users: Users,
  phone: Phone,
  key: Key,
  building: Building2,
  clock: Clock,
  award: Award,
  "map-pin": MapPin,
};

const fallbackIcons = [Scale, BadgeCheck, Handshake, Home];

const getTextItems = (value: unknown): TextItem[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        isRecord(item) &&
        typeof item.title === "string" &&
        typeof item.desc === "string"
          ? [{
              title: item.title,
              desc: item.desc,
              icon: typeof item.icon === "string" ? item.icon : undefined,
            }]
          : [],
      )
    : [];

export default function RealEstateMissionValues1({ data = {} }: SectionProps) {
  const values = getTextItems(data.values);

  return (
    <section
      data-editor-section-label="Company Values"
      data-editor-fields="pretitle title values"
      className="bg-white px-5 py-14 text-[#141414] md:px-8 md:py-20 lg:px-10"
    >
      <div className="mx-auto max-w-7xl text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a4472f]">
          {typeof data.pretitle === "string"
            ? data.pretitle
            : typeof data.valuesPretitle === "string"
              ? data.valuesPretitle
              : "What we stand for"}
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-medium tracking-[-0.03em] md:text-4xl">
          {typeof data.title === "string"
            ? data.title
            : typeof data.valuesTitle === "string"
              ? data.valuesTitle
              : "Principles that shape every conversation."}
        </h2>
        <div
          data-box-layout-grid="grid"
          className="mt-10 grid gap-px overflow-hidden rounded-[1.25rem] border border-[#141414]/10 bg-[#141414]/10 sm:grid-cols-2"
        >
          {values.map((item, index) => {
            const Icon =
              (item.icon && valueIcons[item.icon]) ||
              fallbackIcons[index % fallbackIcons.length];
            return (
              <article key={item.title} className="bg-[#f8f6f1] p-7 md:p-9">
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white text-[#a4472f]">
                  <Icon size={20} />
                </span>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#141414]/60">
                  {item.desc}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
