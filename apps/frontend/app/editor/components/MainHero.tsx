"use client";

import type React from "react";
import Layout from "../layout/page";
import { usePreview } from "../layout/src/components/context/PreviewContext";

type MainHeroProps = {
  collapsed: boolean;
};

export default function MainHero({ collapsed }: MainHeroProps) {
  const { isPreview, viewportMode } = usePreview();
  const showMobileFrame = isPreview && viewportMode === "mobile";

  return (
    <section
      className={`min-h-screen bg-white transition-all overflow-hidden duration-300 ${
        collapsed ? "md:pl-14" : "md:pl-42"
      }`}
      style={
        {
          "--template-floating-left": collapsed ? "4.75rem" : "11.75rem",
        } as React.CSSProperties
      }
    >
      <div className="relative h-[calc(100vh-4rem)] w-full px-3 pt-2 mt-14">
        {showMobileFrame ? (
          <div className="flex h-full items-center justify-center overflow-hidden bg-[#fbfbfc]">
            <style>
              {`
                .phone-preview-screen {
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                  overscroll-behavior: contain;
                }

                .phone-preview-screen::-webkit-scrollbar {
                  display: none;
                }
              `}
            </style>
            <div className="relative h-[min(760px,calc(100vh-6rem))] w-[270px] max-w-[calc(100vw-2rem)] rounded-[3.25rem] bg-[#0b1020] p-[8px] shadow-[0_30px_80px_rgba(15,23,42,0.24)] ring-1 ring-slate-950/20">
              <div className="absolute -left-[3px] top-28 h-16 w-[3px] rounded-l-full bg-slate-800" />
              <div className="absolute -right-[3px] top-36 h-20 w-[3px] rounded-r-full bg-slate-800" />
              <div className="absolute left-1/2 top-[18px] z-10 h-7 w-28 -translate-x-1/2 rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <span className="absolute right-4 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-slate-700" />
              </div>
              <div className="pointer-events-none absolute inset-[12px] z-10 rounded-[2.55rem] ring-1 ring-white/10" />
              <div
                data-template-scroll
                className="phone-preview-screen relative h-full w-full overflow-y-auto overflow-x-hidden rounded-[2.55rem] bg-white"
              >
                <div className="min-h-full w-full max-w-full overflow-x-hidden">
                  <Layout />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            data-template-scroll
            className="relative h-full w-full overflow-y-auto rounded-lg border"
          >
            <Layout />
          </div>
        )}
      </div>
    </section>
  );
}
