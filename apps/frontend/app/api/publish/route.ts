import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const publishedSitesDir = path.join(process.cwd(), "data", "published-sites");
const fallbackPublishBaseUrl = "https://preview.cssfounder.com";

const getPublishBaseUrl = (request: Request) => {
  const configuredBaseUrl =
    process.env.NEXT_PUBLIC_PUBLISH_BASE_URL || process.env.PUBLISH_BASE_URL;

  if (configuredBaseUrl) return configuredBaseUrl.replace(/\/$/, "");

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (
    forwardedProto &&
    forwardedHost &&
    !["localhost", "127.0.0.1", "0.0.0.0"].includes(forwardedHost.split(":")[0])
  ) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const requestUrl = new URL(request.url);

  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(requestUrl.hostname)) {
    return fallbackPublishBaseUrl;
  }

  return requestUrl.origin;
};

const createPublishedId = (templateId?: string, category?: string) => {
  const base = `${templateId || "template"}-${category || "site"}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base}-${randomUUID().slice(0, 8)}`;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      templateId?: string;
      category?: string;
      pageLinks?: unknown[];
      sections?: unknown[];
      templateVariables?: Record<string, string>;
    };

    if (!Array.isArray(body.sections) || !body.sections.length) {
      return NextResponse.json(
        { error: "Sections are required to publish a site." },
        { status: 400 },
      );
    }

    const id = createPublishedId(body.templateId, body.category);
    const payload = {
      id,
      templateId: body.templateId ?? "template-1",
      category: body.category ?? "Template",
      pageLinks: body.pageLinks ?? [],
      sections: body.sections,
      templateVariables: body.templateVariables ?? {},
      publishedAt: new Date().toISOString(),
    };

    await mkdir(publishedSitesDir, { recursive: true });
    await writeFile(
      path.join(publishedSitesDir, `${id}.json`),
      JSON.stringify(payload, null, 2),
      "utf8",
    );

    const publishedPath = `/published/${id}`;

    return NextResponse.json({
      id,
      path: publishedPath,
      url: `${getPublishBaseUrl(request)}${publishedPath}`,
    });
  } catch (error) {
    console.error("Publish failed", error);

    return NextResponse.json(
      { error: "Unable to publish this site." },
      { status: 500 },
    );
  }
}
