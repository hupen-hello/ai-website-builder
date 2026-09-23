import Image from "next/image";

export type RealEstateImpactStat = {
  stat: string;
  label: string;
};

type RealEstateCSRImpact1Props = {
  image?: string;
  imageAlt: string;
  stats: RealEstateImpactStat[];
};

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") || /^https?:\/\//i.test(src);

export default function RealEstateCSRImpact1({
  image,
  imageAlt,
  stats,
}: RealEstateCSRImpact1Props) {
  return (
    <section
      data-editor-section-label="Community Impact"
      data-editor-fields="sideImage sideImageTitle impactStats"
      className="px-5 pt-14 md:px-8 md:pt-20 lg:px-10"
    >
      <div
        className={`mx-auto grid max-w-7xl overflow-hidden rounded-[1.75rem] bg-[#14251f] shadow-[0_24px_70px_rgba(20,37,31,0.14)] ${
          image && stats.length
            ? "lg:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.75fr)]"
            : "grid-cols-1"
        }`}
      >
        {image && (
          <div className="relative min-h-[320px] overflow-hidden bg-[#e9ddd3] md:min-h-[460px] lg:min-h-[540px]">
            <Image
              src={image}
              alt={imageAlt}
              fill
              priority
              unoptimized={bypassImageOptimization(image)}
              data-editor-media
              data-editor-media-type="image"
              data-editor-media-src={image}
              className="object-cover transition duration-700 hover:scale-[1.02]"
              sizes="(max-width: 1024px) 100vw, 65vw"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#14251f]/25 via-transparent to-transparent" />
          </div>
        )}

        {!!stats.length && (
          <div
            data-box-layout-grid="grid"
            className="grid grid-cols-2 gap-3 p-4 text-white sm:p-6 lg:grid-cols-1 lg:p-7"
          >
            {stats.map((item, index) => (
              <div
                key={`${item.stat}-${item.label}`}
                className="group relative flex min-h-32 flex-col justify-end overflow-hidden rounded-[1.15rem] border border-white/10 bg-white/[0.06] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.1] lg:min-h-0"
              >
                <span className="absolute right-4 top-3 text-[10px] font-semibold tracking-[0.18em] text-white/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="text-3xl font-medium tracking-[-0.04em] text-[#e9ad91] md:text-4xl">
                  {item.stat}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase leading-5 tracking-[0.14em] text-white/55">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
