import { promises as fs } from "fs";
import path from "path";
import type { PublishedSitePayload } from "@/lib/publishedSeo";
import {
  collectUsedRendererFiles,
  rewriteUnusedFeatureImports,
  slimPublishedPayloadForExport,
} from "@/lib/exportUsedRenderer";
import type { ZipFileEntry } from "@/lib/zipStore";

type WebsiteType = "Single Page Website" | "Multiple Pages Website";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFolderName(slug: string) {
  return `${slugify(slug) || "website"}-nextjs`;
}

export function getPublishedExportFolderName(slug: string) {
  return safeFolderName(slug);
}

function jsonPretty(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function frontendRoot() {
  // Prefer apps/frontend when cwd is monorepo root; else assume cwd is frontend.
  const cwd = process.cwd();
  if (path.basename(cwd) === "frontend") return cwd;
  return path.join(cwd, "apps", "frontend");
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveWebsiteType(
  root: string,
  templateId?: string | null,
): Promise<WebsiteType> {
  if (!templateId?.trim()) return "Single Page Website";
  const contentPath = path.join(
    root,
    "app",
    "editor",
    "layout",
    "src",
    "data",
    "categoryContent.json",
  );
  try {
    const raw = JSON.parse(await fs.readFile(contentPath, "utf8")) as {
      templates?: Array<{ id?: string; type?: string }>;
    };
    const match = (raw.templates || []).find((item) => item.id === templateId);
    if (match?.type === "Multiple Pages Website") {
      return "Multiple Pages Website";
    }
  } catch {
    /* fall through */
  }
  return "Single Page Website";
}

async function collectExactFiles(
  pairs: Array<{ abs: string; zip: string }>,
  files: ZipFileEntry[],
) {
  for (const pair of pairs) {
    if (!(await fileExists(pair.abs))) continue;
    files.push({
      path: pair.zip.replace(/\\/g, "/"),
      content: await fs.readFile(pair.abs),
    });
  }
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
      "lucide-react": "^0.469.0",
      "react-icons": "^5.4.0",
      "@tailwindcss/postcss": "^4.0.0",
      tailwindcss: "^4.0.0",
    },
    devDependencies: {
      "@types/node": "^20",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      typescript: "^5",
    },
  });
}

function readme(siteTitle: string, slug: string, imageCount: number, websiteType: WebsiteType) {
  return `# ${siteTitle}

Exported published website (same look as \`/published/${slug}\`).

**${websiteType}** · only **used** pages, section variants, and media — no website builder / unused layouts.

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000 — it redirects to \`/published/${slug}\`.

## Included

- \`renderer/\` — only the section components this site uses (read-only)
- \`data/site.json\` — used pages + active variant data only
- \`public/media/\` — ${imageCount} image/video file(s)
- Lead form stub at \`/api/published/${slug}/leads\`

## Not included

- Editor UI, unused section variants, builder admin, draft/orphan pages
`;
}

function templateFlowStub(templateId: string, websiteType: WebsiteType) {
  return `export type BuilderTemplate = {
  id: string;
  type: "Single Page Website" | "Multiple Pages Website";
};

/** Keeps published routing aligned with the original template type. */
export function getBuilderTemplates(): BuilderTemplate[] {
  return [
    {
      id: ${JSON.stringify(templateId)},
      type: ${JSON.stringify(websiteType)},
    },
  ];
}
`;
}

function publishedPageTsx() {
  return `import type { Metadata } from "next";
import site from "../../../data/site.json";
import {
  buildPublishedJsonLd,
  buildPublishedMetadata,
  getSiteOrigin,
  hasPublishedBlogIndexPage,
  hasPublishedEventsPage,
  hasPublishedPortfolioPage,
  hasPublishedPropertiesPage,
  hasPublishedServicesPage,
  isKnownPublishedPagePath,
  isPublishedBlogPublicPath,
  isPublishedEventsPublicPath,
  isPublishedPortfolioPublicPath,
  isPublishedPropertiesPublicPath,
  isPublishedServicesPublicPath,
  resolvePublishedPageLabelFromSlug,
  resolvePublishedSeo,
  type PublishedSitePayload,
} from "@/lib/publishedSeo";
import PublishedSiteClient from "./PublishedSiteClient";

const payload = site as PublishedSitePayload;

async function resolveOrigin() {
  if (process.env.NEXT_PUBLIC_PUBLISH_BASE_URL) {
    return getSiteOrigin();
  }
  return getSiteOrigin();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteId: string; pageSlug?: string }>;
}): Promise<Metadata> {
  const { pageSlug } = await params;
  const origin = await resolveOrigin();
  const pageLabel = resolvePublishedPageLabelFromSlug(payload, pageSlug);
  return buildPublishedMetadata(payload, origin, pageLabel, pageSlug);
}

export default async function PublishedSitePage({
  params,
}: {
  params: Promise<{ siteId: string; pageSlug?: string }>;
}) {
  const { siteId, pageSlug } = await params;
  const origin = await resolveOrigin();
  const featureDisabled =
    (isPublishedBlogPublicPath(pageSlug) &&
      !hasPublishedBlogIndexPage(payload)) ||
    (isPublishedServicesPublicPath(pageSlug) &&
      !hasPublishedServicesPage(payload)) ||
    (isPublishedEventsPublicPath(pageSlug) &&
      !hasPublishedEventsPage(payload)) ||
    (isPublishedPortfolioPublicPath(pageSlug) &&
      !hasPublishedPortfolioPage(payload)) ||
    (isPublishedPropertiesPublicPath(pageSlug) &&
      !hasPublishedPropertiesPage(payload));
  const unknownPage =
    Boolean(pageSlug) &&
    !featureDisabled &&
    !isKnownPublishedPagePath(payload, pageSlug);
  const pageUnavailable = featureDisabled || unknownPage;
  const pageLabel = pageUnavailable
    ? "Home"
    : resolvePublishedPageLabelFromSlug(payload, pageSlug);
  const seo = !pageUnavailable
    ? resolvePublishedSeo(payload, origin, pageLabel, pageSlug)
    : null;
  const jsonLd = !pageUnavailable
    ? buildPublishedJsonLd(payload, origin, pageLabel, pageSlug)
    : null;

  return (
    <>
      {seo ? (
        <>
          <title>{seo.title}</title>
          <meta name="description" content={seo.description} />
          <meta name="keywords" content={seo.keywordsContent} />
          <meta property="og:title" content={seo.ogTitle} />
          <meta property="og:description" content={seo.ogDescription} />
          <meta property="og:url" content={seo.siteUrl} />
          <meta property="og:type" content={seo.ogType} />
          {seo.ogImage ? (
            <meta property="og:image" content={seo.ogImage} />
          ) : null}
          <link rel="canonical" href={seo.siteUrl} />
        </>
      ) : pageUnavailable ? (
        <>
          <title>Page not found</title>
          <meta name="robots" content="noindex, nofollow" />
        </>
      ) : null}
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <PublishedSiteClient
        siteId={payload.slug || siteId}
        initialPageSlug={pageSlug}
        initialPayload={payload}
      />
    </>
  );
}
`;
}

function rootLayoutTsx(title: string) {
  return `import type { Metadata } from "next";
import { agrandirBolt, generalSansMedium } from "./fonts";
import "./globals.css";
import "./main.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(`Official ${title} website.`)},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={\`h-full \${generalSansMedium.className} \${agrandirBolt.variable}\`}
    >
      <body
        className={\`min-h-dvh overflow-x-hidden overflow-y-auto \${generalSansMedium.className}\`}
      >
        {children}
      </body>
    </html>
  );
}
`;
}

function rootPageTsx(slug: string) {
  return `import { redirect } from "next/navigation";

export default function Home() {
  redirect(${JSON.stringify(`/published/${slug}`)});
}
`;
}

function publishedApiRoute() {
  return `import { NextResponse } from "next/server";
import site from "../../../../data/site.json";

export async function GET() {
  return NextResponse.json(site);
}
`;
}

function leadsApiRoute() {
  return `import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await request.json();
  } catch {
    /* ignore body parse errors */
  }
  return NextResponse.json({
    ok: true,
    message: "Lead received (local export stub — not stored).",
  });
}
`;
}

/**
 * Build a Next.js ZIP that reuses the real published section renderer
 * (same look as /published/{slug}) without shipping the website editor.
 */
export async function buildPublishedParityNextjsExport(
  payload: PublishedSitePayload,
  options?: {
    extraFiles?: ZipFileEntry[];
    imageCount?: number;
  },
): Promise<{ folderName: string; files: ZipFileEntry[]; filename: string }> {
  const title = payload.title?.trim() || payload.slug || "website";
  const slug = payload.slug || payload.id || "website";
  const folderName = safeFolderName(slug);
  const root = frontendRoot();
  const imageCount = options?.imageCount ?? 0;
  const websiteType = await resolveWebsiteType(root, payload.templateId);
  const slimPayload = slimPublishedPayloadForExport(payload);
  const exportPayload = {
    ...slimPayload,
    websiteType,
  };
  const files: ZipFileEntry[] = [];

  // Scaffold
  files.push(
    { path: `${folderName}/package.json`, content: packageJson(title) },
    {
      path: `${folderName}/README.md`,
      content: readme(title, slug, imageCount, websiteType),
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
      path: `${folderName}/postcss.config.mjs`,
      content: `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`,
    },
    {
      path: `${folderName}/next-env.d.ts`,
      content: `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`,
    },
    {
      path: `${folderName}/data/site.json`,
      content: jsonPretty(exportPayload),
    },
  );

  // App shell
  await collectExactFiles(
    [
      {
        abs: path.join(root, "app", "globals.css"),
        zip: `${folderName}/app/globals.css`,
      },
      {
        abs: path.join(root, "app", "main.css"),
        zip: `${folderName}/app/main.css`,
      },
      {
        abs: path.join(root, "app", "fonts.ts"),
        zip: `${folderName}/app/fonts.ts`,
      },
      {
        abs: path.join(root, "public", "fonts", "agrandir-bolt.woff2"),
        zip: `${folderName}/public/fonts/agrandir-bolt.woff2`,
      },
      {
        abs: path.join(root, "public", "fonts", "GeneralSans-Medium.woff"),
        zip: `${folderName}/public/fonts/GeneralSans-Medium.woff`,
      },
      {
        abs: path.join(root, "lib", "publishedSeo.ts"),
        zip: `${folderName}/lib/publishedSeo.ts`,
      },
      {
        abs: path.join(root, "lib", "siteSeo.ts"),
        zip: `${folderName}/lib/siteSeo.ts`,
      },
      {
        abs: path.join(root, "lib", "countryFlags.ts"),
        zip: `${folderName}/lib/countryFlags.ts`,
      },
      {
        abs: path.join(root, "lib", "recoverBlogPageLinks.ts"),
        zip: `${folderName}/lib/recoverBlogPageLinks.ts`,
      },
    ],
    files,
  );

  files.push(
    {
      path: `${folderName}/app/layout.tsx`,
      content: rootLayoutTsx(title),
    },
    {
      path: `${folderName}/app/page.tsx`,
      content: rootPageTsx(slug),
    },
    {
      path: `${folderName}/app/published/[siteId]/page.tsx`,
      content: publishedPageTsx(),
    },
    {
      path: `${folderName}/app/api/published/[siteId]/route.ts`,
      content: publishedApiRoute(),
    },
    {
      path: `${folderName}/app/api/published/[siteId]/leads/route.ts`,
      content: leadsApiRoute(),
    },
  );

  // PublishedSiteClient + nested route re-exports
  const clientAbs = path.join(
    root,
    "app",
    "published",
    "[siteId]",
    "PublishedSiteClient.tsx",
  );
  if (await fileExists(clientAbs)) {
    let clientSource = await fs.readFile(clientAbs, "utf8");
    // Export has no user dashboard — send 404 CTA home instead.
    clientSource = clientSource.replaceAll(
      'href="/user/dashboard"',
      'href="/"',
    );
    // Point at exported renderer package (not app/editor).
    clientSource = clientSource.replaceAll(
      "../../editor/layout/src/",
      "@/renderer/",
    );
    clientSource = rewriteUnusedFeatureImports(clientSource, slimPayload);
    files.push({
      path: `${folderName}/app/published/[siteId]/PublishedSiteClient.tsx`,
      content: clientSource,
    });
  }

  await collectExactFiles(
    [
      {
        abs: path.join(root, "app", "published", "[siteId]", "[pageSlug]", "page.tsx"),
        zip: `${folderName}/app/published/[siteId]/[pageSlug]/page.tsx`,
      },
      {
        abs: path.join(
          root,
          "app",
          "published",
          "[siteId]",
          "blog",
          "[blogSlug]",
          "page.tsx",
        ),
        zip: `${folderName}/app/published/[siteId]/blog/[blogSlug]/page.tsx`,
      },
      {
        abs: path.join(
          root,
          "app",
          "published",
          "[siteId]",
          "blogs",
          "[blogSlug]",
          "page.tsx",
        ),
        zip: `${folderName}/app/published/[siteId]/blogs/[blogSlug]/page.tsx`,
      },
      {
        abs: path.join(
          root,
          "app",
          "published",
          "[siteId]",
          "service",
          "[serviceSlug]",
          "page.tsx",
        ),
        zip: `${folderName}/app/published/[siteId]/service/[serviceSlug]/page.tsx`,
      },
      {
        abs: path.join(
          root,
          "app",
          "published",
          "[siteId]",
          "event",
          "[eventSlug]",
          "page.tsx",
        ),
        zip: `${folderName}/app/published/[siteId]/event/[eventSlug]/page.tsx`,
      },
      {
        abs: path.join(
          root,
          "app",
          "published",
          "[siteId]",
          "property",
          "[propertySlug]",
          "page.tsx",
        ),
        zip: `${folderName}/app/published/[siteId]/property/[propertySlug]/page.tsx`,
      },
      {
        abs: path.join(
          root,
          "app",
          "published",
          "[siteId]",
          "portfolio",
          "[portfolioSlug]",
          "page.tsx",
        ),
        zip: `${folderName}/app/published/[siteId]/portfolio/[portfolioSlug]/page.tsx`,
      },
      {
        abs: path.join(
          root,
          "app",
          "published",
          "[siteId]",
          "team",
          "[teamSlug]",
          "page.tsx",
        ),
        zip: `${folderName}/app/published/[siteId]/team/[teamSlug]/page.tsx`,
      },
      {
        abs: path.join(
          root,
          "app",
          "published",
          "[siteId]",
          "country",
          "[countrySlug]",
          "page.tsx",
        ),
        zip: `${folderName}/app/published/[siteId]/country/[countrySlug]/page.tsx`,
      },
    ],
    files,
  );

  // Only used section variants + shared published deps (no unused layouts / editor).
  const rendererFiles = await collectUsedRendererFiles({
    srcRoot: path.join(root, "app", "editor", "layout", "src"),
    folderName,
    payload: slimPayload,
    templateFlowContent: templateFlowStub(
      payload.templateId || slug,
      websiteType,
    ),
  });
  files.push(...rendererFiles);

  if (options?.extraFiles?.length) {
    files.push(...options.extraFiles);
  }

  return {
    folderName,
    files,
    filename: `${folderName}.zip`,
  };
}
