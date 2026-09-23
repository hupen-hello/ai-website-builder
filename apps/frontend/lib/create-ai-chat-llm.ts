/**
 * Create-with-AI chat LLM routing — OpenAI + Gemini only.
 *
 * Speed  → brain (planner/intent): OpenAI mini (accurate) · HTML edits: Gemini Flash (fast)
 * Quality → OpenAI strong → Gemini fallback
 * Vision section clone → Gemini → OpenAI
 */

export type CreateAiChatMode = "speed" | "quality";
export type CreateAiLlmProvider = "openai" | "gemini";

export type CreateAiLlmRoute = {
  primary: CreateAiLlmProvider;
  fallback: CreateAiLlmProvider;
  tier: "fast" | "quality";
};

/** Intent clarify + action planner — accuracy first even on Speed */
export function createAiPlannerRoute(mode: CreateAiChatMode): CreateAiLlmRoute {
  if (mode === "quality") {
    return { primary: "openai", fallback: "gemini", tier: "quality" };
  }
  // Speed: OpenAI mini understands Hinglish better than Flash; still fast
  return { primary: "openai", fallback: "gemini", tier: "fast" };
}

/** Free-form / surgical HTML edits */
export function createAiEditRoute(
  mode: CreateAiChatMode,
  opts?: { screenshotSection?: boolean; screenshotUi?: boolean },
): CreateAiLlmRoute {
  if (opts?.screenshotSection) {
    return { primary: "gemini", fallback: "openai", tier: "quality" };
  }
  if (opts?.screenshotUi) {
    return {
      primary: "openai",
      fallback: "gemini",
      tier: mode === "quality" ? "quality" : "fast",
    };
  }
  if (mode === "quality") {
    return { primary: "openai", fallback: "gemini", tier: "quality" };
  }
  // Speed edits: Gemini Flash for latency; OpenAI mini fallback if Gemini weak
  return { primary: "gemini", fallback: "openai", tier: "fast" };
}

/** Header invent / surgical header rewrite */
export function createAiHeaderRoute(
  mode: CreateAiChatMode,
  invent?: boolean,
): CreateAiLlmRoute {
  if (mode === "quality") {
    return {
      primary: "openai",
      fallback: "gemini",
      tier: invent ? "quality" : "fast",
    };
  }
  // Speed header invent: OpenAI mini (more reliable than Flash invent)
  return {
    primary: "openai",
    fallback: "gemini",
    tier: invent ? "fast" : "fast",
  };
}
