/**
 * Shared AI provider — xAI (Grok) first, Claude second, then Gemini / OpenAI.
 * All redesign / assist text models should call this instead of hardcoding vendors.
 */

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiImagePart = {
  mimeType: string;
  /** Raw base64 (no data: prefix) */
  base64: string;
};

export type AiProviderName = "xai" | "claude" | "gemini" | "openai" | "none";

export type AiTextResult = {
  text: string;
  provider: AiProviderName;
  model: string;
  tokensUsed: number;
  fallbackReason?: string;
};

function geminiKey() {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

function openaiKey() {
  return process.env.OPENAI_API_KEY?.trim() || "";
}

function anthropicKey() {
  return (
    process.env.ANTHROPIC_API_KEY?.trim() ||
    process.env.CLAUDE_API_KEY?.trim() ||
    ""
  );
}

function xaiKey() {
  return (
    process.env.XAI_API_KEY?.trim() ||
    process.env.GROK_API_KEY?.trim() ||
    process.env.X_AI_API_KEY?.trim() ||
    ""
  );
}

function geminiModel() {
  // Fast default for drafts / Speed (override with GEMINI_MODEL)
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

/** Optional stronger Gemini for Create-AI pages (falls back to GEMINI_MODEL). */
function geminiSmartModel() {
  return (
    process.env.GEMINI_QUALITY_MODEL?.trim() ||
    process.env.GEMINI_SMART_MODEL?.trim() ||
    geminiModel()
  );
}

function openaiModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
}

function openaiQualityModel() {
  return process.env.OPENAI_QUALITY_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || "gpt-4.1";
}

function anthropicModel() {
  return (
    process.env.ANTHROPIC_MODEL?.trim() ||
    process.env.CLAUDE_MODEL?.trim() ||
    // Fast default — override with ANTHROPIC_QUALITY_MODEL for Opus
    "claude-sonnet-5"
  );
}

function anthropicQualityModel() {
  return (
    process.env.ANTHROPIC_QUALITY_MODEL?.trim() ||
    process.env.CLAUDE_QUALITY_MODEL?.trim() ||
    "claude-opus-5"
  );
}

function xaiModel() {
  // Chat / Speed default — Grok Fast (override XAI_MODEL / GROK_MODEL)
  return (
    process.env.XAI_MODEL?.trim() ||
    process.env.GROK_MODEL?.trim() ||
    "grok-4-1-fast"
  );
}

function xaiQualityModel() {
  return (
    process.env.XAI_QUALITY_MODEL?.trim() ||
    process.env.GROK_QUALITY_MODEL?.trim() ||
    "grok-4.3"
  );
}

function xaiBaseUrl() {
  return (process.env.XAI_BASE_URL?.trim() || "https://api.x.ai/v1").replace(/\/$/, "");
}

export type AiModelTier = "fast" | "quality";

function resolveProviderModel(
  provider: "xai" | "claude" | "openai" | "gemini",
  tier: AiModelTier = "fast",
  override?: string,
) {
  if (override?.trim()) return override.trim();
  if (provider === "xai") return tier === "quality" ? xaiQualityModel() : xaiModel();
  if (provider === "claude")
    return tier === "quality" ? anthropicQualityModel() : anthropicModel();
  if (provider === "openai")
    return tier === "quality" ? openaiQualityModel() : openaiModel();
  return tier === "quality" ? geminiSmartModel() : geminiModel();
}

/** Claude 5.x rejects `temperature` (adaptive thinking). Older models still accept it. */
function claudeSamplingFields(model: string, temperature?: number) {
  if (/claude-(?:opus|sonnet|fable)-5(?:$|[^0-9])/i.test(model)) {
    return {};
  }
  return {
    temperature: typeof temperature === "number" ? temperature : 0.35,
  };
}

function splitSystemMessages(messages: AiChatMessage[]) {
  const systemParts = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content.trim())
    .filter(Boolean);
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));
  return {
    systemInstruction: systemParts.length
      ? { parts: [{ text: systemParts.join("\n\n") }] }
      : undefined,
    contents,
  };
}

async function callGemini(params: {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  /** Override default GEMINI_MODEL (e.g. quality model for Create-AI). */
  model?: string;
}): Promise<AiTextResult> {
  const apiKey = geminiKey();
  const model = (params.model || geminiModel()).trim() || geminiModel();
  if (!apiKey) {
    return {
      text: "",
      provider: "none",
      model,
      tokensUsed: 0,
      fallbackReason: "GEMINI_API_KEY missing",
    };
  }

  const { systemInstruction, contents } = splitSystemMessages(params.messages);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(systemInstruction ? { systemInstruction } : {}),
        contents,
        generationConfig: {
          temperature:
            typeof params.temperature === "number" ? params.temperature : 0.55,
          maxOutputTokens:
            typeof params.maxTokens === "number" ? params.maxTokens : 2048,
          ...(params.jsonMode
            ? { responseMimeType: "application/json" }
            : {}),
          ...(() => {
            const budget = Number(process.env.GEMINI_THINKING_BUDGET || 0);
            if (!Number.isFinite(budget) || budget <= 0) return {};
            return { thinkingConfig: { thinkingBudget: Math.min(budget, 24576) } };
          })(),
        },
      }),
    },
  );

  const data = (await response.json().catch(() => ({}))) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: { totalTokenCount?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      text: "",
      provider: "gemini",
      model,
      tokensUsed: 0,
      fallbackReason: data.error?.message || `Gemini HTTP ${response.status}`,
    };
  }

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  return {
    text,
    provider: "gemini",
    model,
    tokensUsed:
      typeof data.usageMetadata?.totalTokenCount === "number"
        ? data.usageMetadata.totalTokenCount
        : 0,
  };
}

async function callOpenAi(params: {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
}): Promise<AiTextResult> {
  const apiKey = openaiKey();
  const model = params.model?.trim() || openaiModel();
  if (!apiKey) {
    return {
      text: "",
      provider: "none",
      model,
      tokensUsed: 0,
      fallbackReason: "OPENAI_API_KEY missing",
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature:
        typeof params.temperature === "number" ? params.temperature : 0.55,
      ...(typeof params.maxTokens === "number"
        ? { max_tokens: Math.min(params.maxTokens, 16384) }
        : {}),
      ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages: params.messages,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      text: "",
      provider: "openai",
      model,
      tokensUsed: 0,
      fallbackReason: data.error?.message || `OpenAI HTTP ${response.status}`,
    };
  }

  return {
    text: data.choices?.[0]?.message?.content?.trim() || "",
    provider: "openai",
    model,
    tokensUsed:
      typeof data.usage?.total_tokens === "number" ? data.usage.total_tokens : 0,
  };
}

/** Prefer xAI (Grok) → Claude → Gemini → OpenAI. */
export async function generateAiText(params: {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  /** Prefer a provider first (Create-AI: Grok/Claude; Gemini last). */
  preferProvider?: "xai" | "claude" | "gemini" | "openai";
  /** When true, only try preferProvider. */
  strictProvider?: boolean;
  /** Gemini model override (quality / smart path). */
  geminiModel?: string;
  /** Explicit model id for the preferred provider. */
  model?: string;
  /** fast = chat/speed defaults; quality = stronger models. */
  modelTier?: AiModelTier;
}): Promise<AiTextResult> {
  const prefer = params.preferProvider;
  const tier: AiModelTier = params.modelTier || "fast";
  const order: Array<"gemini" | "xai" | "openai" | "claude"> = params.strictProvider
    ? prefer
      ? [prefer === "claude" ? "claude" : prefer === "openai" ? "openai" : prefer === "xai" ? "xai" : "gemini"]
      : ["openai", "gemini", "xai", "claude"]
    : prefer === "gemini"
      ? ["gemini", "openai", "xai", "claude"]
      : prefer === "openai"
        ? ["openai", "gemini", "xai", "claude"]
        : prefer === "claude"
          ? ["claude", "openai", "gemini", "xai"]
          : prefer === "xai"
            ? ["xai", "openai", "gemini", "claude"]
            : // Default: OpenAI + Gemini first (Create-AI chat stack)
              ["openai", "gemini", "xai", "claude"];

  let last: AiTextResult = {
    text: "",
    provider: "none",
    model: "",
    tokensUsed: 0,
    fallbackReason: "No AI provider configured",
  };

  for (const provider of order) {
    if (provider === "xai" && !xaiKey()) continue;
    if (provider === "claude" && !anthropicKey()) continue;
    if (provider === "gemini" && !geminiKey()) continue;
    if (provider === "openai" && !openaiKey()) continue;

    const model = resolveProviderModel(
      provider,
      tier,
      provider === prefer ? params.model : undefined,
    );

    const result =
      provider === "xai"
        ? await callXaiText({ ...params, model })
        : provider === "claude"
          ? await callClaudeText({ ...params, model })
          : provider === "gemini"
            ? await callGemini({
                ...params,
                model: params.geminiModel || model,
              })
            : await callOpenAi({ ...params, model });

    last = result;
    if (result.text) return result;
  }

  return last;
}

/** Expose model ids used by Create-AI (for health / UI). */
export function getCreateAiModelRoster() {
  return {
    fast: {
      xai: xaiModel(),
      openai: openaiModel(),
      claude: anthropicModel(),
      gemini: geminiModel(),
    },
    quality: {
      xai: xaiQualityModel(),
      openai: openaiQualityModel(),
      claude: anthropicQualityModel(),
      gemini: geminiSmartModel(),
    },
  };
}

/** Expose smart Gemini model id for Create-AI hybrid path. */
export function getGeminiSmartModel() {
  return geminiSmartModel();
}

async function callXaiText(params: {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
}): Promise<AiTextResult> {
  const apiKey = xaiKey();
  const model = params.model?.trim() || xaiModel();
  if (!apiKey) {
    return {
      text: "",
      provider: "none",
      model,
      tokensUsed: 0,
      fallbackReason: "XAI_API_KEY missing",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${xaiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature:
          typeof params.temperature === "number" ? params.temperature : 0.45,
        ...(typeof params.maxTokens === "number"
          ? { max_tokens: Math.min(params.maxTokens, 16384) }
          : {}),
        ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: params.messages,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "xAI network error";
    return {
      text: "",
      provider: "xai",
      model,
      tokensUsed: 0,
      fallbackReason: message,
    };
  }

  const data = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      text: "",
      provider: "xai",
      model,
      tokensUsed: 0,
      fallbackReason: data.error?.message || `xAI HTTP ${response.status}`,
    };
  }

  return {
    text: data.choices?.[0]?.message?.content?.trim() || "",
    provider: "xai",
    model,
    tokensUsed:
      typeof data.usage?.total_tokens === "number" ? data.usage.total_tokens : 0,
  };
}

async function callClaudeText(params: {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  model?: string;
}): Promise<AiTextResult> {
  const apiKey = anthropicKey();
  const model = params.model?.trim() || anthropicModel();
  if (!apiKey) {
    return {
      text: "",
      provider: "none",
      model,
      tokensUsed: 0,
      fallbackReason: "ANTHROPIC_API_KEY missing",
    };
  }

  const system = params.messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const userText = params.messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: typeof params.maxTokens === "number" ? params.maxTokens : 16000,
        ...claudeSamplingFields(model, params.temperature),
        ...(system ? { system } : {}),
        messages: [
          {
            role: "user",
            content: params.jsonMode
              ? `${userText}\n\nReturn ONLY valid JSON. No markdown fences.`
              : userText,
          },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Claude network error";
    return {
      text: "",
      provider: "claude",
      model,
      tokensUsed: 0,
      fallbackReason: message,
    };
  }

  const data = (await response.json().catch(() => ({}))) as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      text: "",
      provider: "claude",
      model,
      tokensUsed: 0,
      fallbackReason: data.error?.message || `Claude HTTP ${response.status}`,
    };
  }

  const text =
    data.content
      ?.filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("")
      .trim() || "";

  return {
    text,
    provider: "claude",
    model,
    tokensUsed:
      (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
  };
}

async function callGeminiVision(params: {
  system?: string;
  prompt: string;
  images: AiImagePart[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  /** Override default GEMINI_MODEL (e.g. quality model for section clone) */
  model?: string;
}): Promise<AiTextResult> {
  const apiKey = geminiKey();
  const model =
    (params.model || "").trim() || geminiSmartModel() || geminiModel();
  if (!apiKey) {
    return {
      text: "",
      provider: "none",
      model,
      tokensUsed: 0,
      fallbackReason: "GEMINI_API_KEY missing",
    };
  }

  const parts: Array<Record<string, unknown>> = [{ text: params.prompt }];
  for (const image of params.images) {
    if (!image.base64) continue;
    parts.push({
      inline_data: {
        mime_type: image.mimeType || "image/jpeg",
        data: image.base64,
      },
    });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(params.system
          ? { systemInstruction: { parts: [{ text: params.system }] } }
          : {}),
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature:
            typeof params.temperature === "number" ? params.temperature : 0.35,
          maxOutputTokens:
            typeof params.maxTokens === "number" ? params.maxTokens : 4096,
          ...(params.jsonMode
            ? { responseMimeType: "application/json" }
            : {}),
        },
      }),
    },
  );

  const data = (await response.json().catch(() => ({}))) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: { totalTokenCount?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      text: "",
      provider: "gemini",
      model,
      tokensUsed: 0,
      fallbackReason: data.error?.message || `Gemini HTTP ${response.status}`,
    };
  }

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim() || "";

  return {
    text,
    provider: "gemini",
    model,
    tokensUsed:
      typeof data.usageMetadata?.totalTokenCount === "number"
        ? data.usageMetadata.totalTokenCount
        : 0,
  };
}

async function callOpenAiVision(params: {
  system?: string;
  prompt: string;
  images: AiImagePart[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<AiTextResult> {
  const apiKey = openaiKey();
  // Vision needs a multimodal model; gpt-4o-mini still works with images.
  const model = openaiModel();
  if (!apiKey) {
    return {
      text: "",
      provider: "none",
      model,
      tokensUsed: 0,
      fallbackReason: "OPENAI_API_KEY missing",
    };
  }

  const content: Array<Record<string, unknown>> = [
    { type: "text", text: params.prompt },
  ];
  for (const image of params.images) {
    if (!image.base64) continue;
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${image.mimeType || "image/jpeg"};base64,${image.base64}`,
      },
    });
  }

  const messages: Array<Record<string, unknown>> = [];
  if (params.system) {
    messages.push({ role: "system", content: params.system });
  }
  messages.push({ role: "user", content });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature:
        typeof params.temperature === "number" ? params.temperature : 0.35,
      ...(typeof params.maxTokens === "number"
        ? { max_tokens: Math.min(params.maxTokens, 16384) }
        : {}),
      ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
      messages,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      text: "",
      provider: "openai",
      model,
      tokensUsed: 0,
      fallbackReason: data.error?.message || `OpenAI HTTP ${response.status}`,
    };
  }

  return {
    text: data.choices?.[0]?.message?.content?.trim() || "",
    provider: "openai",
    model,
    tokensUsed:
      typeof data.usage?.total_tokens === "number" ? data.usage.total_tokens : 0,
  };
}

async function callClaudeVision(params: {
  system?: string;
  prompt: string;
  images: AiImagePart[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<AiTextResult> {
  const apiKey = anthropicKey();
  const model = anthropicModel();
  if (!apiKey) {
    return {
      text: "",
      provider: "none",
      model,
      tokensUsed: 0,
      fallbackReason: "ANTHROPIC_API_KEY missing",
    };
  }

  const content: Array<Record<string, unknown>> = [];
  for (const image of params.images) {
    if (!image.base64) continue;
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mimeType || "image/jpeg",
        data: image.base64,
      },
    });
  }
  const promptText = params.jsonMode
    ? `${params.prompt}\n\nReturn ONLY valid JSON. No markdown fences.`
    : params.prompt;
  content.push({ type: "text", text: promptText });

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(
          typeof params.maxTokens === "number" ? params.maxTokens : 16000,
          32000,
        ),
        ...claudeSamplingFields(model, params.temperature ?? 0.25),
        ...(params.system ? { system: params.system } : {}),
        messages: [{ role: "user", content }],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Claude network error";
    return {
      text: "",
      provider: "claude",
      model,
      tokensUsed: 0,
      fallbackReason: message,
    };
  }

  const data = (await response.json().catch(() => ({}))) as {
    content?: Array<{ type?: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      text: "",
      provider: "claude",
      model,
      tokensUsed: 0,
      fallbackReason: data.error?.message || `Claude HTTP ${response.status}`,
    };
  }

  const text =
    data.content
      ?.filter((part) => part.type === "text")
      .map((part) => part.text || "")
      .join("")
      .trim() || "";

  const tokensUsed =
    (typeof data.usage?.input_tokens === "number"
      ? data.usage.input_tokens
      : 0) +
    (typeof data.usage?.output_tokens === "number"
      ? data.usage.output_tokens
      : 0);

  return {
    text,
    provider: "claude",
    model,
    tokensUsed,
    ...(text
      ? {}
      : { fallbackReason: "Claude returned empty text (check model / image size)" }),
  };
}

async function callXaiVision(params: {
  system?: string;
  prompt: string;
  images: AiImagePart[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}): Promise<AiTextResult> {
  const apiKey = xaiKey();
  const model = xaiModel();
  if (!apiKey) {
    return {
      text: "",
      provider: "none",
      model,
      tokensUsed: 0,
      fallbackReason: "XAI_API_KEY missing",
    };
  }

  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: params.jsonMode
        ? `${params.prompt}\n\nReturn ONLY valid JSON. No markdown fences.`
        : params.prompt,
    },
  ];
  for (const image of params.images) {
    if (!image.base64) continue;
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${image.mimeType || "image/jpeg"};base64,${image.base64}`,
      },
    });
  }

  const messages: Array<Record<string, unknown>> = [];
  if (params.system) {
    messages.push({ role: "system", content: params.system });
  }
  messages.push({ role: "user", content });

  let response: Response;
  try {
    response = await fetch(`${xaiBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature:
          typeof params.temperature === "number" ? params.temperature : 0.3,
        max_tokens: Math.min(
          typeof params.maxTokens === "number" ? params.maxTokens : 12000,
          16384,
        ),
        ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "xAI network error";
    return {
      text: "",
      provider: "xai",
      model,
      tokensUsed: 0,
      fallbackReason: message,
    };
  }

  const data = (await response.json().catch(() => ({}))) as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      text: "",
      provider: "xai",
      model,
      tokensUsed: 0,
      fallbackReason: data.error?.message || `xAI HTTP ${response.status}`,
    };
  }

  const text = data.choices?.[0]?.message?.content?.trim() || "";
  return {
    text,
    provider: "xai",
    model,
    tokensUsed:
      typeof data.usage?.total_tokens === "number" ? data.usage.total_tokens : 0,
    ...(text ? {} : { fallbackReason: "xAI returned empty text" }),
  };
}

/** Multimodal: screenshot → HTML. Prefer xAI → Claude → OpenAI → Gemini. */
export async function generateAiFromImages(params: {
  system?: string;
  prompt: string;
  images: AiImagePart[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  preferProvider?: "xai" | "claude" | "gemini" | "openai";
  /** When true, only try preferProvider (no silent fallback). */
  strictProvider?: boolean;
  /** Gemini model override (quality / section-clone). */
  geminiModel?: string;
}): Promise<AiTextResult> {
  const prefer = params.preferProvider || "openai";
  const order: Array<"xai" | "claude" | "openai" | "gemini"> = params.strictProvider
    ? [prefer]
    : prefer === "claude"
      ? ["claude", "openai", "gemini", "xai"]
      : prefer === "openai"
        ? ["openai", "gemini", "xai", "claude"]
        : prefer === "gemini"
          ? ["gemini", "openai", "xai", "claude"]
          : ["openai", "gemini", "xai", "claude"];

  let last: AiTextResult = {
    text: "",
    provider: "none",
    model: "",
    tokensUsed: 0,
    fallbackReason: "No AI vision provider configured",
  };

  for (const provider of order) {
    if (provider === "xai" && !xaiKey()) continue;
    if (provider === "claude" && !anthropicKey()) continue;
    if (provider === "openai" && !openaiKey()) continue;
    if (provider === "gemini" && !geminiKey()) continue;

    const result =
      provider === "xai"
        ? await callXaiVision(params)
        : provider === "claude"
          ? await callClaudeVision(params)
          : provider === "openai"
            ? await callOpenAiVision(params)
            : await callGeminiVision({
                ...params,
                model: params.geminiModel || geminiSmartModel(),
              });

    last = result;
    if (result.text) return result;
  }

  return last;
}

export function hasAnyAiKey() {
  return Boolean(xaiKey() || geminiKey() || openaiKey() || anthropicKey());
}

export function primaryAiProviderLabel() {
  if (xaiKey() || anthropicKey() || geminiKey() || openaiKey()) return "Lestow";
  return "none";
}

export function redesignVisionProviderLabel() {
  if (xaiKey() || anthropicKey() || openaiKey() || geminiKey()) return "Lestow";
  return "none";
}
