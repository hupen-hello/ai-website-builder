import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SectionProps } from "./../../../types/section";
import {
  getBlocksByType,
  getTextBlockByRole,
  resolveSectionBlocks,
} from "../types/section";
import BlockRenderer from "../blocks/BlockRenderer";
import { publishedHrefFromData } from "../../../lib/sectionScroll";

type RealEstateAbout1Props = SectionProps & {
  pageMode?: boolean;
  promises?: string[];
};

const bypassImageOptimization = (src: string) =>
  src.startsWith("data:") || /^https?:\/\//i.test(src);

export default function RealEstateAbout1({
  data = {},
  blocks,
  pageMode = false,
  promises = [],
}: RealEstateAbout1Props) {
  if (pageMode) {
    const storyImage = data.sideImage ?? data.backgroundImage;
    const primaryButton = data.buttons?.[0] ?? {
      label: "Meet our advisors",
      href: "/contact",
    };

    return (
      <section
        data-editor-section-label="About Story"
        data-editor-fields="subtitle title desc1 desc2 promises buttons sideImage sideImageTitle"
        className="px-5 py-14 md:px-8 md:py-20 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {storyImage && (
            <div className="relative min-h-[390px] overflow-hidden rounded-[1.5rem] bg-[#eee9df] md:min-h-[520px]">
              <Image
                src={storyImage}
                alt={data.sideImageTitle ?? "Luxury residence interior"}
                fill
                unoptimized={bypassImageOptimization(storyImage)}
                data-editor-media
                data-editor-media-type="image"
                data-editor-media-src={storyImage}
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[color:var(--primary-bg)]">
              {data.subtitle ?? "Who we are"}
            </p>
            <h2 className="mt-4 text-3xl font-medium leading-tight tracking-[-0.035em] md:text-5xl">
              {data.title ??
                data.philosophyTitle ??
                "Clear advice. Better property decisions."}
            </h2>
            <p className="mt-6 text-base leading-7 text-[#141414]/65">
              {data.desc1 ??
                data.desc2 ??
                "We combine market knowledge, careful verification, and responsive support to make every step easier."}
            </p>
            <p className="mt-4 text-base leading-7 text-[#141414]/65">
              {(typeof data.desc1 === "string"
                ? data.desc2
                : data.philosophyDesc) ??
                data.philosophyDesc ??
                "Our promise is simple: real options, clear numbers, and reliable local support."}
            </p>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {promises.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm font-medium text-[#141414]/80"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-[color:var(--primary-bg)]"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href={publishedHrefFromData(primaryButton.href, data)}
              className="theme-btn mt-9 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition hover:opacity-90"
            >
              {primaryButton.label} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const heading = getTextBlockByRole(resolvedBlocks, "heading");
  const paragraph = getTextBlockByRole(resolvedBlocks, "paragraph");
  const image = getBlocksByType(resolvedBlocks, "image").find(
    (block) => block.role === "background" || !block.role,
  );
  const buttonBlocks = getBlocksByType(resolvedBlocks, "button");

  return (
    <div className="flex w-full flex-col items-stretch gap-8 bg-[#fbfaf6] py-10 md:flex-row md:items-center md:py-14">
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
                className="inline-block rounded-full bg-[#0668ff] px-5 py-2 font-medium text-white"
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
