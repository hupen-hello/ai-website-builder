import Link from "next/link";
import type { ElementType } from "react";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
} from "react-icons/fa";
import { SectionProps, SocialLinkData } from "./../../../types/section";
import {
  getBlocksByType,
  getTextBlockByRole,
  resolveSectionBlocks,
} from "../types/section";
import BlockRenderer from "../blocks/BlockRenderer";
import {
  THEME_PRIMARY_BG,
  THEME_PRIMARY_TEXT,
  resolveThemeColor,
} from "../../../lib/themeTokens";

const socialIcons: Record<string, ElementType> = {
  facebook: FaFacebookF,
  instagram: FaInstagram,
  twitter: FaTwitter,
  linkedin: FaLinkedinIn,
};

const getVisibleSocialLinks = (socialLinks: SocialLinkData[] = []) =>
  socialLinks.slice(0, 5);

export default function RealEstateTopbar1({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const announcement = getTextBlockByRole(resolvedBlocks, "announcement");
  const buttonBlocks = getBlocksByType(resolvedBlocks, "button").filter(
    (button) => button.role !== "social",
  );
  const topbarSolidColor = resolveThemeColor(
    data.topbarBackgroundColor,
    THEME_PRIMARY_BG,
  );
  const topbarGradientColor = data.topbarGradientColor ?? "#0668ff";
  const topbarBackground =
    data.topbarBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${topbarSolidColor}, ${topbarGradientColor})`
      : topbarSolidColor;
  const topbarTextColor = resolveThemeColor(
    data.topbarTextColor,
    THEME_PRIMARY_TEXT,
  );
  const topbarText = announcement?.content ?? "";
  const phone = data.phone ?? "";
  const email = data.email ?? "";
  const location = data.location ?? "";
  const socialLinks = getVisibleSocialLinks(data.socialLinks);
  const isHidden = (field: string) => data.hiddenContentFields?.includes(field) ?? false;

  return (
    <section
      className="hidden md:block transition-all duration-500"
      style={{ background: topbarBackground, color: topbarTextColor }}
    >
      <div className="mx-auto flex min-h-8 max-w-7xl flex-col items-center justify-center gap-3 px-4 py-3 lg:px-6 xl:flex-row xl:justify-between xl:py-0">
        {!isHidden("text") && (announcement ? (
          <BlockRenderer
            block={announcement}
            className="w-full min-w-0 break-words text-center text-xs font-semibold leading-relaxed sm:text-sm xl:flex-1 xl:text-left"
          />
        ) : (
          topbarText && (
            <p className="w-full min-w-0 break-words text-center text-xs font-semibold leading-relaxed sm:text-sm xl:flex-1 xl:text-left">
              {topbarText}
            </p>
          )
        ))}

        <div className="flex w-full min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-1 xl:w-auto xl:flex-none xl:justify-end">
          {!isHidden("phone") && phone && (
            <Link
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="flex min-w-0 items-center justify-center gap-2 break-words text-center text-xs transition-all duration-300 hover:-translate-y-0.5 hover:opacity-80 sm:px-3 sm:text-sm lg:px-4"
            >
              <FaPhoneAlt className="shrink-0 text-xs" />
              <span className="min-w-0 break-all">{phone}</span>
            </Link>
          )}

          {!isHidden("email") && email && (
            <Link
              href={`mailto:${email}`}
              className="flex min-w-0 items-center justify-center gap-2 break-words text-center text-xs transition-all duration-300 hover:-translate-y-0.5 hover:opacity-80 sm:px-3 sm:text-sm lg:px-4"
            >
              <FaEnvelope className="shrink-0 text-xs" />
              <span className="min-w-0 break-all">{email}</span>
            </Link>
          )}

          {!isHidden("location") && location && (
            <span className="flex min-w-0 items-center justify-center gap-2 text-center text-xs sm:px-3 sm:text-sm lg:px-4">
              <FaMapMarkerAlt className="shrink-0 text-xs" />
              <span className="min-w-0 break-words">{location}</span>
            </span>
          )}

          <div className="flex min-w-0 flex-wrap items-center justify-center">
            {buttonBlocks.map((button) => (
              <BlockRenderer
                key={button.id}
                block={button}
                className="min-w-0 break-words px-2 text-center text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:opacity-80 sm:px-3 sm:text-sm"
              />
            ))}
            {!isHidden("socialLinks") && socialLinks.map((socialLink, index) => {
              const Icon = socialIcons[socialLink.label];

              return (
                <Link
                  key={`${socialLink.label}-${index}`}
                  href={socialLink.href}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 sm:h-11 sm:w-11"
                  aria-label={socialLink.label}
                >
                  <Icon size={14} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
