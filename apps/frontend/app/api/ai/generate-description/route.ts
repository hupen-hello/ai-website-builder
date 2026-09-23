import { NextResponse } from "next/server";
import { generateAiText, hasAnyAiKey } from "@/lib/aiProvider";

export const runtime = "nodejs";

type GenerateBody = {
  name?: string;
  audience?: string;
  websiteRelated?: string;
  pageType?: string;
  existingDescription?: string;
};

function labelAudience(value?: string) {
  if (value === "clients") return "agency / for clients";
  if (value === "myself") return "individual / personal brand";
  if (value === "company") return "company / business";
  return "business";
}

function labelWebsiteRelated(value?: string) {
  switch (value) {
    case "service-provider":
      return "services";
    case "products":
      return "products / ecommerce";
    case "blog":
      return "blog / content";
    case "ngo":
      return "NGO / non-profit";
    case "campaign-page":
      return "campaign / landing page";
    default:
      return "general website";
  }
}

function fallbackDescription(body: GenerateBody) {
  const name = body.name?.trim() || "Our brand";
  const related = labelWebsiteRelated(body.websiteRelated);
  return `${name} helps people discover ${related} with clear messaging, trusted delivery, and a modern online presence. We focus on results that feel simple, professional, and ready to grow.`;
}

function cleanDescription(raw: string) {
  let text = raw.trim();
  text = text.replace(/^```(?:\w+)?\s*([\s\S]*?)```$/u, "$1").trim();
  text = text.replace(/^["'“”]+|["'“”]+$/g, "").trim();
  text = text.replace(/\s+/g, " ").trim();
  if (text.length > 300) {
    text = text.slice(0, 297).replace(/\s+\S*$/, "").trim();
    if (!/[.!?]$/.test(text)) text = `${text}.`;
  }
  return text;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GenerateBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { message: "Enter a website name first so AI can write a better description." },
        { status: 400 },
      );
    }

    if (!hasAnyAiKey()) {
      return NextResponse.json({
        description: fallbackDescription(body),
        fallback: true,
        message:
          "GEMINI_API_KEY missing — used a temporary draft. Add the key in apps/frontend/.env.local and restart.",
      });
    }

    const audience = labelAudience(body.audience);
    const related = labelWebsiteRelated(body.websiteRelated);
    const pageType =
      body.pageType === "multi-page"
        ? "multi-page website"
        : body.pageType === "single-page"
          ? "single-page website"
          : "website";
    const existing =
      typeof body.existingDescription === "string"
        ? body.existingDescription.trim()
        : "";

    const ai = await generateAiText({
      preferProvider: "openai",
      temperature: 0.55,
      maxTokens: 120,
      messages: [
        {
          role: "system",
          content: `You write short website about-business descriptions for an AI website builder onboarding form.
Rules:
- Return ONLY the description text (no quotes, no markdown, no labels).
- 35 to 55 words, absolute max 300 characters.
- Plain, confident, customer-facing English.
- Do not invent fake awards, years, or locations.
- Do not start with "Welcome" or "We are excited".
- Be fast and direct — one paragraph only.`,
        },
        {
          role: "user",
          content: `Write a website description for:
- Name: ${name}
- Built for: ${audience}
- Website focus: ${related}
- Site type: ${pageType}
${existing ? `- Current draft (improve/rewrite): ${existing}` : ""}`,
        },
      ],
    });

    const description =
      cleanDescription(ai.text) || fallbackDescription(body);

    return NextResponse.json({
      description,
      fallback: !ai.text || Boolean(ai.fallbackReason),
      provider: ai.provider,
      message: ai.fallbackReason,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to generate description right now." },
      { status: 500 },
    );
  }
}
