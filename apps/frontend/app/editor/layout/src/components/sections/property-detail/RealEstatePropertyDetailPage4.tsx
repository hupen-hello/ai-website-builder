"use client";

import type { ElementType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  Bed,
  Car,
  Check,
  Heart,
  MapPin,
  Share2,
  Square,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import {
  propertyDetailPage4Content,
  propertyGrid4Content,
} from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  EnquiryField4,
  PropertyAmenity4,
  PropertyDetailPage4Data,
  PropertyGalleryImage4,
  PropertyGrid4Item,
  PropertyOverviewItem4,
  PropertyStat4,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  Bed,
  Bath,
  Square,
  Car,
  Waves,
  UtensilsCrossed,
  MapPin,
  Share2,
  Heart,
  Check,
};

const FALLBACK_IMAGE =
  "/categories/realestate/template4/unsplash-4723c13d.jpg";

const defaultStats: PropertyStat4[] = [
  { id: "beds", icon: "Bed", value: "{beds}", label: "Bedrooms" },
  { id: "baths", icon: "Bath", value: "{baths}", label: "Bathrooms" },
  { id: "sqft", icon: "Square", value: "{sqft}", label: "Sq Ft" },
  { id: "garage", icon: "Car", value: "2", label: "Garage" },
  { id: "pool", icon: "Waves", value: "Yes", label: "Swimming Pool" },
  { id: "kitchen", icon: "UtensilsCrossed", value: "Yes", label: "Modern Kitchen" },
];

const defaultGallery: PropertyGalleryImage4[] = [
  { id: "gallery-2", image: "/categories/realestate/template4/unsplash-52273a64.jpg" },
  { id: "gallery-3", image: "/categories/realestate/template4/unsplash-8114d857.jpg" },
];

const defaultAmenities: PropertyAmenity4[] = [
  { id: "ac", label: "Air Conditioning" },
  { id: "heating", label: "Central Heating" },
  { id: "smart", label: "Smart Home System" },
  { id: "fireplace", label: "Fireplace" },
  { id: "pool", label: "Private Pool" },
  { id: "security", label: "Home Security" },
  { id: "garden", label: "Garden" },
  { id: "laundry", label: "Laundry Room" },
  { id: "internet", label: "High Speed Internet" },
];

const defaultOverview: PropertyOverviewItem4[] = [
  { id: "id", label: "Property ID:", value: "SE12345" },
  { id: "type", label: "Property Type:", value: "Villa / House" },
  { id: "status", label: "Status:", value: "For Sale" },
  { id: "beds", label: "Bedrooms:", value: "{beds}" },
  { id: "baths", label: "Bathrooms:", value: "{baths}" },
  { id: "area", label: "Area:", value: "{sqft} Sq Ft" },
  { id: "lot", label: "Lot Size:", value: "7,500 Sq Ft" },
  { id: "year", label: "Year Built:", value: "2022" },
  { id: "garage", label: "Garage:", value: "2 Cars" },
];

const defaultFields: EnquiryField4[] = [
  { label: "Your Name", name: "name", type: "text", placeholder: "Your Name" },
  { label: "Email Address", name: "email", type: "email", placeholder: "Email Address" },
  { label: "Phone Number", name: "phone", type: "tel", placeholder: "Phone Number" },
  {
    label: "Message",
    name: "message",
    type: "textarea",
    placeholder: "I am interested in this property...",
    fullWidth: true,
  },
];

const interpolate = (
  value: string,
  tokens: { beds: string; baths: string; sqft: string },
) =>
  value
    .replaceAll("{beds}", tokens.beds)
    .replaceAll("{baths}", tokens.baths)
    .replaceAll("{sqft}", tokens.sqft);

export default function RealEstatePropertyDetailPage4({
  data = {},
}: SectionProps) {
  const authored = propertyDetailPage4Content.RealEstatePropertyDetailPage4;
  const listingProperties = propertyGrid4Content.properties ?? [];
  const content: PropertyDetailPage4Data = {
    ...authored,
    ...(data as PropertyDetailPage4Data),
  };
  const matched: PropertyGrid4Item | undefined =
    listingProperties.find((item) => item.id === content.id) ??
    listingProperties[0];
  const title = content.title ?? matched?.title ?? "Property";
  const address = content.address ?? matched?.address ?? "";
  const price = content.price ?? matched?.price ?? "";
  const beds = String(content.beds ?? matched?.beds ?? "");
  const baths = String(content.baths ?? matched?.baths ?? "");
  const sqft = String(content.sqft ?? matched?.sqft ?? "");
  const image = content.image ?? matched?.image ?? FALLBACK_IMAGE;
  const tokens = { beds, baths, sqft };
  const extraGallery = content.galleryImages?.length
    ? content.galleryImages
    : (authored.galleryImages ?? defaultGallery);
  const galleryImages = useMemo(() => {
    const extras = extraGallery
      .map((item) => (typeof item === "string" ? item : item.image))
      .filter((item): item is string => Boolean(item) && item !== image);
    return [image, ...extras];
  }, [extraGallery, image]);
  const stats = content.stats?.length
    ? content.stats
    : (authored.stats ?? defaultStats);
  const amenities = content.amenities?.length
    ? content.amenities
    : (authored.amenities ?? defaultAmenities);
  const overviewItems = content.overviewItems?.length
    ? content.overviewItems
    : (authored.overviewItems ?? defaultOverview);
  const fields = content.formFields?.length
    ? content.formFields
    : (authored.formFields ?? defaultFields);
  const [activeImage, setActiveImage] = useState(galleryImages[0] ?? image);

  useEffect(() => {
    setActiveImage(galleryImages[0] ?? image);
  }, [galleryImages, image]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  return (
    <section
      className="bg-gray-50 py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="propertyDetail"
      data-editor-fields="accentColor title address price statusLabel shareLabel saveLabel extraPhotosCount extraPhotosLabel description description2 descriptionTitle amenitiesTitle locationTitle mapImage formTitle formDescription formSubmitLabel overviewTitle helpTitle helpDescription helpPhone galleryImages stats amenities overviewItems formFields"
    >
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1
              className="mb-2 text-3xl font-bold text-secondary md:text-4xl"
              data-editor-field="title"
            >
              {title}
            </h1>
            <p className="flex items-center gap-2 text-gray-500">
              <MapPin className="h-5 w-5 text-[var(--accent)]" />
              <span data-editor-field="address">{address}</span>
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex gap-4">
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-[var(--accent)]"
              >
                <Share2 className="h-4 w-4" />
                <span data-editor-field="shareLabel">
                  {content.shareLabel ?? "Share"}
                </span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition-colors hover:text-red-500"
              >
                <Heart className="h-4 w-4" />
                <span data-editor-field="saveLabel">
                  {content.saveLabel ?? "Save"}
                </span>
              </button>
            </div>
            <div className="rounded-md bg-[var(--accent)] px-6 py-2 text-white">
              <div className="text-2xl font-bold" data-editor-field="price">
                {price}
              </div>
              <div
                className="text-center text-xs tracking-wider uppercase opacity-90"
                data-editor-field="statusLabel"
              >
                {content.statusLabel ?? "For Sale"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div className="space-y-4">
              <div className="h-[400px] overflow-hidden rounded-xl md:h-[500px]">
                <img
                  src={activeImage}
                  alt={title}
                  className="h-full w-full object-cover transition-all duration-300"
                  data-editor-media="image"
                  data-editor-media-type="image"
                />
              </div>
              <div className="grid grid-cols-4 gap-4">
                {galleryImages.map((img, idx) => (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`h-24 overflow-hidden rounded-lg transition-all md:h-32 ${
                      activeImage === img
                        ? "ring-4 ring-[var(--accent)] opacity-100"
                        : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${title} ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
                <div className="flex h-24 cursor-pointer items-center justify-center rounded-lg bg-secondary text-white transition-colors hover:bg-gray-800 md:h-32">
                  <span className="text-center text-xl font-bold">
                    <span data-editor-field="extraPhotosCount">
                      {content.extraPhotosCount ?? "+12"}
                    </span>
                    <br />
                    <span
                      className="text-sm font-normal"
                      data-editor-field="extraPhotosLabel"
                    >
                      {content.extraPhotosLabel ?? "Photos"}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-4 rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
              {stats.map((stat) => {
                const Icon = iconMap[stat.icon ?? "Square"] ?? Square;
                return (
                  <div
                    key={stat.id ?? stat.label}
                    className="flex flex-col items-center gap-2 px-2"
                  >
                    <Icon className="h-8 w-8 text-[var(--accent)]" />
                    <span
                      className="text-lg font-bold text-secondary"
                      data-editor-field="value"
                    >
                      {interpolate(stat.value, tokens)}
                    </span>
                    <span
                      className="text-xs tracking-wider text-gray-500 uppercase"
                      data-editor-field="label"
                    >
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h3
                className="mb-4 text-xl font-bold text-secondary"
                data-editor-field="descriptionTitle"
              >
                {content.descriptionTitle ?? "Property Description"}
              </h3>
              <p
                className="mb-4 text-sm leading-relaxed text-gray-600"
                data-editor-field="description"
              >
                {content.description ??
                  "This stunning modern villa offers the perfect blend of luxury, comfort, and style. Located in the heart of Beverly Hills, this beautiful home features spacious living areas, a state-of-the-art kitchen, four luxurious bedrooms, and a resort-style pool with breathtaking views."}
              </p>
              <p
                className="text-sm leading-relaxed text-gray-600"
                data-editor-field="description2"
              >
                {content.description2 ??
                  "The open-concept design, high-end finishes, and floor-to-ceiling windows create a bright and inviting atmosphere throughout the home."}
              </p>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h3
                className="mb-6 text-xl font-bold text-secondary"
                data-editor-field="amenitiesTitle"
              >
                {content.amenitiesTitle ?? "Amenities"}
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {amenities.map((amenity) => {
                  const label =
                    typeof amenity === "string" ? amenity : amenity.label;
                  return (
                    <div
                      key={typeof amenity === "string" ? amenity : amenity.id ?? label}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <Check className="h-4 w-4 text-[var(--accent)]" />
                      <span data-editor-field="label">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
              <h3
                className="mb-6 text-xl font-bold text-secondary"
                data-editor-field="locationTitle"
              >
                {content.locationTitle ?? "Location"}
              </h3>
              <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-200">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-30"
                  style={{
                    backgroundImage: `url('${content.mapImage ?? "/categories/realestate/template4/unsplash-4723c13d.jpg"}')`,
                  }}
                  data-editor-media="mapImage"
                  data-editor-media-type="image"
                />
                <MapPin className="relative z-10 h-12 w-12 animate-bounce text-[var(--accent)]" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-xl border-t-4 border-[var(--accent)] bg-white p-6 shadow-lg">
              <h3
                className="mb-2 text-xl font-bold text-secondary"
                data-editor-field="formTitle"
              >
                {content.formTitle ?? "Request a Callback"}
              </h3>
              <p
                className="mb-6 text-sm text-gray-500"
                data-editor-field="formDescription"
              >
                {content.formDescription ??
                  "Interested in this property? Fill out the form and our agent will contact you shortly."}
              </p>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {fields.map((field) =>
                  field.type === "textarea" ? (
                    <textarea
                      key={field.name ?? field.label}
                      className="min-h-[100px] w-full rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      key={field.name ?? field.label}
                      type={
                        field.type === "email"
                          ? "email"
                          : field.type === "tel"
                            ? "tel"
                            : "text"
                      }
                      placeholder={field.placeholder ?? field.label}
                      className="h-11 w-full rounded-md border border-gray-200 bg-transparent px-3 text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--accent)] focus:outline-none"
                    />
                  ),
                )}
                <button
                  type="submit"
                  className="h-12 w-full rounded-md bg-[var(--accent)] text-sm font-bold tracking-wider text-white uppercase transition-colors hover:opacity-90"
                  data-editor-field="formSubmitLabel"
                >
                  {content.formSubmitLabel ?? "Request Callback"}
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3
                className="mb-6 text-xl font-bold text-secondary"
                data-editor-field="overviewTitle"
              >
                {content.overviewTitle ?? "Property Overview"}
              </h3>
              <ul className="space-y-4 text-sm">
                {overviewItems.map((item, index) => (
                  <li
                    key={item.id ?? `${item.label}-${index}`}
                    className={`flex justify-between pb-2 ${
                      index === overviewItems.length - 1
                        ? ""
                        : "border-b border-gray-100"
                    }`}
                  >
                    <span className="text-gray-500" data-editor-field="label">
                      {item.label}
                    </span>
                    <span
                      className="font-semibold text-secondary"
                      data-editor-field="value"
                    >
                      {interpolate(item.value, tokens)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-teal-100 bg-teal-50 p-6 text-center">
              <h3
                className="mb-2 text-lg font-bold text-secondary"
                data-editor-field="helpTitle"
              >
                {content.helpTitle ?? "Need Help?"}
              </h3>
              <p
                className="mb-4 text-sm text-gray-500"
                data-editor-field="helpDescription"
              >
                {content.helpDescription ??
                  "Our expert agents are here to help you."}
              </p>
              <div
                className="text-2xl font-bold text-[var(--accent)]"
                data-editor-field="helpPhone"
              >
                {content.helpPhone ?? "555-555-5555"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
