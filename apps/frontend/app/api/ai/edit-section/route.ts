import { NextResponse } from "next/server";
import { hasAnyAiKey } from "@/lib/aiProvider";
import {
  detectCreateAiSectionId,
  extractCreateAiSectionHtml,
  rewriteCreateAiSection,
  type CreateAiSectionId,
} from "@/lib/create-ai-section-edit";
import {
  ensureCreateAiResponsive,
  normalizeCreateAiHeaderBar,
  stripDuplicateContactStrips,
} from "@/lib/create-ai-chrome";

export const runtime = "nodejs";
export const maxDuration = 90;
export const dynamic = "force-dynamic";

type Body = {
  html?: string;
  sectionId?: string;
  currentHTML?: string;
  userInstruction?: string;
  message?: string;
  brandName?: string;
  qualityMode?: "speed" | "quality";
};

/**
 * POST /api/ai/edit-section
 * Surgical section edit — only one <section>/<header>/<footer> goes to the LLM.
 */
export async function POST(req: Request) {
  try {
    if (!hasAnyAiKey()) {
      return NextResponse.json(
        { error: "No AI API key configured (OpenAI / Gemini)." },
        { status: 503 },
      );
    }

    const body = (await req.json()) as Body;
    const pageHtml = (body.html || "").trim();
    const instruction = (
      body.userInstruction ||
      body.message ||
      ""
    ).trim();
    const brandName = (body.brandName || "Brand").trim() || "Brand";
    const qualityMode =
      body.qualityMode === "quality" ? "quality" : "speed";

    if (!instruction) {
      return NextResponse.json(
        { error: "userInstruction required" },
        { status: 400 },
      );
    }

    let sectionId = (body.sectionId || "").trim().toLowerCase() as
      | CreateAiSectionId
      | "";
    if (!sectionId) {
      sectionId = (detectCreateAiSectionId(instruction) || "") as
        | CreateAiSectionId
        | "";
    }
    if (!sectionId || sectionId === "global") {
      return NextResponse.json(
        {
          error:
            "Could not detect a target section. Pass sectionId (home|about|services|gallery|…) or name it in the instruction.",
          sectionId: sectionId || null,
        },
        { status: 400 },
      );
    }

    // Prefer full page HTML; else wrap lone section fragment
    let working = pageHtml;
    if (!working && body.currentHTML) {
      working = `<!DOCTYPE html><html><body>${body.currentHTML}</body></html>`;
    }
    if (!working) {
      return NextResponse.json(
        { error: "html (full page) or currentHTML (section) required" },
        { status: 400 },
      );
    }

    // If client sent only the section, ensure it exists under the id
    if (
      body.currentHTML &&
      !extractCreateAiSectionHtml(working, sectionId as CreateAiSectionId)
    ) {
      working = `<!DOCTYPE html><html><body>${body.currentHTML}</body></html>`;
    }

    const result = await rewriteCreateAiSection({
      pageHtml: working,
      message: instruction,
      brandName,
      qualityMode,
      sectionId: sectionId as CreateAiSectionId,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.reason || "section-edit-failed",
          sectionId: result.sectionId,
          provider: result.provider,
        },
        { status: 422 },
      );
    }

    let next = stripDuplicateContactStrips(
      normalizeCreateAiHeaderBar(ensureCreateAiResponsive(result.html)),
    );
    const updated =
      extractCreateAiSectionHtml(next, result.sectionId)?.html || "";

    return NextResponse.json({
      html: next,
      updatedHTML: updated,
      sectionId: result.sectionId,
      provider: result.provider,
      model: result.model,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "edit-section failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
