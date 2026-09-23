import type { ComponentType } from "react";
import {
  ArrowUpDown,
  Baby,
  Building2,
  Car,
  Dumbbell,
  ParkingCircle,
  ShieldCheck,
  Trees,
  WashingMachine,
  Waves,
  Wifi,
  Zap,
} from "lucide-react";

const amenityIcons: ComponentType<{ size?: number; className?: string }>[] = [
  Waves,
  Dumbbell,
  ParkingCircle,
  ShieldCheck,
  Zap,
  Wifi,
  Baby,
  Trees,
  Building2,
  ArrowUpDown,
  WashingMachine,
  Car,
];

type RealEstateAmenities1Props = {
  pretitle: string;
  title: string;
  description: string;
  items: string[];
};

export default function RealEstateAmenities1({
  pretitle,
  title,
  description,
  items,
}: RealEstateAmenities1Props) {
  return (
    <section
      data-editor-section-label="Property Amenities"
      data-editor-fields="amenitiesPretitle amenitiesTitle amenitiesDesc amenities"
      className="bg-[#faf8f4] px-5 py-16 md:px-8 md:py-20 lg:px-10"
    >
      <div className="mx-auto max-w-[112rem]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c44536]">
            {pretitle}
          </p>
          <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] md:text-5xl">
            {title}
          </h2>
          <p className="mt-5 text-lg text-[#141414]/60 md:text-xl">
            {description}
          </p>
        </div>

        <div
          data-box-layout-grid="grid"
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((amenity, index) => {
            const Icon = amenityIcons[index % amenityIcons.length];
            return (
              <article
                key={`${amenity}-${index}`}
                className="flex min-h-40 flex-col items-center justify-center rounded-[1.35rem] border border-[#141414]/10 bg-white p-6 text-center"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-[#c44536]/10 text-[#c44536]">
                  <Icon size={21} />
                </span>
                <h3 className="mt-5 text-lg font-medium">{amenity}</h3>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
