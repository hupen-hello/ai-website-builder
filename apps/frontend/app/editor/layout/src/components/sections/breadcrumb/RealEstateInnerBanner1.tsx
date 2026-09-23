import type { SectionProps } from "../../../types/section";
import RealEstateBreadCrumb1 from "./RealEstateBreadCrumb1";

const text = (value: unknown, fallback: string) =>
  typeof value === "string" && value.trim() ? value : fallback;

export default function RealEstateInnerBanner1({
  data = {},
}: SectionProps) {
  return (
    <main className="bg-white text-[#141414]">
      <RealEstateBreadCrumb1
        pretitle={text(data.pretitle, "Explore")}
        title={text(data.title, "Discover more")}
        desc={
          data.desc || data.desc2 ? (
            <>
              {typeof data.desc === "string" && data.desc.trim() ? (
                <p>{data.desc}</p>
              ) : null}
              {typeof data.desc2 === "string" && data.desc2.trim() ? (
                <p className="mt-3 text-sm md:text-base">{data.desc2}</p>
              ) : null}
            </>
          ) : undefined
        }
      />
    </main>
  );
}
