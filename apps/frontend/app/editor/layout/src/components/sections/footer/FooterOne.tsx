import Link from "next/link";
import { SectionProps } from "./../../../types/section";
import {
  getBlock,
  getBlocksByType,
  getTextBlockByRole,
  resolveSectionBlocks,
} from "../types/section";
import InlineRichText from "../../builder/InlineRichText";
import EditorRemoteImage from "../../EditorRemoteImage";
import { getSocialPlatformIcon } from "../../../lib/socialPlatforms";
import {
  LESTOW_COPYRIGHT_CREDIT,
  shouldShowLestowCopyright,
  stripLestowCopyrightCredit,
} from "@/lib/lestowBranding";

export default function FooterOne({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const logo = getBlock(resolvedBlocks, "logo");
  const blockLogoImage = getBlocksByType(resolvedBlocks, "image").find(
    (block) => block.role === "logo",
  );
  const logoImage = data.logoImage
    ? { src: data.logoImage, alt: data.logoImageTitle ?? data.logo ?? "Logo" }
    : blockLogoImage;
  const logoText = data.logo ?? logo?.text;
  const paragraph = getTextBlockByRole(resolvedBlocks, "paragraph");
  const columnBlocks = getBlocksByType(resolvedBlocks, "list").filter(
    (block) => block.role === "footer-column",
  );
  const legalBlock = getBlocksByType(resolvedBlocks, "list").find(
    (block) => block.role === "legal",
  );
  const footerBackground =
    data.footerBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${data.footerBackgroundColor ?? "#0d1f2a"}, ${
          data.footerGradientColor ?? "#1d4ed8"
        })`
      : (data.footerBackgroundColor ?? "#0d1f2a");
  const textColor = data.footerTextColor ?? "#ffffff";
  const mutedTextColor = data.footerMutedTextColor ?? "#cbd5e1";
  const socialLinks = data.footerSocialLinks ?? [];
  const columns = (data.footerColumns ?? []).filter((column) => !column.hidden);
  const contact = data.footerContact;
  const legalLinks = data.footerLegalLinks ?? [];
  const copyrightText = stripLestowCopyrightCredit(data.copyrightText);
  const showLestowCopyright = shouldShowLestowCopyright(data.removeBranding);
  // Prefer live footerColumns from editor data so show/hide + order stick.
  const useDataColumns = Array.isArray(data.footerColumns);
  const renderColumns = useDataColumns
    ? columns.map((column) => ({
        title: column.title,
        links: (column.links ?? []).filter((link) => !link.hidden),
      }))
    : columnBlocks;

  return (
    <footer style={{ background: footerBackground, color: textColor }}>
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            {logoImage ? (
              <Link href="/" className="relative block h-12 w-36">
                <EditorRemoteImage
                  src={logoImage.src}
                  alt={logoImage.alt ?? logo?.text ?? ""}
                  data-editor-media
                  data-editor-media-type="image"
                  data-editor-media-src={logoImage.src}
                  fill
                  sizes="144px"
                  className="object-contain object-left"
                />
              </Link>
            ) : logoText ? (
              <Link href="/" className="text-2xl font-bold sm:text-3xl" data-editor-inline-format-key="footer:logo">
                <InlineRichText value={logoText} formatKey="footer:logo" />
              </Link>
            ) : null}

            {paragraph?.content && (
              <p
                className="mt-5 text-sm leading-7"
                style={{ color: mutedTextColor }}
                data-editor-inline-format-key={`block:${paragraph.id}:content`}
              >
                <InlineRichText
                  value={paragraph.content}
                  formatKey={`block:${paragraph.id}:content`}
                />
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              {socialLinks.map((social) => {
                const Icon = getSocialPlatformIcon(social.label);

                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:theme-btn"
                    aria-label={social.label}
                  >
                    <Icon size={16} />
                  </Link>
                );
              })}
            </div>
          </div>

          {renderColumns.map((column, columnIndex) => (
            <div key={`${column.title}-${columnIndex}`}>
              <h3 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl" data-editor-inline-format-key={`footer:column:${columnIndex}:title`}>
                <InlineRichText
                  value={column.title ?? ""}
                  formatKey={`footer:column:${columnIndex}:title`}
                />
              </h3>

              <ul className="space-y-3" style={{ color: mutedTextColor }}>
                {("items" in column ? column.items : column.links).map(
                  (item, itemIndex) => {
                    const label = typeof item === "string" ? item : item.label;
                    const href = typeof item === "string" ? "#" : item.href;

                    return (
                      <li key={`${label}-${itemIndex}`}>
                        <Link
                          href={href}
                          className="transition hover:text-white"
                          data-editor-inline-format-key={`footer:column:${columnIndex}:item:${itemIndex}`}
                        >
                          <InlineRichText
                            value={label}
                            formatKey={`footer:column:${columnIndex}:item:${itemIndex}`}
                          />
                        </Link>
                      </li>
                    );
                  },
                )}
              </ul>
            </div>
            ))}

          {contact && (
            <div>
              <div className="space-y-4" style={{ color: mutedTextColor }}>
                {contact.location && (
                  <p data-editor-inline-format-key="footer:contact:location">
                    <InlineRichText
                      value={contact.location}
                      formatKey="footer:contact:location"
                    />
                  </p>
                )}

                {contact.email && (
                  <Link
                    href={`mailto:${contact.email}`}
                    className="block transition hover:text-white"
                    data-editor-inline-format-key="footer:contact:email"
                  >
                    <InlineRichText
                      value={contact.email}
                      formatKey="footer:contact:email"
                    />
                  </Link>
                )}

                {contact.phone && (
                  <Link
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="block transition hover:text-white"
                    data-editor-inline-format-key="footer:contact:phone"
                  >
                    <InlineRichText
                      value={contact.phone}
                      formatKey="footer:contact:phone"
                    />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div
            className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row"
            style={{ color: mutedTextColor }}
          >
            {(copyrightText || showLestowCopyright) && (
              <p>
                {copyrightText ? (
                  <span data-editor-inline-format-key="footer:copyright">
                    <InlineRichText
                      value={copyrightText}
                      formatKey="footer:copyright"
                    />
                  </span>
                ) : null}
                {showLestowCopyright ? (
                  <span data-lestow-copyright data-editor-no-inline>
                    {copyrightText ? " · " : ""}
                    {LESTOW_COPYRIGHT_CREDIT}
                  </span>
                ) : null}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-end">
              {(legalBlock?.items ?? legalLinks).map((item, itemIndex) => {
                const label = typeof item === "string" ? item : item.label;
                const href = typeof item === "string" ? "#" : item.href;

                return (
                  <Link
                    key={label}
                    href={href}
                    className="transition hover:text-white"
                    data-editor-inline-format-key={`footer:legal:${itemIndex}`}
                  >
                    <InlineRichText
                      value={label}
                      formatKey={`footer:legal:${itemIndex}`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
