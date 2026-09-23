import { NextResponse } from "next/server";
import { generateAiText, hasAnyAiKey } from "@/lib/aiProvider";

export const runtime = "nodejs";

type GenerateVisionBody = {
  name?: string;
  domainUrl?: string;
  referenceUrl?: string;
  audience?: string;
  existingVision?: string;
};

function labelAudience(value?: string) {
  if (value === "clients") return "agency / for clients";
  if (value === "myself") return "individual / personal brand";
  if (value === "company") return "company / business";
  return "business";
}

function fallbackVision(body: GenerateVisionBody) {
  const name = body.name?.trim() || "this business";
  const domain = body.domainUrl?.trim();
  const reference = body.referenceUrl?.trim();
  return [
    `Create a modern, conversion-focused website for ${name}`,
    domain ? `using content inspired by ${domain}` : "",
    reference ? `and a visual style similar to ${reference}` : "",
    "with a clear brand story, strong calls to action, and an easy path for visitors to get in touch.",
  ]
    .filter(Boolean)
    .join(" ");
}

function cleanVision(raw: string) {
  let text = raw.trim();
  text = text.replace(/^```(?:\w+)?\s*([\s\S]*?)```$/u, "$1").trim();
  text = text.replace(/^["'“”]+|["'“”]+$/g, "").trim();
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  if (text.length > 800) {
    text = text.slice(0, 797).replace(/\s+\S*$/, "").trim();
    if (!/[.!?]$/.test(text)) text = `${text}.`;
  }
  return text;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GenerateVisionBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const domainUrl =
      typeof body.domainUrl === "string" ? body.domainUrl.trim() : "";
    const referenceUrl =
      typeof body.referenceUrl === "string" ? body.referenceUrl.trim() : "";

    if (!name && !domainUrl) {
      return NextResponse.json(
        {
          message:
            "Enter a client/business name or domain link first, then generate.",
        },
        { status: 400 },
      );
    }

    if (!hasAnyAiKey()) {
      return NextResponse.json({
        vision: fallbackVision(body),
        fallback: true,
        message:
          "GEMINI_API_KEY missing — used a temporary draft. Add the key in apps/frontend/.env.local and restart.",
      });
    }

    const audience = labelAudience(body.audience);
    const existing =
      typeof body.existingVision === "string" ? body.existingVision.trim() : "";

    const ai = await generateAiText({
      temperature: 0.7,
      maxTokens: 400,
      messages: [
        {
          role: "system",
          content: `You write redesign vision briefs for an AI website builder.
Rules:
- Return ONLY the vision text (no quotes, no markdown, no labels).
- 2 to 4 short sentences, absolute max 800 characters.
- Describe goals, tone, audience, and what success looks like.
- Do not invent fake awards, years, or locations.`,
        },
        {
          role: "user",
          content: `Write a website redesign vision for:
- Name: ${name || "the business"}
- Built for: ${audience}
${domainUrl ? `- Existing site / content source: ${domainUrl}` : ""}
${referenceUrl ? `- Reference design style: ${referenceUrl}` : ""}
${existing ? `- Current draft (improve/rewrite): ${existing}` : ""}`,
        },
      ],
    });

    const vision = cleanVision(ai.text) || fallbackVision(body);

    return NextResponse.json({
      vision,
      fallback: !ai.text || Boolean(ai.fallbackReason),
      tokensUsed: ai.tokensUsed,
      provider: ai.provider,
      message: ai.fallbackReason,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to generate vision right now." },
      { status: 500 },
    );
  }
}
