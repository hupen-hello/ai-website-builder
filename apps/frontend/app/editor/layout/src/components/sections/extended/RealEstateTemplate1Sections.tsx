import Image from "next/image";
import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { resolvePublishedPageHref } from "../../../lib/sectionScroll";

type CardItem = {
  title: string;
  desc: string;
  image?: string;
  alt: string;
  label?: string;
  href: string;
};

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const getRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const getCards = (
  value: unknown,
  defaultHref: string,
  siteBase?: string,
  detailBase?: string,
): CardItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    const card = getRecord(item);
    if (!card) return [];

    const title = getString(card.title, getString(card.name));
    if (!title) return [];

    const slug = getString(card.slug);
    const rawHref = getString(card.href, defaultHref);

    return [
      {
        title,
        desc: getString(card.desc, getString(card.description)),
        image: getString(card.image) || undefined,
        alt: getString(card.alt, title),
        label: getString(
          card.location,
          getString(
            card.yieldLabel,
            getString(card.projectsLabel, getString(card.category)),
          ),
        ),
        href: resolvePublishedPageHref(rawHref, siteBase, {
          slug: slug || undefined,
          detailBase,
        }),
      },
    ];
  });
};

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") ||
  src.startsWith("http://") ||
  src.startsWith("https://");

function SectionHeading({
  pretitle,
  title,
  desc,
  inverted = false,
}: {
  pretitle: string;
  title: string;
  desc: string;
  inverted?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {pretitle && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c44536]">
          {pretitle}
        </p>
      )}
      {title && (
        <h2
          className={`mt-3 text-3xl font-semibold leading-tight md:text-5xl ${
            inverted ? "text-white" : "text-[#141414]"
          }`}
        >
          {title}
        </h2>
      )}
      {desc && (
        <p
          className={`mt-4 text-sm leading-relaxed md:text-base ${
            inverted ? "text-white/65" : "text-[#141414]/65"
          }`}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

function CardCollection({
  data,
  source,
  defaultHref,
  background = "bg-white",
}: SectionProps & {
  source: unknown;
  defaultHref: string;
  background?: string;
}) {
  const siteBase =
    typeof data?.publishedSiteBase === "string" ? data.publishedSiteBase : "";
  const detailBase =
    typeof data?.portfolioDetailBase === "string"
      ? data.portfolioDetailBase
      : typeof data?.propertyDetailBase === "string"
        ? data.propertyDetailBase
        : "";
  const cards = getCards(
    source,
    defaultHref,
    siteBase || undefined,
    detailBase || undefined,
  );
  const button = getRecord(data?.button);

  if (!cards.length) return null;

  return (
    <section className={`${background} px-4 py-14 md:px-8 md:py-20`}>
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          pretitle={getString(data?.pretitle)}
          title={getString(data?.title, getString(data?.sectionTitle))}
          desc={getString(data?.desc, getString(data?.description))}
        />

      <div data-box-layout-grid="grid" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.slice(0, 6).map((card, index) => (
            <Link
              key={`${card.title}-${index}`}
              href={card.href}
              className="group overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:-translate-y-1 hover:shadow-xl"
            >
              {card.image && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={bypassImageOptimization(card.image)}
                    data-editor-media
                    data-editor-media-type="image"
                    data-editor-media-src={card.image}
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="p-5">
                {card.label && (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c44536]">
                    {card.label}
                  </p>
                )}
                <h3 className="mt-2 text-xl font-semibold text-[#141414]">
                  {card.title}
                </h3>
                {card.desc && (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#141414]/65">
                    {card.desc}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {button &&
          typeof button.label === "string" &&
          typeof button.href === "string" && (
            <div className="mt-10 text-center">
              <Link
                href={resolvePublishedPageHref(button.href, siteBase || undefined)}
                className="inline-flex rounded-full bg-[#141414] px-6 py-3 text-sm font-semibold text-white"
              >
                {button.label}
              </Link>
            </div>
          )}
      </div>
    </section>
  );
}

export function RealEstateProperties1({ data = {} }: SectionProps) {
  return (
    <CardCollection
      data={data}
      source={data.listings}
      defaultHref="/properties"
      background="bg-white"
    />
  );
}

export function RealEstateCitiesWeServe1({ data = {} }: SectionProps) {
  return (
    <CardCollection
      data={data}
      source={data.cities}
      defaultHref="/properties"
      background="bg-[#faf8f4]"
    />
  );
}

export function RealEstateInvestmentOpportunities1({
  data = {},
}: SectionProps) {
  return (
    <CardCollection
      data={data}
      source={data.items}
      defaultHref="/contact"
      background="bg-white"
    />
  );
}

export function RealEstateFeaturedDevelopers1({
  data = {},
}: SectionProps) {
  return (
    <CardCollection
      data={data}
      source={data.items}
      defaultHref="/projects"
      background="bg-[#faf8f4]"
    />
  );
}

export function RealEstatePropertyProcess1({ data = {} }: SectionProps) {
  const steps = Array.isArray(data.steps)
    ? data.steps.flatMap((value) => {
        const step = getRecord(value);
        return step ? [step] : [];
      })
    : [];

  if (!steps.length) return null;

  return (
    <section className="bg-[#141414] px-4 py-16 text-white md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          pretitle={getString(data.pretitle)}
          title={getString(data.title)}
          desc={getString(data.desc)}
          inverted
        />
      <div data-box-layout-grid="grid" className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article
              key={`${getString(step.title)}-${index}`}
              className="rounded-2xl border border-white/15 bg-white/5 p-6"
            >
              <span className="text-sm font-semibold text-[#f09b8e]">
                {getString(step.step, String(index + 1).padStart(2, "0"))}
              </span>
              <h3 className="mt-6 text-xl font-semibold">
                {getString(step.title)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                {getString(step.desc)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RealEstateCompanyStatistics1({ data = {} }: SectionProps) {
  const stats = Array.isArray(data.stats)
    ? data.stats.flatMap((value) => {
        const stat = getRecord(value);
        return stat ? [stat] : [];
      })
    : [];

  if (!stats.length) return null;

  return (
    <section className="bg-[#c44536] px-4 py-12 text-white md:px-8">
      <div data-box-layout-grid="grid" className="mx-auto grid max-w-7xl gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item, index) => (
          <article key={`${getString(item.label)}-${index}`}>
            <p className="text-4xl font-semibold md:text-5xl">
              {getString(item.stat)}
            </p>
            <h3 className="mt-3 text-sm font-semibold uppercase tracking-wider">
              {getString(item.label)}
            </h3>
            <p className="mt-2 text-xs leading-5 text-white/75">
              {getString(item.desc)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
