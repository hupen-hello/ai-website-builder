import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { getBackendUrl, USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  buildCreateAiNextjsExport,
  readCreateAiPagesFromPayload,
} from "@/lib/exportCreateAiNextjs";
import { consumeExportDownloadOnServer } from "@/lib/exportEntitlementServer";
import {
  assetsToZipEntries,
  collectExportAssets,
  rewriteMediaUrls,
} from "@/lib/exportPublishedAssets";
import {
  buildPublishedParityNextjsExport,
  getPublishedExportFolderName,
} from "@/lib/exportPublishedParityNextjs";
import { slimPublishedPayloadForExport } from "@/lib/exportUsedRenderer";
import type { PublishedSitePayload } from "@/lib/publishedSeo";
import { normalizeSiteSeoConfig } from "@/lib/siteSeo";
import { buildZipStore } from "@/lib/zipStore";

async function getUserToken() {
  const cookieStore = await cookies();
  return cookieStore.get(USER_TOKEN_COOKIE)?.value;
}

async function resolveOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") || "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

function asPublishedPayload(
  value: unknown,
  fallbackSlug: string,
): PublishedSitePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.sections) && !raw.createAiSite) return null;

  return {
    id:
      (typeof raw.id === "string" && raw.id) ||
      (typeof raw.slug === "string" && raw.slug) ||
      fallbackSlug,
    title: typeof raw.title === "string" ? raw.title : fallbackSlug,
    slug:
      (typeof raw.slug === "string" && raw.slug) ||
      (typeof raw.id === "string" && raw.id) ||
      fallbackSlug,
    templateId:
      typeof raw.templateId === "string" ? raw.templateId : "template-1",
    category: typeof raw.category === "string" ? raw.category : "Business",
    pageLinks: Array.isArray(raw.pageLinks)
      ? (raw.pageLinks as PublishedSitePayload["pageLinks"])
      : [],
    sections: Array.isArray(raw.sections)
      ? (raw.sections as PublishedSitePayload["sections"])
      : [],
    templateVariables:
      raw.templateVariables &&
      typeof raw.templateVariables === "object" &&
      !Array.isArray(raw.templateVariables)
        ? (raw.templateVariables as Record<string, string>)
        : {},
    businessInfo:
      (raw.businessInfo as PublishedSitePayload["businessInfo"]) ?? null,
    seo: raw.seo
      ? (normalizeSiteSeoConfig(raw.seo) as PublishedSitePayload["seo"])
      : null,
    publishedAt:
      typeof raw.publishedAt === "string"
        ? raw.publishedAt
        : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    ...(typeof raw.createPath === "string" ? { createPath: raw.createPath } : {}),
    ...(raw.createAiSite && typeof raw.createAiSite === "object"
      ? { createAiSite: raw.createAiSite }
      : {}),
  } as PublishedSitePayload;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = await getUserToken();
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  try {
    const detailRes = await fetch(`${getBackendUrl()}/sites/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const detail = (await detailRes.json().catch(() => ({}))) as {
      message?: string;
      published?: boolean;
      slug?: string;
      title?: string;
      status?: string;
    };

    if (!detailRes.ok) {
      return NextResponse.json(
        { message: detail.message || "Site not found" },
        { status: detailRes.status },
      );
    }

    if (!detail.published || !detail.slug) {
      return NextResponse.json(
        {
          message:
            "Only published websites can be exported. Publish this site first.",
        },
        { status: 400 },
      );
    }

    const consumed = await consumeExportDownloadOnServer(token, id, "nextjs");
    if (!consumed) {
      return NextResponse.json(
        {
          message:
            "Next.js export requires payment. Purchase export access (₹4,500) for up to 5 downloads.",
        },
        { status: 402 },
      );
    }

    const publicRes = await fetch(
      `${getBackendUrl()}/sites/public/${detail.slug}`,
      { cache: "no-store" },
    );
    const publicData = await publicRes.json().catch(() => null);

    if (!publicRes.ok) {
      return NextResponse.json(
        {
          message:
            "Published site data was not found. Republish the website and try again.",
        },
        { status: 404 },
      );
    }

    const payload = asPublishedPayload(publicData, detail.slug);
    if (!payload) {
      return NextResponse.json(
        { message: "Published site payload is invalid" },
        { status: 500 },
      );
    }

    if (!payload.title && detail.title) {
      payload.title = detail.title;
    }

    const origin = await resolveOrigin();
    const folderName = getPublishedExportFolderName(
      payload.slug || detail.slug || "website",
    );

    // Create-with-AI: lean HTML-only Next.js package (no Custom renderer / unused sections).
    const createAiPages = readCreateAiPagesFromPayload(publicData);
    if (createAiPages.length) {
      const biz = (publicData as { businessInfo?: Record<string, string> })
        ?.businessInfo;
      const exported = await buildCreateAiNextjsExport({
        title: payload.title || detail.title || detail.slug || "website",
        slug: payload.slug || detail.slug || "website",
        pages: createAiPages,
        brandName: payload.title || detail.title || undefined,
        contact: {
          email: biz?.email,
          mobile: biz?.mobile || biz?.phone,
          address: biz?.address,
        },
      });
      const zipBytes = buildZipStore(exported.files);
      return new NextResponse(Buffer.from(zipBytes), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${exported.filename}"`,
          "Cache-Control": "no-store",
          "X-Export-Image-Count": "0",
          "X-Export-Downloads-Remaining": String(consumed.downloadsRemaining),
          "X-Export-Kind": "create-ai-components",
        },
      });
    }

    const slimPayload = slimPublishedPayloadForExport(payload);

    const { assets, urlMap } = await collectExportAssets({
      payload: slimPayload,
      origin,
      folderName,
      fallbackOrigins: [getBackendUrl()],
    });

    const rewrittenPayload = rewriteMediaUrls(slimPayload, urlMap);
    const exported = await buildPublishedParityNextjsExport(rewrittenPayload, {
      extraFiles: assetsToZipEntries(assets),
      imageCount: assets.length,
    });
    const zipBytes = buildZipStore(exported.files);

    return new NextResponse(Buffer.from(zipBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${exported.filename}"`,
        "Cache-Control": "no-store",
        "X-Export-Image-Count": String(assets.length),
        "X-Export-Downloads-Remaining": String(consumed.downloadsRemaining),
      },
    });
  } catch (error) {
    console.error("export-nextjs failed", error);
    return NextResponse.json(
      { message: "Unable to export website" },
      { status: 500 },
    );
  }
}
