import { Blocks, ChartNoAxesCombined, UsersRound } from "lucide-react";
import type { BuiltSiteTheme } from "@/lib/built-site-theme";

const icons = [UsersRound, Blocks, ChartNoAxesCombined];

export default function BuiltFeatures({ theme }: { theme: BuiltSiteTheme }) {
  const features = theme.features.slice(0, 6);

  return (
    <section id="features" className="px-6 py-20 sm:py-28 lg:px-10" style={{ fontFamily: theme.fontFamily }}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p
            className="text-sm font-bold uppercase tracking-[0.18em]"
            style={{ color: theme.primaryColor }}
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
          {features.map(({ title, description }, index) => {
            const Icon = icons[index % icons.length];
            return (
              <article
                key={`${title}-${index}`}
                className="rounded-3xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: index % 2 ? `${theme.accentColor}18` : `${theme.primaryColor}18`,
                    color: index % 2 ? theme.accentColor : theme.primaryColor,
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
  );
}
