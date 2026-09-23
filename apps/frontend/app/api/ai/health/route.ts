import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Safe Claude connectivity check — never returns full API key.
 */
export async function GET() {
  const apiKey =
    process.env.ANTHROPIC_API_KEY?.trim() ||
    process.env.CLAUDE_API_KEY?.trim() ||
    "";
  const model =
    process.env.ANTHROPIC_MODEL?.trim() ||
    process.env.CLAUDE_MODEL?.trim() ||
    "claude-opus-5";

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      anthropicConfigured: false,
      model,
      error: "ANTHROPIC_API_KEY missing in apps/frontend/.env.local",
    });
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 32,
      messages: [{ role: "user", content: 'Reply with exactly: {"ping":"ok"}' }],
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    content?: Array<{ type?: string; text?: string }>;
    error?: { type?: string; message?: string };
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const text =
    data.content
      ?.filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("")
      .trim() || "";

  return NextResponse.json({
    ok: response.ok && Boolean(text),
    anthropicConfigured: true,
    model,
    httpStatus: response.status,
    error: data.error?.message || (response.ok ? null : `HTTP ${response.status}`),
    errorType: data.error?.type || null,
    sample: text ? text.slice(0, 80) : null,
    tokensUsed:
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  });
}
