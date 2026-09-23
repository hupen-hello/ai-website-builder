import RealEstateImageCard1 from "./RealEstateImageCard1";

export type RealEstateEditorialCardData = {
  title: string;
  description: string;
  image: string;
  alt?: string;
  eyebrow?: string;
};

type RealEstateEditorialCards1Props = {
  pretitle: string;
  title: string;
  items: RealEstateEditorialCardData[];
  sectionLabel: string;
  editorFields?: string[];
};

export default function RealEstateEditorialCards1({
  pretitle,
  title,
  items,
  sectionLabel,
  editorFields,
}: RealEstateEditorialCards1Props) {
  return (
    <section
      data-editor-section-label={sectionLabel}
      data-editor-fields={editorFields?.join(" ")}
      className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a4472f]">
            {pretitle}
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.03em] md:text-4xl">
            {title}
          </h2>
        </div>

        <div
          data-box-layout-grid="grid"
          className="mt-10 grid gap-6 md:grid-cols-3"
        >
          {items.map((item) => (
            <RealEstateImageCard1
              key={item.title}
              image={item.image}
              alt={item.alt ?? item.title}
            >
              {item.eyebrow && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a4472f]">
                  {item.eyebrow}
                </p>
              )}
              <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#141414]/60">
                {item.description}
              </p>
            </RealEstateImageCard1>
          ))}
        </div>
      </div>
    </section>
  );
}
