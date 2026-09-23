import Image from "next/image";
import type { ComponentType } from "react";
import { LuCircleUser, LuHeart, LuShieldCheck, LuStar } from "react-icons/lu";
import type { SectionProps } from "../../../types/section";

const whyChooseIcons: Record<
  string,
  ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  star: LuStar,
  heart: LuHeart,
  user: LuCircleUser,
  shield: LuShieldCheck,
};

const FALLBACK_ICONS = [LuStar, LuHeart, LuCircleUser, LuShieldCheck];

export default function RealEstateWhyChooseUs1({
  data = {},
}: SectionProps) {
  const items = Array.isArray(data.whyChooseUsItems) ? data.whyChooseUsItems : [];

  if (!data.title && !items.length) return null;

  return (
    <section className="bg-white px-4 py-7 md:px-8 md:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl text-center">
        {data.pretitle && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#c44536] md:text-xs">
            {data.pretitle}
          </p>
        )}
        {data.title && (
          <h2 className="mx-auto mt-4 max-w-3xl text-[2rem] font-semibold leading-tight text-[#141414] md:text-[2.5rem] lg:text-[2.75rem]">
            {data.title}
          </h2>
        )}
        {data.desc && (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#141414]/65 md:text-base">
            {data.desc}
          </p>
        )}
      </div>

      {!!items.length && (
        <div className="mx-auto mt-8 max-w-7xl rounded-[1.25rem] bg-[#f3efe8] md:mt-10 md:rounded-3xl">
          <div data-box-layout-grid="grid" className="grid sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => {
              const Icon =
                whyChooseIcons[item.icon || ""] ||
                FALLBACK_ICONS[index % FALLBACK_ICONS.length];

              return (
                <article
                  key={`${item.stat}-${item.title}-${index}`}
                  className="group cursor-default px-5 py-5 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white hover:shadow-lg md:px-6 md:py-6 lg:px-7 lg:py-7"
                >
                  <div className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#c44536] text-white transition-transform duration-300 ease-out group-hover:scale-110 md:h-12 md:w-12">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        unoptimized={item.image.startsWith("data:") || item.image.startsWith("http")}
                        data-editor-media
                        data-editor-media-type="image"
                        data-editor-media-src={item.image}
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <Icon
                        className="h-5 w-5 md:h-6 md:w-6"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    )}
                  </div>
                  {item.stat && (
                    <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-[#c44536]">
                      {item.stat}
                    </p>
                  )}
                  <h3 className="mt-3 text-lg font-semibold text-[#141414]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#141414]/65">
                    {item.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
