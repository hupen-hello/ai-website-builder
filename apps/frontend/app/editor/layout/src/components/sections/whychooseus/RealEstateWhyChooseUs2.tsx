import Image from "next/image";
import type { ComponentType } from "react";
import { Award, BookOpen, Clock, Heart, Rocket, ShieldCheck, Star, Target, Users } from "lucide-react";
import type { SectionProps } from "../../../types/section";

const iconsByKey: Record<string, ComponentType<{ className?: string; size?: number }>> = {
  star: Star,
  heart: Heart,
  user: Users,
  shield: ShieldCheck,
  rocket: Rocket,
  target: Target,
  clock: Clock,
  award: Award,
  book: BookOpen,
};

const fallbackIcons = [Users, Rocket, Target, Clock, Award, BookOpen];

export default function RealEstateWhyChooseUs2({ data = {} }: SectionProps) {
  const items = Array.isArray(data.whyChooseUsItems) ? data.whyChooseUsItems : [];

  return (
    <section className="bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        {data.pretitle && (
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            {data.pretitle}
          </p>
        )}
        {data.title && (
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{data.title}</h2>
        )}
        {data.desc && (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{data.desc}</p>
        )}
        <div data-box-layout-grid="grid" className="mt-10 grid gap-px overflow-hidden bg-white/15 md:grid-cols-3">
          {items.map((item, index) => {
            const Icon =
              iconsByKey[item.icon || ""] ||
              fallbackIcons[index % fallbackIcons.length];
            return (
              <article key={item.title} className="bg-slate-950 p-6 sm:p-8">
                {item.image ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      unoptimized={item.image.startsWith("data:") || item.image.startsWith("http")}
                      data-editor-media
                      data-editor-media-type="image"
                      data-editor-media-src={item.image}
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <Icon className="text-cyan-300" size={32} />
                )}
                <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{item.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
