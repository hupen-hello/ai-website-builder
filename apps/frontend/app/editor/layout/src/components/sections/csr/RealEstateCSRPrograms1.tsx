"use client";

import type { SectionProps } from "../../../types/section";
import RealEstateEditorialCards1 from "../featured/RealEstateEditorialCards1";

type Program = {
  title: string;
  desc: string;
  image: string;
  amount?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getPrograms = (value: unknown): Program[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        isRecord(item) &&
        typeof item.title === "string" &&
        typeof item.desc === "string" &&
        typeof item.image === "string"
          ? [
              {
                title: item.title,
                desc: item.desc,
                image: item.image,
                amount:
                  typeof item.amount === "string" ? item.amount : undefined,
              },
            ]
          : [],
      )
    : [];

export default function RealEstateCSRPrograms1({ data = {} }: SectionProps) {
  const programs = getPrograms(data.programs);

  return (
    <RealEstateEditorialCards1
      sectionLabel="Community Programs"
      editorFields={["pretitle", "title", "programs"]}
      pretitle={
        typeof data.pretitle === "string"
          ? data.pretitle
          : typeof data.programsPretitle === "string"
            ? data.programsPretitle
            : "Our initiatives"
      }
      title={
        typeof data.title === "string"
          ? data.title
          : typeof data.programsTitle === "string"
            ? data.programsTitle
            : "Practical support for stronger communities."
      }
      items={programs.map((program) => ({
        title: program.title,
        description: program.desc,
        image: program.image,
        alt: program.title,
        eyebrow: program.amount,
      }))}
    />
  );
}
