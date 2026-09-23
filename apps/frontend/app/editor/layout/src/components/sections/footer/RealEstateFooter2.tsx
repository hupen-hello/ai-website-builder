import Link from "next/link";
import type { ElementType } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
} from "react-icons/fa";
import { SectionProps } from "./../../../types/section";
import {
  getBlock,
  getBlocksByType,
  getTextBlockByRole,
  resolveSectionBlocks,
} from "../types/section";
import EditorRemoteImage from "../../EditorRemoteImage";
import {
  THEME_HERO_BG,
  THEME_PRIMARY_TEXT,
  resolveThemeColor,
} from "../../../lib/themeTokens";
import {
  LESTOW_COPYRIGHT_CREDIT,
  shouldShowLestowCopyright,
  stripLestowCopyrightCredit,
} from "@/lib/lestowBranding";

const socialIcons: Record<string, ElementType> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  twitter: FaTwitter,
  linkedin: FaLinkedinIn,
};

export default function RealEstateFooter2({ data = {}, blocks }: SectionProps) {
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
  const footerSolidColor = resolveThemeColor(
    data.footerBackgroundColor,
    THEME_HERO_BG,
  );
  const footerBackground =
    data.footerBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${footerSolidColor}, ${
          data.footerGradientColor ?? "#1d4ed8"
        })`
      : footerSolidColor;
  const textColor = resolveThemeColor(
    data.footerTextColor,
    THEME_PRIMARY_TEXT,
  );
  const mutedTextColor = data.footerMutedTextColor ?? "#cbd5e1";
  const socialLinks = data.footerSocialLinks ?? [];
  const columns = data.footerColumns ?? [];
  const contact = data.footerContact;
  const legalLinks = data.footerLegalLinks ?? [];
  const copyrightText = stripLestowCopyrightCredit(data.copyrightText);
  const showLestowCopyright = shouldShowLestowCopyright(data.removeBranding);

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
              <Link
                href="/"
                className="text-2xl font-bold sm:text-3xl"
                data-editor-inline-format-key="footer:logo"
              >
                {logoText}
              </Link>
            ) : null}

            {paragraph?.content && (
              <p
                className="mt-5 text-sm leading-7"
                style={{ color: mutedTextColor }}
              >
                {paragraph.content}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              {socialLinks.map((social) => {
                const Icon = socialIcons[social.label];

                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-blue-600"
                    aria-label={social.label}
                  >
                    <Icon size={16} />
                  </Link>
                );
              })}
            </div>
          </div>

          {(columnBlocks.length ? columnBlocks : columns).map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-lg font-semibold sm:mb-6 sm:text-xl">
                {column.title}
              </h3>

              <ul className="space-y-3" style={{ color: mutedTextColor }}>
                {("items" in column ? column.items : column.links).map(
                  (item) => {
                    const label = typeof item === "string" ? item : item.label;
                    const href = typeof item === "string" ? "#" : item.href;

                    return (
                      <li key={label}>
                        <Link
                          href={href}
                          className="transition hover:text-white"
                        >
                          {label}
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
                {contact.location && <p>{contact.location}</p>}

                {contact.email && (
                  <Link
                    href={`mailto:${contact.email}`}
                    className="block transition hover:text-white"
                  >
                    {contact.email}
                  </Link>
                )}

                {contact.phone && (
                  <Link
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="block transition hover:text-white"
                  >
                    {contact.phone}
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
                {copyrightText ? <span>{copyrightText}</span> : null}
                {showLestowCopyright ? (
                  <span data-lestow-copyright data-editor-no-inline>
                    {copyrightText ? " · " : ""}
                    {LESTOW_COPYRIGHT_CREDIT}
                  </span>
                ) : null}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-end">
              {(legalBlock?.items ?? legalLinks).map((item) => {
                const label = typeof item === "string" ? item : item.label;
                const href = typeof item === "string" ? "#" : item.href;

                return (
                  <Link
                    key={label}
                    href={href}
                    className="transition hover:text-white"
                  >
                    {label}
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
