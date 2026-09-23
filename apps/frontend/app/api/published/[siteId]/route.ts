import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend";
import { normalizeSiteSeoConfig } from "@/lib/siteSeo";

const publishedSitesDir = path.join(
  /*turbopackIgnore: true*/ process.cwd(),
  "data",
  "published-sites",
);

function enrichSeo(payload: Record<string, unknown>) {
  const seoConfig = normalizeSiteSeoConfig(payload.seo);
  const home = seoConfig.pages?.home;
  return {
    ...payload,
    // Surface Home page SEO at the top level so older resolvers still work.
    seo: {
      ...seoConfig,
      metaTitle: home?.metaTitle || seoConfig.metaTitle || "",
      metaDescription:
        home?.metaDescription || seoConfig.metaDescription || "",
      metaKeywords: home?.metaKeywords || seoConfig.metaKeywords || "",
      ogTitle: home?.ogTitle || seoConfig.ogTitle || "",
      ogDescription: home?.ogDescription || seoConfig.ogDescription || "",
      ogImage: home?.ogImage || seoConfig.ogImage || "",
    },
  };
}

async function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const candidates = [
    path.join(/*turbopackIgnore: true*/ process.cwd(), ".env"),
    path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      "apps",
      "backend",
      ".env",
    ),
    path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      "..",
      "backend",
      ".env",
    ),
    path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      "../../apps/backend/.env",
    ),
  ];

  for (const envPath of candidates) {
    try {
      const text = await readFile(
        /*turbopackIgnore: true*/ envPath,
        "utf8",
      );
      const match = text.match(/DATABASE_URL=(?:"([^"]+)"|([^\s#]+))/);
      const value = match?.[1] || match?.[2];
      if (value) return value;
    } catch {
      /* try next */
    }
  }

  return null;
}

async function loadSeoFromDatabase(slug: string) {
  try {
    const databaseUrl = await loadDatabaseUrl();
    if (!databaseUrl) return null;

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    try {
      const site = await prisma.site.findFirst({
        where: { slug, published: true },
        select: { title: true, category: true, config: true },
      });
      if (!site) return null;
      const config =
        site.config && typeof site.config === "object" && !Array.isArray(site.config)
          ? (site.config as Record<string, unknown>)
          : {};
      return {
        title: site.title,
        category: site.category,
        businessInfo: config.businessInfo ?? null,
        seo: config.seo ?? null,
      };
    } finally {
      await prisma.$disconnect();
    }
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  const { siteId } = await params;

  if (!/^[a-z0-9-]+$/i.test(siteId)) {
    return NextResponse.json(
      { error: "Invalid published site URL." },
      { status: 400 },
    );
  }

  let payload: Record<string, unknown> | null = null;

  try {
    const dbRes = await fetch(`${getBackendUrl()}/sites/public/${siteId}`, {
      cache: "no-store",
    });
    if (dbRes.ok) {
      payload = (await dbRes.json()) as Record<string, unknown>;
    }
  } catch {
    /* fallback below */
  }

  if (!payload) {
    try {
      const filePayload = await readFile(
        path.join(publishedSitesDir, `${siteId}.json`),
        "utf8",
      );
      payload = JSON.parse(filePayload) as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    return NextResponse.json(
      { error: "Published site not found." },
      { status: 404 },
    );
  }

  // Always merge SEO/title from Postgres so published <title> stays correct
  // even when an older Nest build omits seo from the public API.
  const fromDb = await loadSeoFromDatabase(siteId);
  if (fromDb) {
    payload = {
      ...payload,
      title: fromDb.title || payload.title,
      category: fromDb.category || payload.category,
      businessInfo: fromDb.businessInfo ?? payload.businessInfo ?? null,
      seo: fromDb.seo ?? payload.seo ?? null,
    };
  }

  return NextResponse.json(enrichSeo(payload));
}
