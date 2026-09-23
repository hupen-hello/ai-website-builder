import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ManagerKind =
  | "service"
  | "blog"
  | "portfolio"
  | "event"
  | "team"
  | "gallery"
  | "country";

type ItemContext = {
  title?: string;
  desc?: string;
  content?: string;
  category?: string;
  author?: string;
};

type GenerateBody = {
  kind?: ManagerKind;
  field?: "summary" | "content" | "seo";
  item?: ItemContext;
  existing?: string;
};

const KIND_LABEL: Record<ManagerKind, string> = {
  service: "service offering",
  blog: "blog post",
  portfolio: "portfolio project",
  event: "event",
  team: "team member profile",
  gallery: "gallery photo",
  country: "country service listing",
};

function cleanText(raw: string, maxLen?: number) {
  let text = raw.trim();
  text = text.replace(/^```(?:\w+)?\s*([\s\S]*?)```$/u, "$1").trim();
  text = text.replace(/^["'""]+|["'""]+$/g, "").trim();
  text = text.replace(/\s+/g, " ").trim();
  if (maxLen && text.length > maxLen) {
    text = text.slice(0, maxLen - 1).replace(/\s+\S*$/, "").trim();
    if (!/[.!?]$/.test(text)) text = `${text}.`;
  }
  return text;
}

function fallbackSummary(kind: ManagerKind, item: ItemContext) {
  const title = item.title?.trim() || "This item";
  const category = item.category?.trim();
  return `${title}${category ? ` is a ${category}` : ""} ${KIND_LABEL[kind]} with clear, professional messaging for your website visitors.`;
}

function fallbackContent(kind: ManagerKind, item: ItemContext) {
  const title = item.title?.trim() || "Overview";
  const summary = item.desc?.trim() || fallbackSummary(kind, item);
  return `<h2>Overview</h2><p>${summary}</p><h2>Why it matters</h2><p>${title} helps visitors understand what you offer and why they should take the next step.</p><h2>Next steps</h2><p>Reach out to learn more, ask questions, or get started today.</p>`;
}

function fallbackSeo(kind: ManagerKind, item: ItemContext) {
  const title = item.title?.trim() || KIND_LABEL[kind];
  const desc = item.desc?.trim() || fallbackSummary(kind, item);
  const keywords = [item.category, kind, item.author].filter(Boolean).join(", ");
  return {
    seoTitle: title.slice(0, 60),
    seoDescription: desc.slice(0, 155),
    seoKeywords: keywords.slice(0, 120),
  };
}

async function callOpenAi(
  apiKey: string,
  model: string,
  messages: Array<{ role: "system" | "user"; content: string }>,
  maxTokens: number,
  json = false,
) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.75,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI request failed");
  }
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as GenerateBody;
    const kind = body.kind;
    const field = body.field;
    const item = body.item || {};
    const title = item.title?.trim();

    if (!kind || !KIND_LABEL[kind]) {
      return NextResponse.json({ message: "Invalid kind." }, { status: 400 });
    }
    if (!field || !["summary", "content", "seo"].includes(field)) {
      return NextResponse.json({ message: "Invalid field." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json(
        { message: "Enter a title first so AI can write better copy." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
    const label = KIND_LABEL[kind];

    if (!apiKey) {
      if (field === "summary") {
        return NextResponse.json({
          text: fallbackSummary(kind, item),
          fallback: true,
        });
      }
      if (field === "content") {
        return NextResponse.json({
          text: fallbackContent(kind, item),
          fallback: true,
        });
      }
      return NextResponse.json({ ...fallbackSeo(kind, item), fallback: true });
    }

    const context = JSON.stringify({
      kind: label,
      title,
      shortSummary: item.desc || null,
      fullContent: item.content || null,
      category: item.category || null,
      author: item.author || null,
      existingDraft: body.existing?.trim() || null,
    });

    if (field === "summary") {
      const raw = await callOpenAi(
        apiKey,
        model,
        [
          {
            role: "system",
            content: `You write short website card summaries for a ${label}. Return ONLY plain text (no markdown, no quotes). 1-2 sentences, max 240 characters. Do not invent fake awards or locations.`,
          },
          {
            role: "user",
            content: `Write a fresh short summary:\n${context}`,
          },
        ],
        120,
      );
      return NextResponse.json({
        text: cleanText(raw, 240) || fallbackSummary(kind, item),
        fallback: false,
      });
    }

    if (field === "content") {
      const raw = await callOpenAi(
        apiKey,
        model,
        [
          {
            role: "system",
            content: `You write ${label} detail page copy in HTML. Return ONLY HTML using <h2> headings (3-5 words) and <p> paragraphs. Include 3-4 sections. About 120-180 words. No markdown.`,
          },
          {
            role: "user",
            content: `Write full details:\n${context}`,
          },
        ],
        900,
      );
      return NextResponse.json({
        text: raw.includes("<") ? raw : fallbackContent(kind, item),
        fallback: false,
      });
    }

    const raw = await callOpenAi(
      apiKey,
      model,
      [
        {
          role: "system",
          content:
            'Return JSON only: {"seoTitle":"","seoDescription":"","seoKeywords":""}. SEO title max 60 chars. Description max 155 chars. Keywords comma-separated.',
        },
        {
          role: "user",
          content: `Write SEO meta for this ${label}:\n${context}`,
        },
      ],
      220,
      true,
    );

    try {
      const parsed = JSON.parse(raw) as {
        seoTitle?: string;
        seoDescription?: string;
        seoKeywords?: string;
      };
      const fallback = fallbackSeo(kind, item);
      return NextResponse.json({
        seoTitle: cleanText(parsed.seoTitle || "", 60) || fallback.seoTitle,
        seoDescription:
          cleanText(parsed.seoDescription || "", 155) ||
          fallback.seoDescription,
        seoKeywords:
          cleanText(parsed.seoKeywords || "", 120) || fallback.seoKeywords,
        fallback: false,
      });
    } catch {
      return NextResponse.json({ ...fallbackSeo(kind, item), fallback: true });
    }
  } catch {
    return NextResponse.json(
      { message: "Unable to generate copy right now." },
      { status: 500 },
    );
  }
}
