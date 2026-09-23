import { ArrowRight, Play } from "lucide-react";
import type { BuiltSiteTheme } from "@/lib/built-site-theme";

export default function BuiltBanner({ theme }: { theme: BuiltSiteTheme }) {
  const primaryCta = theme.ctaButtons[0] || "Get started";
  const secondaryCta = theme.ctaButtons[1] || "Learn more";
  const isCentered = theme.heroLayout === "center";

  return (
    <section
      className="relative isolate overflow-hidden px-6 py-20 sm:py-28 lg:px-10 lg:py-32"
      style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.fontFamily }}
    >
      <div
        className="absolute -right-40 -top-36 -z-10 h-[34rem] w-[34rem] rounded-full blur-3xl"
        style={{ backgroundColor: `${theme.primaryColor}35` }}
      />
      <div
        className="absolute -bottom-48 left-1/3 -z-10 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{ backgroundColor: `${theme.accentColor}30` }}
      />

      <div
        className={`mx-auto grid max-w-7xl items-center gap-14 ${isCentered ? "max-w-4xl text-center" : "lg:grid-cols-[1.05fr_.95fr]"}`}
      >
        <div>
          <p
            className="mb-5 text-sm font-bold uppercase tracking-[0.18em]"
            style={{ color: theme.primaryColor }}
          >
            {theme.tagline}
          </p>
          <h1
            className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl"
            style={{ color: theme.textColor }}
          >
            {theme.headline}
            {theme.headlineAccent && (
              <span className="block" style={{ color: theme.primaryColor }}>
                {theme.headlineAccent}
              </span>
            )}
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">{theme.description}</p>

          {theme.paragraphs.slice(0, 2).map((paragraph) => (
            <p key={paragraph} className="mt-4 max-w-xl text-base leading-7 text-slate-500">
              {paragraph}
            </p>
          ))}

          <div className={`mt-9 flex flex-wrap items-center gap-4 ${isCentered ? "justify-center" : ""}`}>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              style={{
                backgroundColor: theme.primaryColor,
                borderRadius: theme.buttonRadius,
                boxShadow: `0 12px 30px ${theme.primaryColor}33`,
              }}
            >
              {primaryCta}
              <ArrowRight size={18} />
            </a>
            <button
              className="inline-flex items-center gap-3 border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-800 transition hover:border-slate-400"
              style={{ borderRadius: theme.buttonRadius }}
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
            {theme.heroImage ? (
              <div
                className="overflow-hidden rounded-[2rem] shadow-[0_35px_80px_rgba(60,65,180,0.25)]"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
                  padding: "1.25rem",
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
                  backgroundImage: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
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
                      {theme.listItems.slice(0, 4).map((item) => (
                        <div key={item} className="h-3 rounded-full bg-slate-300" title={item} />
                      ))}
                    </div>
                    <div className="grid grid-rows-[.7fr_1fr] gap-4">
                      <div
                        className="rounded-xl p-4"
                        style={{ backgroundColor: `${theme.primaryColor}18` }}
                      >
                        <div
                          className="h-3 w-2/3 rounded"
                          style={{ backgroundColor: `${theme.primaryColor}55` }}
                        />
                        <div
                          className="mt-4 h-8 w-4/5 rounded-lg"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className="rounded-xl"
                          style={{ backgroundColor: `${theme.accentColor}22` }}
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
  );
}
