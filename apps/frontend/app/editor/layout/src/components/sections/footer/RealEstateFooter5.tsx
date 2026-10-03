"use client";

import Link from "next/link";
import type { SectionProps } from "../../../types/section";
import { useOptionalPreview } from "../../context/PreviewContext";
import { getAccentStyle } from "../../../lib/accentStyle";
import {
  getPageLabelFromHref,
  scrollTemplateToTop,
} from "../../../lib/previewNav";

type FooterLink = { label?: string; href?: string; url?: string };
type Social = { label?: string; href?: string; url?: string };
type ColumnTitles = {
  company?: string;
  services?: string;
  explore?: string;
  contact?: string;
};

const DEFAULT_LOGO = "/categories/realestate/template5/property_logo.webp";
const DEFAULT_DESCRIPTION =
  "We bring pride and passion to every project that we undertake, with a professional team of designers, project managers and tradespeople.";
const DEFAULT_COPYRIGHT =
  "© 2026 Real Estate. All Rights Reserved | Designed by Lestow";

const defaultCompany: FooterLink[] = [
  { label: "Home", url: "/" },
  { label: "About Us", url: "/about" },
  { label: "Services", url: "/services" },
  { label: "Properties", url: "/properties" },
  { label: "Gallery", url: "/gallery" },
];

const defaultServices: FooterLink[] = [
  { label: "Contact Us", url: "/contact" },
  { label: "Brochure", url: "/brochure" },
  { label: "Pricing Packages", url: "/package" },
  { label: "Our Team", url: "/teams" },
  { label: "Careers", url: "/career" },
];

const defaultExplore: FooterLink[] = [
  { label: "Blogs", url: "/blogs" },
  { label: "Testimonials", url: "/testimonial" },
  { label: "Awards", url: "/awards" },
  { label: "Partners", url: "/partners" },
  { label: "Get a Quote", url: "/quote" },
];

const defaultLegal: FooterLink[] = [
  { label: "Terms & Conditions", url: "/terms" },
  { label: "Privacy Policy", url: "/privacy-policy" },
  { label: "Cookie Policy", url: "/cookies-policy" },
  { label: "Sitemap", url: "/sitemap" },
];

const defaultSocial: Social[] = [
  { label: "f", url: "#" },
  { label: "X", url: "#" },
  { label: "O", url: "#" },
];

function asLinks(value: unknown, fallback: FooterLink[]): FooterLink[] {
  return Array.isArray(value) && value.length ? (value as FooterLink[]) : fallback;
}

export default function RealEstateFooter5({ data = {} }: SectionProps) {
  const preview = useOptionalPreview();
  const accent = String(data.accentColor || "#ff6b00");
  const titles = (data.columnTitles ?? {}) as ColumnTitles;

  // Prefer source-shaped arrays; fall back to footerColumns if present.
  const footerColumns = Array.isArray(data.footerColumns)
    ? (data.footerColumns as { title?: string; links?: FooterLink[] }[])
    : [];
  const company = asLinks(
    data.company,
    footerColumns[0]?.links?.length ? footerColumns[0].links! : defaultCompany,
  );
  const services = asLinks(
    data.services,
    footerColumns[1]?.links?.length ? footerColumns[1].links! : defaultServices,
  );
  const explore = asLinks(
    data.explore,
    footerColumns[2]?.links?.length ? footerColumns[2].links! : defaultExplore,
  );

  const contact = (data.contact ?? data.footerContact ?? {}) as Record<
    string,
    unknown
  >;
  const address = String(contact.address || "Broadway, New York,\nNY, United States");
  const phone = String(contact.phone || "(555) 555-5555");
  const email = String(contact.email || "contact@example.com");
  const social = (
    Array.isArray(contact.social) && contact.social.length
      ? contact.social
      : Array.isArray(data.socialLinks) && data.socialLinks.length
        ? data.socialLinks
        : defaultSocial
  ) as Social[];

  const legalLinks = asLinks(
    data.legalLinks ?? data.footerLegalLinks,
    defaultLegal,
  );

  const rawLogo = String(data.logoImage || data.logo || "");
  const logoImage =
    rawLogo.startsWith("/") || rawLogo.startsWith("http") ? rawLogo : DEFAULT_LOGO;
  const logoAlt = String(data.logoImageTitle || data.logoAlt || "Footer Logo");
  const logoHref = String(data.logoUrl || "/");
  const description = String(data.description || data.desc || DEFAULT_DESCRIPTION);
  const copyright = String(data.copyright || DEFAULT_COPYRIGHT);

  const handleNavigate = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    label: string,
  ) => {
    if (!preview) return;
    event.preventDefault();
    preview.setCurrentPage(getPageLabelFromHref(href, label));
    scrollTemplateToTop();
  };

  const renderLinkList = (links: FooterLink[]) => (
    <ul className="flex flex-col gap-4">
      {links.map((link) => {
        const href = String(link.url || link.href || "/");
        const label = String(link.label || "");
        return (
          <li key={`${label}-${href}`}>
            <Link
              href={href}
              onClick={(event) => handleNavigate(event, href, label)}
              className="text-[0.95rem] text-white/70 transition-colors duration-200 hover:text-white"
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <footer
      className="bg-[#1a1a1a] pb-5 pt-10 text-white"
      style={getAccentStyle(accent)}
      data-editor-fields="accentColor logo logoUrl description company services explore contact legalLinks copyright columnTitles"
    >
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-8 overflow-x-hidden px-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-5 lg:gap-6 lg:overflow-visible lg:px-6">
        <div className="sm:col-span-2 lg:col-span-1 lg:pr-5">
          <Link
            href={logoHref}
            onClick={(event) => handleNavigate(event, logoHref, "Home")}
            className="mb-6 flex items-center transition-opacity hover:opacity-80"
          >
            <img
              src={logoImage}
              alt={logoAlt}
              className="h-auto max-h-[60px] w-auto object-contain brightness-0 invert"
            />
          </Link>
          <p className="text-sm leading-relaxed text-white/70">{description}</p>
        </div>

        <div>
          <h3 className="mb-6 text-lg font-semibold">
            {titles.company || "Company"}
          </h3>
          {renderLinkList(company)}
        </div>

        <div>
          <h3 className="mb-6 text-lg font-semibold">
            {titles.services || "Services"}
          </h3>
          {renderLinkList(services)}
        </div>

        <div>
          <h3 className="mb-6 text-lg font-semibold">
            {titles.explore || "Explore"}
          </h3>
          {renderLinkList(explore)}
        </div>

        <div>
          <h3 className="mb-6 text-lg font-semibold">
            {titles.contact || "Contact"}
          </h3>
          <div className="flex flex-col gap-3 text-[0.95rem] text-white/70">
            <div className="whitespace-pre-line leading-relaxed">{address}</div>
            {phone ? (
              <a
                href={`tel:${phone}`}
                className="text-white/70 transition-colors duration-200 hover:text-white"
              >
                {phone}
              </a>
            ) : null}
            {email ? (
              <a
                href={`mailto:${email}`}
                className="text-white/70 transition-colors duration-200 hover:text-white"
              >
                {email}
              </a>
            ) : null}
            <div className="mt-2 flex gap-3">
              {social.map((item) => {
                const href = String(item.url || item.href || "#");
                const label = String(item.label || "");
                return (
                  <a
                    key={`${label}-${href}`}
                    href={href}
                    title={label}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent)]"
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-white/10 pt-6 lg:mt-12">
        <div className="mx-auto flex w-full max-w-[1320px] flex-col flex-wrap items-center justify-center gap-4 px-4 text-center text-sm text-white/60 sm:px-5 md:flex-row md:justify-between md:gap-6 md:text-left lg:px-6">
          <div>{copyright}</div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {legalLinks.map((link) => {
              const href = String(link.url || link.href || "/");
              const label = String(link.label || "");
              return (
                <Link
                  key={`${label}-${href}`}
                  href={href}
                  onClick={(event) => handleNavigate(event, href, label)}
                  className="text-white/60 transition-colors duration-200 hover:text-white"
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
