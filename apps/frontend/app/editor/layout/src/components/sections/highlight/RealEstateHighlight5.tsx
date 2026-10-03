"use client";

import { useState } from "react";
import type { SectionProps } from "../../../types/section";
import { getAccentStyle } from "../../../lib/accentStyle";
import type { RealEstateHome5Step } from "../../../types/realEstateHome5";

export default function RealEstateHighlight5({ data = {} }: SectionProps) {
  const [active, setActive] = useState<number | null>(0);
  const accent = String(data.accentColor || "#ff6b00");
  const steps = (Array.isArray(data.steps) ? data.steps : []) as RealEstateHome5Step[];
  const image = String(data.sideImage || data.image || "/categories/realestate/template5/hero_worker.png");

  const fallbackSteps: RealEstateHome5Step[] = [
    {
      title: "Send a request",
      desc: "Contact us with your project details and requirements.",
    },
    {
      title: "Take measurements",
      desc: "Our experts will visit your site for precise measurements and planning.",
    },
    {
      title: "Approve budget",
      desc: "We provide a detailed estimate for your approval.",
    },
  ];
  const items = steps.length ? steps : fallbackSteps;

  return (
    <section
      className="bg-[#111] py-[30px] text-white"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor title sideImage steps"
    >
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-20 px-6 max-md:flex-col max-md:gap-6">
        <div className="relative mt-10 min-w-[280px] flex-1">
          <div className="absolute -top-9 -right-9 z-[1] h-[60%] w-[55%] border-2 border-white/30 bg-[repeating-linear-gradient(40deg,transparent,transparent_15px,rgba(255,255,255,0.3)_15px,rgba(255,255,255,0.3)_17px)]" />
          <div className="relative z-[2] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <img src={image} alt={String(data.sideImageTitle || "Worker")} className="block h-[500px] w-full object-cover" />
          </div>
        </div>
        <div className="min-w-[280px] flex-1">
          <h2 className="mb-8 text-5xl font-bold md:text-[4rem]">{String(data.title || "How it works")}</h2>
          <div>
            {items.map((item, index) => {
              const isOpen = active === index;
              return (
                <div key={`${item.title}-${index}`} className="border-b border-white/15">
                  <button
                    type="button"
                    onClick={() => setActive(isOpen ? null : index)}
                    className={`flex w-full items-center justify-between py-[18px] text-left text-[1.05rem] font-medium transition-colors ${
                      isOpen ? "text-[var(--accent)]" : "text-white"
                    }`}
                  >
                    <span>
                      <span className="mr-3 font-bold text-[var(--accent)]">{index + 1}.</span>
                      {item.title}
                    </span>
                    <span className={`text-[var(--accent)] transition-transform ${isOpen ? "rotate-45" : ""}`}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-5 text-[0.95rem] leading-relaxed text-white/70">{item.desc}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
