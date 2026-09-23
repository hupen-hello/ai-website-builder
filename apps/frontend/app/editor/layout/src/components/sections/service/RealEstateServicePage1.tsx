"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import type { ProductSlideData, SectionProps } from "../../../types/section";
import { handleManagerCardClick } from "../../../lib/editorManagerCards";
import RealEstateBreadCrumb1 from "../breadcrumb/RealEstateBreadCrumb1";
import RealEstateCTA1 from "../types/RealEstateCTA1";

const fallbackServices: ProductSlideData[] = [
  {
    image:
      "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=85",
    alt: "Property advisor meeting clients",
    productTitle: "Property buying assistance",
    productSubtitle: "Buy",
    productInfoTitle: "Property buying assistance",
    productInfoDesc:
      "Shortlist verified homes, compare locations, arrange site visits, and review the details before you commit.",
    productFeatures: [
      { label: "Verified listings", price: "01" },
      { label: "Guided visits", price: "02" },
      { label: "Price guidance", price: "03" },
    ],
    productTotalPrice: "Advisory",
    productShippingText: "Available",
  },
  {
    image:
      "https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=1200&q=85",
    alt: "Modern rental apartment building",
    productTitle: "Rental support",
    productSubtitle: "Rent",
    productInfoTitle: "Rental support",
    productInfoDesc:
      "Find move-in-ready rentals with transparent monthly pricing, suitable locations, and practical lease support.",
    productFeatures: [
      { label: "Tenant matching", price: "01" },
      { label: "Lease support", price: "02" },
      { label: "Move-in help", price: "03" },
    ],
    productTotalPrice: "Rental",
    productShippingText: "Available",
  },
  {
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=85",
    alt: "Contemporary commercial property",
    productTitle: "Investment advisory",
    productSubtitle: "Invest",
    productInfoTitle: "Investment advisory",
    productInfoDesc:
      "Compare emerging corridors, project credentials, rental demand, and long-term potential with local context.",
    productFeatures: [
      { label: "Market research", price: "01" },
      { label: "Project comparison", price: "02" },
      { label: "Return outlook", price: "03" },
    ],
    productTotalPrice: "Investment",
    productShippingText: "Available",
  },
  {
    image:
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=85",
    alt: "Real estate documentation and keys",
    productTitle: "Documentation support",
    productSubtitle: "Support",
    productInfoTitle: "Documentation support",
    productInfoDesc:
      "Move forward confidently with coordinated paperwork, due-diligence guidance, and transaction assistance.",
    productFeatures: [
      { label: "Document checks", price: "01" },
      { label: "Loan coordination", price: "02" },
      { label: "Closing support", price: "03" },
    ],
    productTotalPrice: "Support",
    productShippingText: "Available",
  },
];

const isRemoteImage = (src: string) => /^https?:\/\//i.test(src);

export default function RealEstateServicePage1({ data = {}, editorMode = false }: SectionProps) {
  const slidesFromItems = Array.isArray(data.productItems)
    ? data.productItems.flatMap((item) => {
        if (!item || typeof item !== "object" || item.active === false) return [];
        const title = item.title || "";
        if (!title) return [];
        return [
          {
            image: item.image || "/bg1.jpg",
            alt: item.alt || title,
            productTitle: title,
            productSubtitle: item.category || "Service",
            productInfoTitle: title,
            productInfoDesc: item.desc || "",
            productFeatures: [],
            productTotalPrice: "",
            productShippingText: "",
          } satisfies ProductSlideData,
        ];
      })
    : [];
  const services = data.productSlides?.length
    ? data.productSlides
    : data.serviceSlides?.length
      ? data.serviceSlides
      : slidesFromItems.length
        ? slidesFromItems
        : fallbackServices;
  const sideImage =
    data.sideImage ??
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=85";

  return (
    <main className="bg-white text-[#141414]">
      <RealEstateBreadCrumb1
        pretitle={data.pretitle ?? "Property services"}
        title={data.title ?? "Expert help for every property decision."}
        desc={data.desc ?? "From your first shortlist to the final paperwork, our local advisors make buying, renting, and investing simpler across Delhi NCR."}
      />


      <section
        data-editor-section-label="Service Listings"
        data-editor-fields="subtitle productSectionTitle productSlides"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--primary-bg)]">
              {data.subtitle ?? "How we can help"}
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] md:text-4xl">
              {data.productSectionTitle ?? "Property support, all in one place"}
            </h2>
          </div>

          <div
            data-box-layout-grid="grid"
            data-editor-no-inline
            className="mt-10 grid gap-6 md:grid-cols-2"
          >
            {services.map((service, index) => (
              <article
                key={`${service.productTitle}-${index}`}
                className="grid overflow-hidden rounded-[1.35rem] border border-[#141414]/10 bg-white sm:grid-cols-[0.9fr_1.1fr]"
                onClick={(event) => {
                  const anyService = service as Record<string, unknown>;
                  handleManagerCardClick(event, editorMode, "Services", {
                    slug:
                      typeof anyService.slug === "string" ? anyService.slug : undefined,
                    id: typeof anyService.id === "string" ? anyService.id : undefined,
                    title: service.productTitle,
                  });
                }}
              >
                <div className="relative min-h-56 bg-[#ece8df] sm:min-h-full">
                  <Image
                    src={service.image}
                    alt={service.alt ?? service.productTitle}
                    fill
                    unoptimized={isRemoteImage(service.image)}
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                    data-editor-media
                    data-editor-media-type="image"
                    data-editor-media-src={service.image}
                  />
                </div>
                <div className="p-6 md:p-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--primary-bg)]">
                    {service.productSubtitle ?? `Service ${index + 1}`}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
                    {service.productTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#141414]/60">
                    {service.productInfoDesc}
                  </p>
                  {!!service.productFeatures?.length && (
                    <ul className="mt-5 space-y-2">
                      {service.productFeatures.map((feature) => (
                        <li
                          key={`${feature.label}-${feature.price}`}
                          className="flex items-center gap-2 text-xs font-medium text-[#141414]/75"
                        >
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary-bg)_14%,white)] text-[color:var(--primary-bg)]">
                            <Check size={12} strokeWidth={2.5} />
                          </span>
                          {feature.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>


    </main>
  );
}
