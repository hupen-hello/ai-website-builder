"use client"
import { Users, Award, Lightbulb, Handshake, CheckCircle } from "lucide-react"
import { SectionProps } from "../../../types/section"
import type { Mission4Data, Mission4Value } from "../../../types/realEstatePage4"
import { missionPage4Content } from "../../../data/realEstatePage4Content"
import { getAccentStyle } from "../../../lib/accentStyle"

export default function MissionValues({ data = {} }: SectionProps) {
  const authored = missionPage4Content.RealEstateMission4;
  const content: Mission4Data = { ...authored, ...(data as Mission4Data) };

  const pretitle = content.pretitle ?? "Our Mission";
  const title = content.title ?? "Turning Vision Into Reality";
  const description = content.description ?? content.desc ?? "";

  const valuesList: Mission4Value[] = content.values?.length
    ? content.values
    : (authored.values ?? []);

  const getIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'users': return Users;
      case 'award': return Award;
      case 'lightbulb': return Lightbulb;
      case 'handshake': return Handshake;
      default: return CheckCircle;
    }
  };

  return (
    <section
      className="py-8 md:py-12 bg-white"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="missionValues"
      data-editor-fields="accentColor pretitle title description values"
    >
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p
            className="text-[var(--accent)] font-bold text-sm tracking-wider uppercase mb-3"
            data-editor-field="pretitle"
          >
            {pretitle}
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold text-secondary mb-6"
            data-editor-field="title"
          >
            {title}
          </h2>
          <div className="w-12 h-0.5 bg-[var(--accent)] mx-auto mb-8" />
          <p
            className="text-gray-600 leading-relaxed text-lg"
            data-editor-field="description"
          >
            {description}
          </p>
        </div>

        {/* Values Grid */}
        <div
          className="flex flex-col lg:flex-row items-stretch justify-center w-full lg:py-4"
          data-box-layout-grid="grid"
        >
          {valuesList.map((value: Mission4Value, index: number) => {
            const Icon = getIcon(value.icon);
            return (
              <div
                key={value.id || index}
                className={`flex flex-col items-center text-center group w-full lg:w-1/4 px-4 sm:px-8 py-8 lg:py-0 ${index !== valuesList.length - 1 ? 'lg:border-r lg:border-dashed border-gray-200' : ''
                  }`}
              >
                <div className="w-[100px] h-[100px] rounded-full bg-[#f0f7f8] flex items-center justify-center mb-8 text-[var(--accent)] transition-transform duration-300 group-hover:scale-105">
                  <Icon className="w-10 h-10" />
                </div>
                <h4
                  className="font-bold text-[19px] text-secondary mb-4"
                  data-editor-field="valueTitle"
                >
                  {value.title ?? ""}
                </h4>
                <div className="w-10 h-[2px] bg-[var(--accent)] mx-auto mb-5" />
                <p
                  className="text-gray-500 text-[15px] leading-[1.7]"
                  data-editor-field="valueDescription"
                >
                  {value.description ?? value.desc ?? ""}
                </p>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}