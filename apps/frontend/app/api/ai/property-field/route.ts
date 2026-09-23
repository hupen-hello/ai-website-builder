import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PropertyContext = {
  title?: string;
  desc?: string;
  content?: string;
  price?: string;
  address?: string;
  bedrooms?: string;
  bathrooms?: string;
  areaSqft?: string;
  propertyType?: string;
  listingType?: string;
  subtitle?: string;
  statusText?: string;
  amenities?: string[];
};

type GenerateBody = {
  field?: "summary" | "content" | "seo";
  property?: PropertyContext;
  existing?: string;
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

function fallbackSummary(property: PropertyContext) {
  const title = property.title?.trim() || "This property";
  const beds = property.bedrooms?.trim();
  const baths = property.bathrooms?.trim();
  const area = property.areaSqft?.trim();
  const location = property.address?.trim();
  const specs = [beds && `${beds} bed`, baths && `${baths} bath`, area && `${area} sqft`]
    .filter(Boolean)
    .join(", ");
  return `${title}${specs ? ` offers ${specs}` : ""}${location ? ` in ${location}` : ""}. A well-planned home with practical layouts and everyday comfort.`;
}

function fallbackContent(property: PropertyContext) {
  const title = property.title?.trim() || "Property overview";
  const summary = property.desc?.trim() || fallbackSummary(property);
  return `<h2>Overview</h2><p>${summary}</p><h2>Layout and comfort</h2><p>${title} is designed for comfortable daily living with bright rooms, sensible storage, and a layout that feels easy to settle into.</p><h2>Location and lifestyle</h2><p>${property.address?.trim() ? `Located in ${property.address.trim()}, ` : ""}residents benefit from convenient access to schools, markets, and city connections.</p>`;
}

function fallbackSeo(property: PropertyContext) {
  const title = property.title?.trim() || "Property listing";
  const desc = property.desc?.trim() || fallbackSummary(property);
  const keywords = [
    property.propertyType,
    property.listingType === "rent" ? "for rent" : "for sale",
    property.bedrooms && `${property.bedrooms} bedroom`,
    property.address?.split(",")[0]?.trim(),
  ]
    .filter(Boolean)
    .join(", ");
  return {
    seoTitle: `${title}${property.price ? ` | ${property.price}` : ""}`.slice(0, 60),
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
    const field = body.field;
    const property = body.property || {};
    const title = property.title?.trim();

    if (!field || !["summary", "content", "seo"].includes(field)) {
      return NextResponse.json({ message: "Invalid field." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json(
        { message: "Enter a property title first so AI can write better copy." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

    if (!apiKey) {
      if (field === "summary") {
        return NextResponse.json({
          text: fallbackSummary(property),
          fallback: true,
        });
      }
      if (field === "content") {
        return NextResponse.json({
          text: fallbackContent(property),
          fallback: true,
        });
      }
      return NextResponse.json({
        ...fallbackSeo(property),
        fallback: true,
      });
    }

    const context = JSON.stringify({
      title,
      shortSummary: property.desc || null,
      fullContent: property.content || null,
      price: property.price || null,
      address: property.address || null,
      bedrooms: property.bedrooms || null,
      bathrooms: property.bathrooms || null,
      areaSqft: property.areaSqft || null,
      propertyType: property.propertyType || null,
      listingType: property.listingType || null,
      subtitle: property.subtitle || null,
      statusText: property.statusText || null,
      amenities: property.amenities || [],
      existingDraft: body.existing?.trim() || null,
    });

    if (field === "summary") {
      const raw = await callOpenAi(
        apiKey,
        model,
        [
          {
            role: "system",
            content:
              "You write short real-estate listing card summaries. Return ONLY plain text (no markdown, no quotes). 1-2 sentences, max 220 characters. Do not invent fake awards or exact distances.",
          },
          {
            role: "user",
            content: `Write a fresh short summary for this property:\n${context}`,
          },
        ],
        120,
      );
      return NextResponse.json({
        text: cleanText(raw, 220) || fallbackSummary(property),
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
            content:
              "You write real-estate property detail page copy in HTML. Return ONLY HTML using <h2> section headings (3-5 words each) and <p> paragraphs. Include 3-4 sections. About 120-180 words total. No markdown. No fake legal claims.",
          },
          {
            role: "user",
            content: `Write full property details for:\n${context}`,
          },
        ],
        900,
      );
      const text = raw.includes("<") ? raw : fallbackContent(property);
      return NextResponse.json({ text, fallback: false });
    }

    const raw = await callOpenAi(
      apiKey,
      model,
      [
        {
          role: "system",
          content:
            'Return JSON only: {"seoTitle":"","seoDescription":"","seoKeywords":""}. SEO title max 60 chars. Description max 155 chars. Keywords comma-separated, max 8 terms.',
        },
        {
          role: "user",
          content: `Write SEO meta for this property listing:\n${context}`,
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
      return NextResponse.json({
        seoTitle: cleanText(parsed.seoTitle || "", 60) || fallbackSeo(property).seoTitle,
        seoDescription:
          cleanText(parsed.seoDescription || "", 155) ||
          fallbackSeo(property).seoDescription,
        seoKeywords: cleanText(parsed.seoKeywords || "", 120) || fallbackSeo(property).seoKeywords,
        fallback: false,
      });
    } catch {
      return NextResponse.json({ ...fallbackSeo(property), fallback: true });
    }
  } catch {
    return NextResponse.json(
      { message: "Unable to generate property copy right now." },
      { status: 500 },
    );
  }
}
