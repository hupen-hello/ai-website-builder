"use client";

import { Blocks, ChartNoAxesCombined, UsersRound } from "lucide-react";
import { useBuiltSiteSections, useBuiltSiteTheme } from "./BuiltSiteProvider";
import AiSectionHtml from "./AiSectionHtml";

const defaultFeatures = [
  {
    icon: UsersRound,
    title: "Bring teams together",
    description: "Keep every conversation, decision, and update in one shared space.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Blocks,
    title: "Connect every workflow",
    description: "Plan projects and automate the busywork with tools that fit your team.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: ChartNoAxesCombined,
    title: "See the full picture",
    description: "Turn live work into clear insights that help everyone make better calls.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

const icons = [UsersRound, Blocks, ChartNoAxesCombined];

export default function Features() {
  const theme = useBuiltSiteTheme();
  const sections = useBuiltSiteSections();
  const primaryColor = theme?.primaryColor || "#2563eb";
  const accentColor = theme?.accentColor || "#7c3aed";

  const demo = theme?.features.length ? (
      <section id="features" className="px-6 py-20 sm:py-28 lg:px-10" style={{ fontFamily: theme.fontFamily }}>
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p
              className="text-sm font-bold uppercase tracking-[0.18em]"
              style={{ color: primaryColor }}
            >
              From {theme.referenceSiteName}
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              {theme.sectionsTitle}
            </h2>
            {theme.paragraphs[2] && (
              <p className="mt-4 text-lg leading-8 text-slate-600">{theme.paragraphs[2]}</p>
            )}
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {theme.features.slice(0, 6).map(({ title, description }, index) => {
              const Icon = icons[index % icons.length];
              return (
                <article
                  key={`${title}-${index}`}
                  className="rounded-3xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      backgroundColor: index % 2 ? `${accentColor}18` : `${primaryColor}18`,
                      color: index % 2 ? accentColor : primaryColor,
                    }}
                  >
                    <Icon size={23} />
                  </div>
                  <h3 className="mt-7 text-xl font-bold">{title}</h3>
                  <p className="mt-3 leading-7 text-slate-600">{description}</p>
                </article>
              );
            })}
          </div>

          {theme.headings.length > 3 && (
            <div className="mt-16 rounded-[28px] border border-slate-200 bg-slate-50 p-8">
              <h3 className="text-2xl font-bold text-[#08132f]">More from your existing homepage</h3>
              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {theme.headings.slice(3, 9).map((heading) => (
                  <li key={heading} className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
                    {heading}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
  ) : (
    <section id="features" className="px-6 py-20 sm:py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            One connected system
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
            Great work happens when everything clicks.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {defaultFeatures.map(({ icon: Icon, title, description, color }) => (
            <article
              key={title}
              className="rounded-3xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}>
                <Icon size={23} />
              </div>
              <h3 className="mt-7 text-xl font-bold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );

  return <AiSectionHtml html={sections?.features} fallback={demo} />;
}
