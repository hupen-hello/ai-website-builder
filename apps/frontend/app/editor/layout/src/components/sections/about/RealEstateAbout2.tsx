import { SectionProps } from "./../../../types/section";
import {
  getBlocksByType,
  getTextBlockByRole,
  resolveSectionBlocks,
} from "../types/section";
import BlockRenderer from "../blocks/BlockRenderer";

export default function RealEstateAbout2({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const imageBlocks = getBlocksByType(resolvedBlocks, "image");
  const backgroundImage = imageBlocks.find(
    (block) => block.role === "background" || !block.role,
  );
  const sideImage = imageBlocks.find((block) => block.role === "side");
  const buttonBlocks = getBlocksByType(resolvedBlocks, "button");

  return (
    <section className="w-full bg-white px-4 py-10 md:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.6fr_1fr] lg:items-end">
        {/* Left Content */}
        <div className="flex flex-col gap-4">
          <div>
            <BlockRenderer
              block={getTextBlockByRole(resolvedBlocks, "pretitle")}
              className="mb-4 text-sm font-medium uppercase tracking-widest text-gray-500"
            />

            <BlockRenderer
              block={getTextBlockByRole(resolvedBlocks, "heading")}
              className="text-5xl font-black uppercase leading-[1] tracking-light text-black sm:text-7xl lg:text-4xl"
            />
          </div>

          <div className="space-y-4">
            <BlockRenderer
              block={getTextBlockByRole(resolvedBlocks, "subheading")}
              className="text-sm font-medium text-black"
            />

            <BlockRenderer
              block={getTextBlockByRole(resolvedBlocks, "paragraph")}
              className="max-w-sm text-sm leading-relaxed text-black sm:text-base"
            />

            {buttonBlocks.length ? (
              <div className="flex flex-wrap gap-4">
                {buttonBlocks.map((button) => (
                  <BlockRenderer
                    key={button.id}
                    block={button}
                    className={`rounded-lg px-6 py-3 text-sm font-semibold transition ${
                      button.variant === "primary"
                        ? "bg-black text-white"
                        : "border border-black text-black"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Center Image */}
        <div className="relative h-[260px] overflow-hidden rounded-[28px] sm:h-[360px] lg:h-[420px]">
          <BlockRenderer block={backgroundImage} className="object-cover" />
        </div>

        {/* Right Content */}
        <div className="flex flex-col gap-8">
          <div className="relative h-[150px] overflow-hidden rounded-[28px] sm:h-[200px]">
            <BlockRenderer block={sideImage} className="object-cover" />
          </div>

          <div>
            <BlockRenderer
              block={getTextBlockByRole(resolvedBlocks, "philosophy-heading")}
              className="mb-4 text-2xl font-bold text-black sm:text-3xl lg:text-4xl"
            />

            <BlockRenderer
              block={getTextBlockByRole(resolvedBlocks, "paragraph-secondary")}
              className="text-base leading-relaxed text-black"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
