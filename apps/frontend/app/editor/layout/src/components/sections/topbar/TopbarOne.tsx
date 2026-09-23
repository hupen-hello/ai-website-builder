import Link from "next/link";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { SectionProps, SocialLinkData } from "./../../../types/section";
import {
  getBlocksByType,
  getTextBlockByRole,
  resolveSectionBlocks,
} from "../types/section";
import BlockRenderer from "../blocks/BlockRenderer";
import {
  getSocialPlatformIcon,
  SOCIAL_PLATFORM_OPTIONS,
} from "../../../lib/socialPlatforms";

const MAX_TOPBAR_SOCIAL_LINKS = SOCIAL_PLATFORM_OPTIONS.length;

const getVisibleSocialLinks = (socialLinks: SocialLinkData[] = []) =>
  socialLinks.slice(0, MAX_TOPBAR_SOCIAL_LINKS);

export default function TopbarOne({ data = {}, blocks }: SectionProps) {
  const resolvedBlocks = resolveSectionBlocks({ blocks, data });
  const announcement = getTextBlockByRole(resolvedBlocks, "announcement");
  const buttonBlocks = getBlocksByType(resolvedBlocks, "button").filter(
    (button) => button.role !== "social",
  );
  const topbarSolidColor = data.topbarBackgroundColor ?? "var(--primary-bg)";
  const topbarGradientColor = data.topbarGradientColor ?? "#0668ff";
  const topbarBackground =
    data.topbarBackgroundType === "gradient"
      ? `linear-gradient(90deg, ${topbarSolidColor}, ${topbarGradientColor})`
      : topbarSolidColor;
  const topbarTextColor = data.topbarTextColor ?? "var(--primary-text)";
  const topbarText = announcement?.content ?? "";
  const phone = data.phone ?? "";
  const email = data.email ?? "";
  const location = data.location ?? "";
  const socialLinks = getVisibleSocialLinks(data.socialLinks);
  const isHidden = (field: string) => data.hiddenContentFields?.includes(field) ?? false;

  return (
    <section
      className="transition-all duration-500"
      style={{ background: topbarBackground, color: topbarTextColor }}
    >
      <div className="mx-auto flex min-h-12 max-w-7xl flex-col items-start justify-center gap-2 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        {!isHidden("text") && (announcement ? (
          <BlockRenderer
            block={announcement}
            className="text-xs font-semibold sm:text-sm"
          />
        ) : (
          topbarText && (
            <p className="text-xs font-semibold sm:text-sm">{topbarText}</p>
          )
        ))}

        <div className="flex max-w-full flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end sm:divide-x sm:divide-white/20">
          {!isHidden("phone") && phone && (
            <Link
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className="flex items-center gap-2 text-xs transition-all duration-300 hover:-translate-y-0.5 hover:opacity-80 sm:px-4 sm:text-sm lg:px-5"
            >
              <FaPhoneAlt className="text-xs" />
              <span>{phone}</span>
            </Link>
          )}

          {!isHidden("email") && email && (
            <Link
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-xs transition-all duration-300 hover:-translate-y-0.5 hover:opacity-80 sm:px-4 sm:text-sm lg:px-5"
            >
              <FaEnvelope className="text-xs" />
              <span>{email}</span>
            </Link>
          )}

          {!isHidden("location") && location && (
            <span className="flex items-center gap-2 text-xs sm:px-4 sm:text-sm lg:px-5">
              <FaMapMarkerAlt className="text-xs" />
              <span>{location}</span>
            </span>
          )}

          <div className="flex items-center">
            {buttonBlocks.map((button) => (
              <BlockRenderer
                key={button.id}
                block={button}
                className="px-2 text-xs font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:opacity-80 sm:px-4 sm:text-sm"
              />
            ))}
            {!isHidden("socialLinks") && socialLinks.map((socialLink, index) => {
              const Icon = getSocialPlatformIcon(socialLink.label);

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
