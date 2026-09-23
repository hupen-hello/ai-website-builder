import type { SectionProps } from "../../../types/section";

type StatItem = {
  stat: string;
  label: string;
  desc: string;
};

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const getStats = (value: unknown): StatItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const stat = getString(item.stat, getString(item.value));
    const label = getString(item.label, getString(item.title));
    return stat && label
      ? [{ stat, label, desc: getString(item.desc, getString(item.description)) }]
      : [];
  });
};

type RealEstateStats1Props = SectionProps & {
  variant?: "dark" | "light";
  sectionLabel?: string;
};

export default function RealEstateStats1({
  data = {},
  variant = "dark",
  sectionLabel,
}: RealEstateStats1Props) {
  const stats = getStats(data.stats);
  const resolvedVariant =
    data.statsStyle === "light"
      ? "light"
      : data.statsStyle === "dark"
        ? "dark"
        : variant;

  if (resolvedVariant === "light") {
    return (
      <section
        data-editor-section-label={sectionLabel}
        data-editor-fields="stats"
        className="border-y border-[#141414]/10 bg-[#f8f6f1] px-5 py-12 md:px-8 md:py-16 lg:px-10"
      >
        <div
          data-box-layout-grid="grid"
          className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 md:grid-cols-4"
        >
          {stats.map((item, index) => (
            <div
              key={`${item.label}-${item.stat}`}
              className={`px-4 text-center md:px-8 ${
                index > 0 ? "border-l border-[#141414]/12" : ""
              }`}
            >
              <p className="text-3xl font-medium tracking-[-0.04em] md:text-4xl">
                {item.stat}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#141414]/55">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="real-estate-stats"
      data-editor-section-label={sectionLabel}
      data-editor-fields="stats"
      className="bg-[#141414] px-4 py-12 text-white md:px-8 md:py-16"
    >
      <div data-box-layout-grid="grid" className="mx-auto grid max-w-7xl gap-10 text-center sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {stats.map((item, index) => (
          <article
            key={`${item.label}-${index}`}
            className="relative px-4 lg:not-last:border-r lg:not-last:border-white/15"
          >
            <p className="text-4xl font-semibold leading-none tracking-tight md:text-5xl">
              {item.stat}
            </p>
            <h3 className="mt-4 text-sm font-semibold text-white/90">
              {item.label}
            </h3>
            {item.desc && (
              <p className="mx-auto mt-2 max-w-56 text-sm leading-6 text-white/50">
                {item.desc}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
