"use client";

import { ArrowRight, Play } from "lucide-react";
import { useBuiltSiteSections, useBuiltSiteTheme } from "./BuiltSiteProvider";
import AiSectionHtml from "./AiSectionHtml";

export default function Banner() {
  const theme = useBuiltSiteTheme();
  const sections = useBuiltSiteSections();
  const primaryColor = theme?.primaryColor || "#2563eb";
  const accentColor = theme?.accentColor || "#7c3aed";
  const backgroundColor = theme?.backgroundColor || "#f7f5ff";
  const primaryCta = theme?.ctaButtons[0] || "Get started";
  const secondaryCta = theme?.ctaButtons[1] || "Watch the story";
  const isCentered = theme?.heroLayout === "center";

  return (
    <AiSectionHtml
      html={sections?.banner}
      fallback={
    <section
      className="relative isolate overflow-hidden px-6 py-20 sm:py-28 lg:px-10 lg:py-32"
      style={{ backgroundColor, fontFamily: theme?.fontFamily }}
    >
      <div
        className="absolute -right-40 -top-36 -z-10 h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ backgroundColor: `${primaryColor}35` }}
      />
      <div
        className="absolute -bottom-48 left-1/3 -z-10 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ backgroundColor: `${accentColor}30` }}
      />

      <div
        className={`mx-auto grid max-w-7xl items-center gap-14 ${isCentered ? "max-w-4xl text-center" : "lg:grid-cols-[1.05fr_.95fr]"}`}
      >
        <div>
          <p
            className="mb-5 text-sm font-bold uppercase tracking-[0.18em]"
            style={{ color: primaryColor }}
          >
            {theme?.tagline || "Teamwork starts here"}
          </p>
          <h1
            className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl"
            style={{ color: theme?.textColor || "#101214" }}
          >
            {theme?.headline || "Impossible alone."}
            <span className="block" style={{ color: primaryColor }}>
              {theme?.headlineAccent || "Possible together."}
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
            {theme?.description ||
              "Connect every team, project, and goal in one place so your people can move faster and build what matters."}
          </p>

          {theme?.paragraphs.slice(0, 2).map((paragraph) => (
            <p key={paragraph} className="mt-4 max-w-xl text-base leading-7 text-slate-500">
              {paragraph}
            </p>
          ))}

          <div className={`mt-9 flex flex-wrap items-center gap-4 ${isCentered ? "justify-center" : ""}`}>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{
                backgroundColor: primaryColor,
                borderRadius: theme?.buttonRadius || "9999px",
                boxShadow: `0 12px 30px ${primaryColor}33`,
              }}
            >
              {primaryCta}
              <ArrowRight size={18} />
            </a>
            <button
              className="inline-flex items-center gap-3 border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400"
              style={{ borderRadius: theme?.buttonRadius || "9999px" }}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white">
                <Play size={12} fill="currentColor" />
              </span>
              {secondaryCta}
            </button>
          </div>
        </div>

        {!isCentered && (
          <div className="relative mx-auto w-full max-w-xl">
            {theme?.heroImage ? (
              <div
                className="overflow-hidden rounded-[2rem] p-5 shadow-[0_35px_80px_rgba(60,65,180,0.25)]"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                }}
              >
                {/* Dynamic built-site URLs are not next/image-safe. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={theme.heroImage}
                  alt={theme.brandName}
                  className="aspect-[5/4] w-full rounded-[1.4rem] object-cover"
                />
              </div>
            ) : (
              <div
                className="aspect-[5/4] rounded-[2rem] p-5 shadow-[0_35px_80px_rgba(60,65,180,0.25)]"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                }}
              >
                <div className="flex h-full flex-col rounded-[1.4rem] bg-white/95 p-5 backdrop-blur">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    <span className="ml-3 h-2.5 w-32 rounded-full bg-slate-200" />
                  </div>
                  <div className="grid min-h-0 flex-1 grid-cols-[.55fr_1fr] gap-4 pt-5">
                    <div className="space-y-3 rounded-xl bg-slate-100 p-3">
                      {(theme?.listItems.slice(0, 4) || [70, 90, 55, 78]).map((item, index) => (
                        <div
                          key={typeof item === "string" ? item : index}
                          className="h-3 rounded-full bg-slate-300"
                          title={typeof item === "string" ? item : undefined}
                        />
                      ))}
                    </div>
                    <div className="grid grid-rows-[.7fr_1fr] gap-4">
                      <div
                        className="rounded-xl p-4"
                        style={{ backgroundColor: `${primaryColor}18` }}
                      >
                        <div
                          className="h-3 w-2/3 rounded"
                          style={{ backgroundColor: `${primaryColor}55` }}
                        />
                        <div
                          className="mt-4 h-8 w-4/5 rounded-lg"
                          style={{ backgroundColor: primaryColor }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className="rounded-xl"
                          style={{ backgroundColor: `${accentColor}22` }}
                        />
                        <div className="rounded-xl bg-amber-100" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
      }
    />
  );
}
