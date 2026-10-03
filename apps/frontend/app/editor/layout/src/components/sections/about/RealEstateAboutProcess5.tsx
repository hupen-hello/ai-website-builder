"use client";

import type { SectionProps } from "../../../types/section";

type ProcessStep = { title?: string; desc?: string; icon?: string };

const defaultSteps: ProcessStep[] = [
  {
    title: "Project Research",
    desc: "Industrial manufacturing products have a global impact, supporting various sectors and markets worldwide.",
    icon: "document",
  },
  {
    title: "Quality Products",
    desc: "Industrial manufacturing products have a global impact, supporting various sectors and markets worldwide.",
    icon: "star",
  },
  {
    title: "Start Working",
    desc: "Industrial manufacturing products have a global impact, supporting various sectors and markets worldwide.",
    icon: "square",
  },
  {
    title: "Finished Work",
    desc: "Industrial manufacturing products have a global impact, supporting various sectors and markets worldwide.",
    icon: "check",
  },
];

function ProcessIcon({ type }: { type: string }) {
  if (type === "document") {
    return (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    );
  }
  if (type === "star") {
    return (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    );
  }
  if (type === "square") {
    return <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />;
  }
  return <polyline points="20 6 9 17 4 12" />;
}

export default function RealEstateAboutProcess5({ data = {} }: SectionProps) {
  const processSubtitle = String(data.processSubtitle || "How It Works");
  const processTitle = String(data.processTitle || "Our Work Process");
  const steps = (
    Array.isArray(data.processSteps) && data.processSteps.length
      ? data.processSteps
      : defaultSteps
  ) as ProcessStep[];
  const stepPrefix = String(data.stepPrefix || "STEP-0");

  return (
    <section
      className="bg-[#f9f9f9] py-[30px]"
      data-editor-section-label="workProcess"
      data-editor-fields="processSubtitle processTitle processSteps stepPrefix accentColor"
    >
      <div className="mx-auto max-w-[1320px] px-6 max-md:px-5">
        <div className="mb-[60px] text-center">
          <div className="mb-4 text-[0.9rem] font-semibold tracking-wide text-[var(--accent)] uppercase">
            {processSubtitle}
          </div>
          <h2 className="font-extrabold text-[#333]">{processTitle}</h2>
        </div>
        <div className="mt-[60px] grid grid-cols-1 gap-[30px] text-center sm:grid-cols-2 lg:grid-cols-4 max-md:gap-[60px]">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative bg-white px-6 pt-0 pb-10 shadow-[0_10px_30px_rgba(0,0,0,0.05)]"
            >
              <div className="mx-auto mt-[-40px] mb-6 flex flex-col items-center drop-shadow-[0_5px_15px_rgba(0,0,0,0.08)]">
                <div className="relative z-[1] flex h-[90px] w-[90px] items-center justify-center bg-white">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-[var(--accent)]"
                  >
                    <ProcessIcon type={String(step.icon || "check")} />
                  </svg>
                  <div className="absolute bottom-[-8px] left-1/2 z-[-1] h-4 w-4 -translate-x-1/2 rotate-45 bg-white" />
                </div>
              </div>
              <div className="mb-2 text-[0.85rem] font-bold tracking-wide text-[#888] uppercase">
                {stepPrefix}
                {index + 1}
              </div>
              <h4 className="mb-4 text-[1.25rem] font-extrabold text-[#161616]">
                {step.title}
              </h4>
              <p className="m-0 text-[0.95rem] leading-relaxed text-[#666]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
