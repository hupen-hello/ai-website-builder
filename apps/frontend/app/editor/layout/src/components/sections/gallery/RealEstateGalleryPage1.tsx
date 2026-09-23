"use client";

import Image from "next/image";
import type { SectionProps } from "../../../types/section";
import RealEstateBreadCrumb1 from "../breadcrumb/RealEstateBreadCrumb1";

const getGalleryItems = (data: SectionProps["data"]) =>
  (data?.galleryItems ?? []).slice(0, 9);

export default function RealEstateGalleryPage1({ data = {} }: SectionProps) {
  const items = getGalleryItems(data);

  return (
    <main className="bg-white text-[#141414]">
      <RealEstateBreadCrumb1
        pretitle={data.pretitle ?? "Gallery"}
        title={data.title ?? "Spaces, stories, and details."}
        desc={data.desc}
      />

      <section
        data-editor-section-label="Gallery Collection"
        data-editor-fields="galleryItems"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div data-box-layout-grid="grid" className="mx-auto grid max-w-7xl auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={`${item.image}-${index}`}
              className={`group relative overflow-hidden rounded-[1.15rem] bg-[#eee9df] ${
                index === 0 || index === 5 ? "sm:row-span-2" : ""
              }`}
            >
              <Image
                src={item.image}
                alt={item.alt ?? item.title ?? ""}
                data-editor-media
                data-editor-media-type="image"
                data-editor-media-src={item.image}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 text-white">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                {item.alt && (
                  <p className="mt-1 line-clamp-2 text-sm text-white/80">
                    {item.alt}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
