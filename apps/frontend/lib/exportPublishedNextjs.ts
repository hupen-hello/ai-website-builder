import type { PublishedSitePayload } from "@/lib/publishedSeo";
import { normalizePageSeoKey } from "@/lib/siteSeo";
import type { ZipFileEntry } from "@/lib/zipStore";

type ExportSection = {
  id?: string;
  page?: string;
  type?: string;
  variant?: string;
  data?: Record<string, Record<string, unknown>>;
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFolderName(slug: string) {
  const cleaned = slugify(slug) || "website";
  return `${cleaned}-nextjs`;
}

export function getPublishedExportFolderName(slug: string) {
  return safeFolderName(slug);
}

function getPageSlug(page?: string) {
  if (!page?.trim()) return "home";
  return normalizePageSeoKey(page);
}

/** Unique page keys from sections + nav links (home + inner pages). */
export function listExportedPages(payload: PublishedSitePayload) {
  const pages = new Set<string>(["home"]);

  for (const section of payload.sections || []) {
    pages.add(getPageSlug(section.page));
  }

  const walk = (
    links: PublishedSitePayload["pageLinks"] | undefined,
  ) => {
    for (const link of links || []) {
      if (link.hidden) continue;
      const label = link.label?.trim();
      if (label) pages.add(normalizePageSeoKey(label));
      if (link.children?.length) walk(link.children);
    }
  };
  walk(payload.pageLinks);

  return Array.from(pages);
}

function sectionsForPage(
  payload: PublishedSitePayload,
  pageKey: string,
): ExportSection[] {
  return (payload.sections || []).filter((section) => {
    const key = getPageSlug(section.page);
    return pageKey === "home" ? key === "home" : key === pageKey;
  }) as ExportSection[];
}

function jsonPretty(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildSiteData(payload: PublishedSitePayload) {
  const pages = listExportedPages(payload).map((pageKey) => ({
    key: pageKey,
    label:
      pageKey === "home"
        ? "Home"
        : pageKey
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" "),
    path: pageKey === "home" ? "/" : `/${pageKey}`,
    sectionCount: sectionsForPage(payload, pageKey).length,
  }));

  return {
    exportedAt: new Date().toISOString(),
    id: payload.id,
    title: payload.title || payload.slug || "Website",
    slug: payload.slug || payload.id,
    templateId: payload.templateId,
    category: payload.category,
    publishedAt: payload.publishedAt,
    pageLinks: payload.pageLinks || [],
    templateVariables: payload.templateVariables || {},
    businessInfo: payload.businessInfo ?? null,
    seo: payload.seo ?? null,
    pages,
    sections: payload.sections || [],
  };
}

function packageJson(siteTitle: string) {
  return jsonPretty({
    name: slugify(siteTitle) || "exported-website",
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
    },
    dependencies: {
      next: "15.1.0",
      react: "19.0.0",
      "react-dom": "19.0.0",
    },
    devDependencies: {
      "@types/node": "^20",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      typescript: "^5",
    },
  });
}

function readme(siteTitle: string, slug: string, imageCount: number) {
  return `# ${siteTitle}

Exported published website from CSS Founder / Lestow.

This package contains **only your published site data, pages, and images** — not the website builder.

## What's included

- \`data/site.json\` — full published payload (sections, nav, SEO, theme CSS variables)
- \`public/media/\` — ${imageCount} image file(s) copied from your site (URLs rewritten to local paths)
- \`app/\` — Next.js App Router pages for Home + every multi-page route
- \`components/SiteRenderer.tsx\` — website-style sections (hero, content, cards) from your JSON

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000 (or the port Next prints, e.g. 3002 if 3000 is busy).

## Notes

- Re-export from **My Websites → Export Next.js** after any builder changes so CSS + \`public/media/\` stay in sync.
- Images are bundled under \`public/media/\` so the site can run offline (${imageCount} file(s) in this ZIP).
- Layout is a self-contained content theme (not a clone of every builder section component). Theme colors from the builder are applied as CSS variables on \`:root\`.
- Original published URL slug: \`${slug}\`
`;
}

function layoutTsx() {
  return `import type { Metadata } from "next";
import site from "../data/site.json";
import "./globals.css";

const title =
  (site.seo as { metaTitle?: string; title?: string } | null)?.metaTitle ||
  (site.seo as { title?: string } | null)?.title ||
  site.title;

const description =
  (site.seo as { metaDescription?: string; description?: string } | null)
    ?.metaDescription ||
  (site.seo as { description?: string } | null)?.description ||
  \`Official \${site.title} website.\`;

export const metadata: Metadata = {
  title,
  description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = (site.templateVariables || {}) as Record<string, string>;
  const cssVars = Object.entries(theme)
    .filter(([key, value]) => key.startsWith("--") && typeof value === "string" && value.trim())
    .map(([key, value]) => {
      const mapped =
        key === "--header-bg"
          ? "--site-header-bg"
          : key === "--header-text"
            ? "--site-header-text"
            : key;
      return \`\${mapped}:\${value};\${key}:\${value};\`;
    })
    .join("");

  return (
    <html lang="en">
      <body>
        {cssVars ? <style dangerouslySetInnerHTML={{ __html: \`:root{\${cssVars}}\` }} /> : null}
        <header className="topbar">
          <div className="topbar-inner">
            <a href="/" className="brand">
              {site.title}
            </a>
            <nav className="nav">
              {(site.pages || []).map((page) => (
                <a key={page.key} href={page.path}>
                  {page.label}
                </a>
              ))}
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-inner">
            <strong>{site.title}</strong>
            <p>Exported published website · {site.slug}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
`;
}

function globalsCss() {
  return `*,
*::before,
*::after { box-sizing: border-box; }

:root {
  --bg: #f4f7fb;
  --text: #0f172a;
  --muted: #64748b;
  --card: #ffffff;
  --border: #e2e8f0;
  --primary-bg: #2563eb;
  --primary-text: #ffffff;
  --accent: var(--primary-bg);
  --accent-text: var(--primary-text);
  --site-header-bg: #0f172a;
  --site-header-text: #ffffff;
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  line-height: 1.55;
}

a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }
p { margin: 0.35rem 0 0; }
h1,h2,h3 { margin: 0; letter-spacing: -0.03em; line-height: 1.15; }

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--site-header-bg) 92%, black);
  color: var(--site-header-text);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(10px);
}

.topbar-inner,
.footer-inner,
.wrap {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
}

.topbar-inner {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  font-weight: 800;
  font-size: 1.05rem;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  justify-content: flex-end;
}

.nav a {
  font-size: 0.9rem;
  opacity: 0.86;
}

.nav a:hover { opacity: 1; }

.page {
  padding: 1.25rem 0 3rem;
}

.page-label {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto 1rem;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stack { display: grid; gap: 1.25rem; }

.hero {
  position: relative;
  overflow: hidden;
  border-radius: 0;
  min-height: 420px;
  color: #fff;
  background:
    linear-gradient(120deg, rgba(15,23,42,.78), rgba(15,23,42,.35)),
    var(--hero-image, linear-gradient(135deg, #1d4ed8, #0f172a));
  background-size: cover;
  background-position: center;
}

.hero-inner {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 3rem 0;
  gap: 0.75rem;
}

.eyebrow {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.85;
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.4rem);
  max-width: 16ch;
}

.hero p {
  max-width: 42ch;
  font-size: 1.05rem;
  opacity: 0.92;
}

.section {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 1.4rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.section-grid {
  display: grid;
  gap: 1.25rem;
}

@media (min-width: 900px) {
  .section-grid.two {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: center;
  }
}

.kicker {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section h2 {
  margin-top: 0.35rem;
  font-size: clamp(1.45rem, 3vw, 2rem);
}

.lead {
  margin-top: 0.75rem;
  color: #334155;
  font-size: 1rem;
}

.media {
  width: 100%;
  border-radius: 18px;
  object-fit: cover;
  background: #e2e8f0;
  border: 1px solid var(--border);
}

.media.tall { min-height: 280px; max-height: 420px; }
.media.wide { max-height: 320px; }

.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 0.7rem 1.15rem;
  background: var(--accent);
  color: var(--accent-text);
  font-size: 0.9rem;
  font-weight: 700;
}

.btn.secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.cards {
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
}

@media (min-width: 720px) {
  .cards.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .cards.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.card {
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 0.95rem;
  background: #f8fafc;
}

.card h3 {
  font-size: 1.05rem;
  margin-top: 0.55rem;
}

.card p {
  color: #475569;
  font-size: 0.92rem;
}

.footer {
  margin-top: 2.5rem;
  border-top: 1px solid var(--border);
  background: #0f172a;
  color: #e2e8f0;
}

.footer-inner {
  padding: 1.6rem 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
}

.footer p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.88rem;
}

.empty {
  width: min(1120px, calc(100% - 2rem));
  margin: 2rem auto;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  background: var(--card);
}
`;
}

function siteRendererTsx() {
  return `"use client";

type Section = {
  id?: string;
  page?: string;
  type?: string;
  variant?: string;
  data?: Record<string, Record<string, unknown>>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getVariantData(section: Section) {
  if (!section.data) return {};
  const preferred =
    (section.variant && section.data[section.variant]) ||
    (section.type ? section.data[\`\${section.type}-1\`] : undefined) ||
    Object.values(section.data)[0];
  return isRecord(preferred) ? preferred : {};
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickString(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asString(data[key]);
    if (value) return value;
  }
  return "";
}

function pickImage(data: Record<string, unknown>) {
  const direct = pickString(data, [
    "backgroundImage",
    "sideImage",
    "logoImage",
    "image",
    "src",
    "heroImage",
    "bannerImage",
    "mainImage",
    "ogImage",
  ]);
  if (direct) return direct;

  if (Array.isArray(data.blocks)) {
    for (const block of data.blocks) {
      if (!isRecord(block)) continue;
      if (block.type === "image" || block.type === "logo") {
        const src = asString(block.src) || asString(block.text);
        if (src) return src;
      }
    }
  }

  return "";
}

function pickButtons(data: Record<string, unknown>) {
  const buttons = Array.isArray(data.buttons) ? data.buttons : [];
  return buttons
    .filter(isRecord)
    .map((button) => ({
      label: asString(button.label) || "Learn more",
      href: asString(button.href) || asString(button.url) || "#",
    }))
    .filter((button) => button.label);
}

function pickCards(data: Record<string, unknown>) {
  const collections = [
    data.productItems,
    data.serviceSlides,
    data.whyChooseUsItems,
    data.galleryItems,
    data.testimonialItems,
    data.faqItems,
    data.slides,
    data.cards,
    data.items,
  ];

  for (const collection of collections) {
    if (!Array.isArray(collection) || !collection.length) continue;
    return collection.filter(isRecord).map((item, index) => ({
      title:
        pickString(item, ["title", "label", "name", "productTitle"]) ||
        \`Item \${index + 1}\`,
      desc: pickString(item, [
        "desc",
        "description",
        "content",
        "productInfoDesc",
        "excerpt",
      ]),
      image: pickString(item, ["image", "src", "img", "photo", "thumbnail"]),
      href: pickString(item, ["href", "url"]),
    }));
  }

  return [];
}

function Media({ src, className = "" }: { src: string; className?: string }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={\`media \${className}\`} src={src} alt="" />
  );
}

function Buttons({ data }: { data: Record<string, unknown> }) {
  const buttons = pickButtons(data);
  if (!buttons.length) return null;
  return (
    <div className="btn-row">
      {buttons.map((button, index) => (
        <a
          key={\`\${button.label}-\${index}\`}
          className={\`btn\${index > 0 ? " secondary" : ""}\`}
          href={button.href}
        >
          {button.label}
        </a>
      ))}
    </div>
  );
}

function Cards({ data }: { data: Record<string, unknown> }) {
  const cards = pickCards(data);
  if (!cards.length) return null;
  const cols = cards.length >= 3 ? "cols-3" : "cols-2";
  return (
    <div className={\`cards \${cols}\`}>
      {cards.map((card, index) => (
        <article className="card" key={\`\${card.title}-\${index}\`}>
          <Media src={card.image} className="wide" />
          <h3>{card.title}</h3>
          {card.desc ? <p>{card.desc}</p> : null}
          {card.href ? (
            <div className="btn-row">
              <a className="btn secondary" href={card.href}>
                View
              </a>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function HeroSection({ data }: { data: Record<string, unknown> }) {
  const image = pickImage(data);
  const pretitle = pickString(data, ["pretitle", "eyebrow", "kicker"]);
  const title = pickString(data, ["title", "heading", "headline"]);
  const desc = pickString(data, ["desc", "description", "subtitle", "paragraph"]);

  return (
    <section
      className="hero"
      style={image ? ({ ["--hero-image" as string]: \`url(\${image})\` } as React.CSSProperties) : undefined}
    >
      <div className="hero-inner">
        {pretitle ? <div className="eyebrow">{pretitle}</div> : null}
        {title ? <h1>{title}</h1> : <h1>Welcome</h1>}
        {desc ? <p>{desc}</p> : null}
        <Buttons data={data} />
      </div>
    </section>
  );
}

function ContentSection({
  data,
  type,
}: {
  data: Record<string, unknown>;
  type: string;
}) {
  const image = pickImage(data);
  const pretitle = pickString(data, ["pretitle", "eyebrow", "kicker"]);
  const title = pickString(data, [
    "title",
    "heading",
    "headline",
    "productSectionTitle",
    "philosophyTitle",
  ]);
  const desc = pickString(data, [
    "desc",
    "description",
    "subtitle",
    "paragraph",
    "philosophyDesc",
  ]);
  const desc2 = pickString(data, ["desc2", "paragraph-secondary"]);
  const cards = pickCards(data);
  const isSplit = Boolean(image) && !cards.length;

  return (
    <section className="section">
      <div className={\`section-grid\${isSplit ? " two" : ""}\`}>
        <div>
          {pretitle ? <div className="kicker">{pretitle}</div> : null}
          {title ? <h2>{title}</h2> : <h2>{type}</h2>}
          {desc ? <p className="lead">{desc}</p> : null}
          {desc2 ? <p className="lead">{desc2}</p> : null}
          <Buttons data={data} />
          <Cards data={data} />
        </div>
        {isSplit ? <Media src={image} className="tall" /> : null}
      </div>
      {!isSplit && image && !cards.length ? (
        <div style={{ marginTop: "1rem" }}>
          <Media src={image} className="wide" />
        </div>
      ) : null}
    </section>
  );
}

export function SiteRenderer({
  sections,
  pageLabel,
}: {
  sections: Section[];
  pageLabel: string;
}) {
  if (!sections.length) {
    return <div className="empty">No sections found for {pageLabel}.</div>;
  }

  return (
    <div className="page">
      {pageLabel !== "Home" ? (
        <div className="page-label">{pageLabel}</div>
      ) : null}
      <div className="stack">
        {sections.map((section, index) => {
          const data = getVariantData(section);
          const type = (section.type || "Section").toLowerCase();
          const key = section.id || \`\${section.type}-\${index}\`;

          if (
            type.includes("banner") ||
            type.includes("hero") ||
            (type === "header" && pickString(data, ["title", "desc"]))
          ) {
            if (type.includes("banner") || type.includes("hero")) {
              return <HeroSection key={key} data={data} />;
            }
          }

          if (type === "header" || type === "topbar") {
            const logoImage = pickString(data, ["logoImage"]) || "";
            const logoText = pickString(data, ["logo", "brandName", "title"]);
            return (
              <section className="section" key={key}>
                <div className="section-grid two">
                  <div>
                    <div className="kicker">Brand</div>
                    <h2>{logoText || "Header"}</h2>
                  </div>
                  {logoImage ? <Media src={logoImage} className="wide" /> : null}
                </div>
              </section>
            );
          }

          return <ContentSection key={key} data={data} type={section.type || "Section"} />;
        })}
      </div>
    </div>
  );
}
`;
}

function homePageTsx() {
  return `import site from "../data/site.json";
import { SiteRenderer } from "../components/SiteRenderer";

function pageKey(page?: string) {
  if (!page?.trim()) return "home";
  return page.trim().toLowerCase().replace(/\\s+/g, "-");
}

export default function HomePage() {
  const sections = (site.sections || []).filter(
    (section) => pageKey(section.page) === "home",
  );

  return <SiteRenderer sections={sections} pageLabel="Home" />;
}
`;
}

function dynamicPageTsx() {
  return `import { notFound } from "next/navigation";
import site from "../../data/site.json";
import { SiteRenderer } from "../../components/SiteRenderer";

function pageKey(page?: string) {
  if (!page?.trim()) return "home";
  return page
    .trim()
    .toLowerCase()
    .replace(/\\s+/g, "-")
    .replace(/about-us/, "about")
    .replace(/contact-us/, "contact")
    .replace(/^service$/, "services");
}

type PageProps = {
  params: Promise<{ pageSlug: string }>;
};

export function generateStaticParams() {
  return (site.pages || [])
    .filter((page) => page.key !== "home")
    .map((page) => ({ pageSlug: page.key }));
}

export default async function InnerPage({ params }: PageProps) {
  const { pageSlug } = await params;
  const page = (site.pages || []).find((item) => item.key === pageSlug);
  if (!page || pageSlug === "home") notFound();

  const sections = (site.sections || []).filter(
    (section) => pageKey(section.page) === pageSlug,
  );

  return <SiteRenderer sections={sections} pageLabel={page.label} />;
}
`;
}

/**
 * Build a downloadable Next.js project from a published site payload only.
 * Does not include the website builder / monorepo.
 */
export function buildPublishedNextjsExport(
  payload: PublishedSitePayload,
  options?: {
    extraFiles?: ZipFileEntry[];
    imageCount?: number;
  },
): { folderName: string; files: ZipFileEntry[]; filename: string } {
  const title = payload.title?.trim() || payload.slug || "website";
  const slug = payload.slug || payload.id || "website";
  const folderName = safeFolderName(slug);
  const siteData = buildSiteData(payload);
  const imageCount = options?.imageCount ?? 0;

  const files: ZipFileEntry[] = [
    { path: `${folderName}/package.json`, content: packageJson(title) },
    {
      path: `${folderName}/README.md`,
      content: readme(title, slug, imageCount),
    },
    {
      path: `${folderName}/tsconfig.json`,
      content: jsonPretty({
        compilerOptions: {
          target: "ES2017",
          lib: ["dom", "dom.iterable", "esnext"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: "preserve",
          incremental: true,
          plugins: [{ name: "next" }],
          paths: { "@/*": ["./*"] },
        },
        include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
        exclude: ["node_modules"],
      }),
    },
    {
      path: `${folderName}/next.config.ts`,
      content: `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;
`,
    },
    {
      path: `${folderName}/next-env.d.ts`,
      content: `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
    },
    { path: `${folderName}/data/site.json`, content: jsonPretty(siteData) },
    { path: `${folderName}/app/globals.css`, content: globalsCss() },
    { path: `${folderName}/app/layout.tsx`, content: layoutTsx() },
    { path: `${folderName}/app/page.tsx`, content: homePageTsx() },
    {
      path: `${folderName}/app/[pageSlug]/page.tsx`,
      content: dynamicPageTsx(),
    },
    {
      path: `${folderName}/components/SiteRenderer.tsx`,
      content: siteRendererTsx(),
    },
    ...(options?.extraFiles || []),
  ];

  return {
    folderName,
    files,
    filename: `${folderName}.zip`,
  };
}
