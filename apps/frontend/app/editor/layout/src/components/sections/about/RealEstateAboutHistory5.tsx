"use client";

import { useState } from "react";
import type { SectionProps } from "../../../types/section";

type HistoryTab = { id?: string; label?: string; image?: string };
type TimelineItem = {
  date?: string;
  title?: string;
  desc?: string;
  image?: string;
};

const IMG = "/categories/realestate/template5";

const defaultTabs: HistoryTab[] = [
  { id: "history", label: "Company History", image: `${IMG}/bathroom_reno.png` },
  { id: "mission", label: "Our Mission", image: `${IMG}/kitchen_reno.png` },
  { id: "goal", label: "Company Goal", image: `${IMG}/bathroom_reno.png` },
  { id: "awards", label: "Awards Winnings", image: `${IMG}/office_reno.png` },
];

const defaultTimeline: TimelineItem[] = [
  {
    date: "22th JULY, 2023",
    title: "First 10 Year Anniversary",
    desc: "Their designs focus not only on aesthetics, but also on functionality of place.",
    image: `${IMG}/hero_worker.png`,
  },
  {
    date: "22th JULY, 2022",
    title: "Founded In 2022",
    desc: "Their designs focus not only on aesthetics, but also on functionality of place.",
    image: `${IMG}/office_reno.png`,
  },
  {
    date: "22th JULY, 2021",
    title: "Construction In 2022",
    desc: "Their designs focus not only on aesthetics, but also on functionality of place.",
    image: `${IMG}/kitchen_reno.png`,
  },
];

export default function RealEstateAboutHistory5({ data = {} }: SectionProps) {
  const historySubtitle = String(
    data.historySubtitle || "Why Choose Our Company",
  );
  const historyTitle = String(
    data.historyTitle ||
      "We Help You Build On Your Past And Prepare For The Feature",
  );
  const tabs = (
    Array.isArray(data.historyTabs) && data.historyTabs.length
      ? data.historyTabs
      : defaultTabs
  ) as HistoryTab[];
  const timeline = (
    Array.isArray(data.timeline) && data.timeline.length
      ? data.timeline
      : defaultTimeline
  ) as TimelineItem[];
  const [activeTab, setActiveTab] = useState(
    String(data.defaultTab || tabs[0]?.id || "history"),
  );
  const active =
    tabs.find((tab) => tab.id === activeTab) || tabs[0] || defaultTabs[0];

  return (
    <section
      className="bg-[#f9f9f9] py-[30px]"
      data-editor-section-label="history"
      data-editor-fields="historySubtitle historyTitle defaultTab historyTabs timeline accentColor"
    >
      <div className="mx-auto max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-[60px] text-center">
          <div className="mb-4 flex items-center justify-center gap-2 text-[0.9rem] font-semibold tracking-wide text-[var(--accent)] uppercase">
            {historySubtitle}
          </div>
          <h2 className="mx-auto max-w-[700px] font-extrabold text-[#333]">
            {historyTitle}
          </h2>
        </div>

        <div className="mb-[60px] flex justify-center gap-4 max-md:justify-start max-md:overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(String(tab.id))}
              className={`whitespace-nowrap rounded px-8 py-4 text-base font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--accent)] text-white shadow-[0_10px_20px_rgba(255,107,0,0.2)]"
                  : "border border-[#eaeaea] bg-white text-[#333]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-stretch gap-[60px] max-md:flex-col max-md:gap-6">
          <div className="h-[500px] flex-1 overflow-hidden rounded-lg max-md:h-[340px]">
            <img
              src={String(active?.image || `${IMG}/bathroom_reno.png`)}
              alt={String(active?.label || "History")}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-8">
            {timeline.map((item) => (
              <div
                key={`${item.date}-${item.title}`}
                className="flex items-stretch gap-6 max-md:gap-3"
              >
                <div className="relative flex w-[130px] flex-col items-center justify-center bg-white px-4 py-4 text-center text-[0.95rem] leading-snug font-bold text-[var(--accent)] shadow-[0_4px_15px_rgba(0,0,0,0.03)] max-md:w-20 max-md:px-2 max-md:py-3 max-md:text-[0.8rem]">
                  {String(item.date || "")
                    .split(" ")
                    .map((word, index) => (
                      <div key={`${word}-${index}`}>{word}</div>
                    ))}
                  <div className="absolute top-1/2 right-[-8px] z-[2] h-4 w-4 -translate-y-1/2 rotate-45 bg-white" />
                </div>
                <div className="flex flex-1 items-stretch bg-white shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
                  <div className="w-[140px] shrink-0 max-md:w-20">
                    <img
                      src={item.image || `${IMG}/hero_worker.png`}
                      alt={item.title || ""}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6 max-md:p-4">
                    <h4 className="mb-2 text-[1.2rem] font-bold text-[#333] max-md:text-base">
                      {item.title}
                    </h4>
                    <p className="m-0 text-[0.95rem] leading-relaxed text-[#666] max-md:text-[0.8rem]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
