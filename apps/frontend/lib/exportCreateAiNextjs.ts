import {
  ensureCreateAiInnerPageLayout,
  normalizeCreateAiStudioNav,
  polishCreateAiExportHtml,
  rewriteCreateAiZipPageLinks,
} from "@/lib/create-ai-chrome";
import { stripCreateAiEditChrome } from "@/lib/create-ai-edit-mode";
import {
  buildComponentTsx,
  buildPageTsx,
  buildSiteScriptsTsx,
  splitCreateAiHtmlDocument,
} from "@/lib/exportCreateAiHtmlToComponents";
import type { ZipFileEntry } from "@/lib/zipStore";

export type CreateAiExportPage = {
  id: string;
  label: string;
  html: string;
};

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

function jsonPretty(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Strip studio/edit/chat junk — keep real links for paid export. */
export function sanitizeCreateAiHtmlForPaidExport(
  html: string,
  brandName?: string,
  opts?: {
    homeSections?: string[];
    address?: string;
    email?: string;
    mobile?: string;
  },
) {
  if (!html) return html;
  let out = polishCreateAiExportHtml(html, brandName, opts);
  out = stripCreateAiEditChrome(out);
  out = out.replace(
    /<script\b[^>]*(?:tawk|crisp|intercom|tidio|zendesk|hubspot|drift|facebook\.net\/.*customerchat|chatbot|chat-widget|wchat|smartsupp|livechat|jivosite)[^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(
    /<script\b[^>]*>[\s\S]*?(?:tawk\.to|crisp\.chat|intercom\.io|tidio\.co|zendesk|drift\.com|facebook\.com\/.*customer_chat|chatwoot|localhost:\d+|\/api\/ai\/)[\s\S]*?<\/script>/gi,
    "",
  );
  out = out.replace(
    /<(div|aside|iframe|button)\b[^>]*(?:tawk|crisp|intercom|tidio|chat-widget|fb-customerchat|jivo|data-cai-edit-chrome)[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );
  out = out.replace(/\scontenteditable=(["'])[^"']*\1/gi, "");
  out = out.replace(/\sdata-cai-edit(?:-[a-z0-9_-]+)?=(["'])[^"']*\1/gi, "");
  out = out.replace(/\sdata-cai-edit-hover=(["'])[^"']*\1/gi, "");
  out = out.replace(/\sdraggable=(["'])[^"']*\1/gi, "");
  out = out.replace(/<!--\s*lestow[\s\S]*?-->/gi, "");
  out = out.replace(/https?:\/\/localhost:\d+/gi, "");
  return out;
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

function readme(siteTitle: string, componentNames: string[], pageLabels: string[]) {
  return `# ${siteTitle}

Create with AI → **real Next.js components** (export-only split).

Studio/chat still generate HTML; this ZIP converts that HTML into React components.

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000

## Pages

${pageLabels.map((l) => `- ${l}`).join("\n")}

## Components

${componentNames.map((n) => `- \`components/${n}.tsx\``).join("\n")}

## Structure

- \`app/page.tsx\` — composes components
- \`components/*.tsx\` — Header, Hero, About, …
- \`app/globals.css\` — extracted site CSS
- \`content/*.html\` — original polished HTML (reference)
`;
}

/**
 * Next.js ZIP for Create-with-AI: HTML split into React components (Option A).
 */
export async function buildCreateAiNextjsExport(opts: {
  title: string;
  slug: string;
  pages: CreateAiExportPage[];
  brandName?: string;
  contact?: { email?: string; mobile?: string; address?: string };
}): Promise<{ folderName: string; files: ZipFileEntry[]; filename: string }> {
  const title = opts.title.trim() || opts.slug || "website";
  const slug = opts.slug || "website";
  const folderName = safeFolderName(slug);
  const brandName = (opts.brandName || title).trim() || "Brand";
  const navPages = opts.pages.map((p) => ({
    id: p.id || "home",
    label: p.label || "Page",
  }));

  const cleaned = opts.pages.map((page) => {
    const id = page.id || "home";
    let html = page.html || "";
    html = normalizeCreateAiStudioNav(html, navPages, id);
    if (id !== "home") {
      html = ensureCreateAiInnerPageLayout(html, {
        brandName,
        pageLabel: page.label || id,
        pageId: id,
      });
    }
    html = sanitizeCreateAiHtmlForPaidExport(html, brandName, {
      email: opts.contact?.email,
      mobile: opts.contact?.mobile,
      address: opts.contact?.address,
    });
    html = rewriteCreateAiZipPageLinks(html, navPages);
    html = html.replace(/\bhref=(["'])index\.html\1/gi, 'href="/"');
    html = html.replace(/\bhref=(["'])([a-z0-9_-]+)\.html\1/gi, 'href="/$2"');
    const file =
      id === "home"
        ? "index.html"
        : `${id.replace(/[^a-z0-9_-]/gi, "") || "page"}.html`;
    return { id, label: page.label || id, file, html };
  });

  const home =
    cleaned.find((p) => p.id === "home") || cleaned[0];
  if (!home) {
    throw new Error("No Create-AI pages to export");
  }

  const split = splitCreateAiHtmlDocument(home.html);
  const allCss = [split.css];
  const allFonts = [...split.fontLinks];
  const allScripts = [...split.scripts];

  // Inner pages → one component each (PageAbout, …) so multipage still works
  const innerPageComponents: Array<{
    id: string;
    label: string;
    name: string;
  }> = [];

  for (const page of cleaned) {
    if (page.id === home.id) continue;
    const pageSplit = splitCreateAiHtmlDocument(page.html);
    if (pageSplit.css) allCss.push(pageSplit.css);
    allFonts.push(...pageSplit.fontLinks);
    allScripts.push(...pageSplit.scripts);
    const name = `Page${page.id
      .replace(/(^|[-_])([a-z])/gi, (_m, _a, c: string) => c.toUpperCase())
      .replace(/[^a-zA-Z0-9]/g, "") || "Inner"}`;
    // Prefer composing from page body parts if many; else single component
    const combinedHtml = pageSplit.parts.map((p) => p.html).join("\n");
    innerPageComponents.push({
      id: page.id,
      label: page.label,
      name,
    });
    // stash html on object via parallel array — rebuild below
    (innerPageComponents[innerPageComponents.length - 1] as {
      html?: string;
    }).html = combinedHtml || page.html;
  }

  const files: ZipFileEntry[] = [
    { path: `${folderName}/package.json`, content: packageJson(title) },
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
  ];

  // Reference HTML copies
  for (const page of cleaned) {
    files.push({
      path: `${folderName}/content/${page.file}`,
      content: page.html,
    });
  }

  // Home components
  const homeNames = split.parts.map((p) => p.name);
  for (const part of split.parts) {
    files.push({
      path: `${folderName}/components/${part.name}.tsx`,
      content: buildComponentTsx(part.name, part.html),
    });
  }

  // Inner page components
  for (const page of innerPageComponents) {
    const html = (page as { html?: string }).html || "";
    files.push({
      path: `${folderName}/components/${page.name}.tsx`,
      content: buildComponentTsx(page.name, html),
    });
  }

  const hasScripts = allScripts.length > 0;
  files.push({
    path: `${folderName}/components/SiteScripts.tsx`,
    content: buildSiteScriptsTsx(allScripts),
  });

  files.push({
    path: `${folderName}/app/globals.css`,
    content:
      `/* Extracted from Create-with-AI HTML */\n` +
      `html, body { margin: 0; padding: 0; }\n\n` +
      allCss.filter(Boolean).join("\n\n") +
      "\n",
  });

  const uniqueFonts = Array.from(new Set(allFonts));
  const fontLinksJsx = uniqueFonts
    .map((tag) => {
      const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
      if (!href) return "";
      return `        <link rel="stylesheet" href=${JSON.stringify(href)} />`;
    })
    .filter(Boolean)
    .join("\n");

  files.push({
    path: `${folderName}/app/layout.tsx`,
    content: `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(split.title || title)},
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
${fontLinksJsx || "        {/* fonts */}"}
      </head>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
`,
  });

  files.push({
    path: `${folderName}/app/page.tsx`,
    content: buildPageTsx({
      componentNames: homeNames,
      includeScripts: hasScripts,
    }),
  });

  for (const page of innerPageComponents) {
    const route = page.id.replace(/[^a-z0-9_-]/gi, "") || "page";
    files.push({
      path: `${folderName}/app/${route}/page.tsx`,
      content: `import ${page.name} from "@/components/${page.name}";
import SiteScripts from "@/components/SiteScripts";

export default function ${page.name}Route() {
  return (
    <>
      <${page.name} />
      <SiteScripts />
    </>
  );
}
`,
    });
  }

  const allComponentNames = [
    ...homeNames,
    ...innerPageComponents.map((p) => p.name),
    "SiteScripts",
  ];

  files.push({
    path: `${folderName}/README.md`,
    content: readme(
      title,
      allComponentNames,
      cleaned.map((p) => p.label),
    ),
  });

  return {
    folderName,
    files,
    filename: `${folderName}.zip`,
  };
}

export function readCreateAiPagesFromPayload(payload: unknown): CreateAiExportPage[] {
  if (!payload || typeof payload !== "object") return [];
  const raw = payload as {
    createAiSite?: {
      pages?: Array<{ id?: string; label?: string; html?: string }>;
    } | null;
  };
  const pages = raw.createAiSite?.pages;
  if (!Array.isArray(pages)) return [];
  return pages
    .map((p) => ({
      id: String(p?.id || "home").trim() || "home",
      label: String(p?.label || p?.id || "Page").trim() || "Page",
      html: typeof p?.html === "string" ? p.html : "",
    }))
    .filter((p) => p.html.trim().length > 80);
}
