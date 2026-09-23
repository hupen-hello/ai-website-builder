import { SectionProps } from "./../../../types/section";
import {
  getBlocksByType,
  getTextBlockByRole,
  resolveSectionBlocks,
} from "../types/section";
import BlockRenderer from "../blocks/BlockRenderer";

export default function AboutOne({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const heading = getTextBlockByRole(resolvedBlocks, "heading");
  const paragraph = getTextBlockByRole(resolvedBlocks, "paragraph");
  const image = getBlocksByType(resolvedBlocks, "image").find(
    (block) => block.role === "background" || !block.role,
  );
  const buttonBlocks = getBlocksByType(resolvedBlocks, "button");

  return (
    <div className="flex w-full flex-col items-stretch gap-8 bg-(--lightcream-bg) py-10 md:flex-row md:items-center md:py-14">
      <div className="flex w-full flex-col gap-3 px-5 md:w-1/2 md:px-6">
        <BlockRenderer
          block={heading}
          className="text-xl font-semibold leading-tight sm:text-xl lg:text-sm"
        />
        <BlockRenderer block={paragraph} />
        {!!buttonBlocks.length && (
          <div className="mt-2 flex flex-wrap gap-2">
            {buttonBlocks.map((button) => (
              <BlockRenderer
                key={button.id}
                block={button}
                className="inline-block rounded-full bg-(--blue-bg) px-5 py-2 font-medium text-(--secondary-link-color)"
              />
            ))}
          </div>
        )}
      </div>
      <div className="relative min-h-72 w-full md:min-h-80 md:w-1/2">
        <BlockRenderer block={image} className="object-cover" />
      </div>
    </div>
  );
}
