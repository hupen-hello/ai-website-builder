"use client";

import { ClipboardEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Bot,
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  FileStack,
  FileText,
  LayoutDashboard,
  Link2,
  Loader2,
  LogOut,
  Monitor,
  Paperclip,
  Pencil,
  Plus,
  Rocket,
  Send,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  UserRound,
  X,
} from "lucide-react";
import { toPng } from "html-to-image";
import { useUserAuth, UserAuthProvider } from "@/components/auth/UserAuthContext";
import PublishLoginModal from "@/components/auth/PublishLoginModal";
import ExportWebsiteModal from "@/components/ExportWebsiteModal";
import { flushCreateAiDesignSync } from "@/lib/create-ai-design-sync";
import {
  CREATE_AI_EDIT_SECTION_OPTIONS,
  applyCreateAiReplacedMedia,
  applyCreateAiSectionBackground,
  applyCreateAiSectionYoutube,
  installCreateAiEditMode,
  insertCreateAiEditSection,
  serializeCreateAiEditDocument,
  stripCreateAiEditChrome,
  type CreateAiEditSectionKind,
} from "@/lib/create-ai-edit-mode";
import {
  setPublishedSiteUrl,
  setUserActiveSiteId,
} from "@/lib/migrateGuestSite";
import {
  setActiveCreateAiDesignId,
  isValidCreateAiDesignId,
} from "@/lib/create-ai-design-id";
import {
  getCreateAiPayload,
  getCreateAiSite,
  getCreateAiChat,
  isMultiPageType,
  saveCreateAiChat,
  saveCreateAiPayload,
  saveCreateAiSite,
  type CreateAiPage,
  type CreateAiPayload,
  type CreateAiSite,
} from "@/lib/create-ai-storage";
import {
  applyCreateAiDesignTheme,
  applyCreateAiHeaderSticky,
  applyCreateAiTopBar,
  enforceCreateAiHomeSections,
  ensureCreateAiHeaderBrand,
  ensureCreateAiResponsive,
  ensureSinglePageSectionScroll,
  fixCreateAiImages,
  injectBrandLogo,
  injectOnboardingContact,
  normalizeCreateAiFloatingIfPresent,
  normalizeCreateAiHeaderBar,
  polishCreateAiExportHtml,
  restitchAllPagesWithHomeChrome,
  stitchPageWithHomeChrome,
  stripCreateAiChatWidgets,
  stripCreateAiContactPromptLeak,
  syncCreateAiSinglePageNav,
  normalizeCreateAiCopyrightYear,
  stripDuplicateContactStrips,
  stripOrphanDuplicateNav,
  stripSecondaryHeaderBrands,
  normalizeCreateAiStudioNav,
  ensureCreateAiInnerPageLayout,
} from "@/lib/create-ai-chrome";
import { applyCreateAiQaRails } from "@/lib/create-ai-qa-rails";
import { injectCreateAiReferenceFinish } from "@/lib/create-ai-reference-finish";
import { normalizeCreateAiDesignPrefs } from "@/lib/create-ai-design-prefs";
import {
  isLogoReplaceAsk,
  isHeroBannerImageAsk,
} from "@/lib/create-ai-chat-actions";
import {
  CREATE_AI_CHAT_CREDIT_PACKS,
  CREATE_AI_FREE_CHAT_CREDITS,
  consumeCreateAiChatCredit,
  getCreateAiChatCreditBalance,
  getCreateAiChatCreditPack,
  recordCreateAiChatCreditPurchase,
  refundCreateAiChatCredit,
  type CreateAiChatCreditPackId,
} from "@/lib/create-ai-chat-credits";
import {
  openRazorpayCheckout,
  waitForRazorpayScript,
} from "@/lib/razorpayCheckout";
import { buildRazorpayPrefill } from "@/lib/razorpayPrefill";
import Script from "next/script";

type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  imagePreviews?: string[];
  /** unix ms — WhatsApp-style day + time */
  at?: number;
};

type ChatAttachment = {
  id: string;
  previewUrl: string;
  mimeType: string;
  base64: string;
};

function chatMsg(
  role: "user" | "assistant",
  content: string,
  extra?: Partial<ChatMsg>,
): ChatMsg {
  return { role, content, at: Date.now(), ...extra };
}

function formatChatClock(ts: number) {
  // Manual format — locale toLocaleTimeString can differ SSR vs client (pm vs PM)
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatChatDayLabel(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  try {
    return d.toLocaleDateString([], {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return d.toDateString();
  }
}

/** User-facing label — never expose vendor model names (Gemini / Grok / xAI / OpenAI). */
function friendlyAiEngineLabel(provider?: string | null): string {
  const p = (provider || "").toLowerCase().trim();
  if (!p || p === "none" || p === "fallback") return "";
  if (p.includes("gemini")) return "Speed";
  if (p.includes("xai") || p.includes("grok")) return "Speed";
  if (p.includes("openai") || p.includes("gpt")) return "Quality";
  if (p.includes("claude") || p.includes("anthropic")) return "Quality";
  return "AI";
}

/** Strip vendor names + normalize status copy for the studio chrome. */
function sanitizeCreateAiStatus(message?: string | null): string {
  if (!message) return "";
  return message
    .replace(/\b(google\s*)?(gemini|grok|x[\s-]?ai|openai|gpt-?\d*|claude|anthropic)\b/gi, "")
    .replace(/Fast draft refined for quality/gi, "Draft refined for quality")
    .replace(/Draft ready/gi, "Preview ready")
    .replace(/\s*[·|]\s*[·|]/g, " · ")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s*[·|-]+\s*|\s*[·|-]+\s*$/g, "")
    .trim();
}

/** Fast path: skip auto vision for simple widget/header asks (NOT user-attached refs). */
function isFastChatIntent(message: string) {
  // Section add with design intent is NOT "fast" — needs AI (or default inject without image)
  if (
    /(add|bana|dal|laga).{0,40}(section|testimonial|team|faq|pricing|map|video|timeline|slider)/i.test(
      message || "",
    )
  ) {
    return false;
  }
  return /back\s*to\s*top|btt\b|float|whatsapp|whats\s*app|call\s*(icon|button)|email\s*icon|header|heder|responsive|undo|text\s+white|white\s+text|text\s+black|color\s+white|heading\s+white|\b(text|heading|title)\s+(white|black|red|blue)\b/i.test(
    message || "",
  );
}

function isMicroTextColorAsk(message: string) {
  const m = (message || "").trim();
  if (!m || m.length > 100) return false;
  return /^(text|heading|title|font|color|colour|rang|button)\s*(text\s*)?(ko\s*)?(white|black|red|blue|#)|^(white|black)\s*(text|heading|color|button)|\b(button|cta)\s*(ka\s*)?(text|likha)?\s*(white|black)|make\s+.*text.*white/i.test(
    m,
  );
}

/** No UI toggle — auto: Speed for micro/widget; Quality for screenshots + bigger edits. */
function pickCreateAiChatMode(
  message: string,
  hasAttachments: boolean,
): "speed" | "quality" {
  if (hasAttachments) return "quality";
  if (isMicroTextColorAsk(message) || isFastChatIntent(message)) return "speed";
  return "quality";
}

function dataUrlToAttachment(dataUrl: string, id?: string): ChatAttachment | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/i);
  if (!m) return null;
  return {
    id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    previewUrl: dataUrl,
    mimeType: m[1].toLowerCase(),
    base64: m[2],
  };
}

/** Shrink screenshots for faster vision — keeps layout readable. */
async function compressScreenshotDataUrl(
  dataUrl: string,
  maxW = 1280,
  quality = 0.8,
): Promise<ChatAttachment | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("image load failed"));
      el.src = dataUrl;
    });
    const scale = Math.min(1, maxW / Math.max(1, img.width));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrlToAttachment(dataUrl);
    ctx.drawImage(img, 0, 0, w, h);
    const jpeg = canvas.toDataURL("image/jpeg", quality);
    return dataUrlToAttachment(jpeg) || dataUrlToAttachment(dataUrl);
  } catch {
    return dataUrlToAttachment(dataUrl);
  }
}

/** Tiny logo for header inject — keeps HTML under validation / JSON limits. */
async function compressLogoDataUrl(
  dataUrl: string,
): Promise<ChatAttachment | null> {
  return compressScreenshotDataUrl(dataUrl, 320, 0.82);
}
type ViewportMode = "desktop" | "tablet" | "mobile";

/** Suggested pages user can add later (multi-page: first generate = Home only). */
const EXTRA_PAGE_SUGGESTIONS = [
  "About",
  "Services",
  "Gallery",
  "Contact",
  "Blog",
  "Pricing",
];

const VIEWPORT_WIDTH: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "820px",
  mobile: "390px",
};

const VIEWPORT_MIN_HEIGHT: Record<ViewportMode, string> = {
  desktop: "100%",
  tablet: "100%",
  mobile: "100%",
};

/** Soft session token budget — warn in UI, still allow chat. */
const TOKEN_SOFT_CAP = 120_000;

function slugPageId(label: string) {
  return (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || `page-${Date.now().toString(36)}`
  );
}

export default function CreateAiStudioPage() {
  return (
    <UserAuthProvider>
      <CreateAiStudioInner />
    </UserAuthProvider>
  );
}

function CreateAiStudioInner() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading, logout } = useUserAuth();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";

  const [payload, setPayload] = useState<CreateAiPayload | null>(null);
  const [site, setSite] = useState<CreateAiSite | null>(null);
  const [building, setBuilding] = useState(true);
  const [bootDone, setBootDone] = useState(false);
  const [resumeMode, setResumeMode] = useState(false);
  const resumeRef = useRef(false);
  const [pageBusy, setPageBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPublishLogin, setShowPublishLogin] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportTarget, setExportTarget] = useState<{
    id: string;
    title: string;
    slug: string;
  } | null>(null);
  const loginPurposeRef = useRef<"publish" | "credits" | "export">("publish");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishedSiteId, setPublishedSiteId] = useState<string | null>(null);
  const [showPublishedPopup, setShowPublishedPopup] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isEditingPublishedUrl, setIsEditingPublishedUrl] = useState(false);
  const [publishedSlugDraft, setPublishedSlugDraft] = useState("");
  const [publishedUrlError, setPublishedUrlError] = useState("");
  const [publishedUrlSaved, setPublishedUrlSaved] = useState(false);
  const [isSavingPublishedUrl, setIsSavingPublishedUrl] = useState(false);
  const [buildProgress, setBuildProgress] = useState(8);
  const [status, setStatus] = useState("Preparing Create with AI…");
  const [provider, setProvider] = useState("");
  const [tokensUsed, setTokensUsed] = useState(0);
  const [chatPhase, setChatPhase] = useState("");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [chat, setChat] = useState<ChatMsg[]>([
    chatMsg(
      "assistant",
      "Your site is generating. When ready, tell me what to change — or upload a screenshot of the preview / a reference section.",
    ),
  ]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatCreditTick, setChatCreditTick] = useState(0);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [buyingCreditPack, setBuyingCreditPack] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [customPageName, setCustomPageName] = useState("");
  const [viewport, setViewport] = useState<ViewportMode>("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [addSectionAfterIndex, setAddSectionAfterIndex] = useState<number | null>(
    null,
  );
  const [editBgIndex, setEditBgIndex] = useState<number | null>(null);
  const [editBgColor, setEditBgColor] = useState("#0f172a");
  const [editBgImageUrl, setEditBgImageUrl] = useState("");
  const [editYtIndex, setEditYtIndex] = useState<number | null>(null);
  const [editYtUrl, setEditYtUrl] = useState("");
  const [editFreezeSrcDoc, setEditFreezeSrcDoc] = useState("");
  const started = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editMediaInputRef = useRef<HTMLInputElement>(null);
  const editMediaTargetRef = useRef<HTMLImageElement | SVGElement | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const previewShellRef = useRef<HTMLElement>(null);
  const tokenWarnShown = useRef(false);
  const editModeSrcDocRef = useRef("");
  const editSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editModeRestoredRef = useRef(false);
  const chatHydratedRef = useRef(false);
  const lastChatCreditSourceRef = useRef<"free" | "purchased" | null>(null);
  /** One Undo can refund a credit charged before this session tracked sources. */
  const orphanChatCreditRefundArmedRef = useRef(true);
  const siteRef = useRef(site);
  const editModeRef = useRef(editMode);
  /** Reinstall rails + persist without remounting iframe (keeps scroll). */
  const syncEditDomRef = useRef<(() => void) | null>(null);
  const editScrollRef = useRef({ x: 0, y: 0 });
  siteRef.current = site;
  editModeRef.current = editMode;

  const editModeStorageKey = (id: string) =>
    `lestow-create-ai-edit-mode:${id}`;

  const persistEditModeFlag = (on: boolean) => {
    if (!designId) return;
    try {
      if (on) window.localStorage.setItem(editModeStorageKey(designId), "1");
      else window.localStorage.removeItem(editModeStorageKey(designId));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!showUserMenu) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-create-ai-user-menu]")) return;
      setShowUserMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [showUserMenu]);

  useEffect(() => {
    if (typeof window === "undefined" || !designId) return;
    try {
      const mapKey = `lestow-create-ai-published-site:${designId}`;
      const urlKey = `lestow-create-ai-published-url:${designId}`;
      const siteId = window.localStorage.getItem(mapKey);
      const url = window.localStorage.getItem(urlKey);
      if (siteId) setPublishedSiteId(siteId);
      if (url) {
        setPublishedUrl(url);
        setPublishedSiteUrl(url);
      }
    } catch {
      /* ignore */
    }
  }, [designId]);

  const isMulti = isMultiPageType(payload?.pageType);
  const chatCreditUserKey =
    user?.id || user?.email || (designId ? `design:${designId}` : "guest");
  const chatCredits = useMemo(
    () => getCreateAiChatCreditBalance(chatCreditUserKey),
    [chatCreditUserKey, chatCreditTick, user?.id, user?.email],
  );

  // One-shot: emergency restore for ca_mu3o660d (bad chat edit) — refund the burned credit.
  useEffect(() => {
    if (!designId || designId !== "ca_mu3o660d_c627bdf2bd") return;
    const flag = `lestow-create-ai-restore-credit:${designId}`;
    try {
      if (window.localStorage.getItem(flag) === "1") return;
      if (getCreateAiChatCreditBalance(chatCreditUserKey).used < 1) {
        window.localStorage.setItem(flag, "1");
        return;
      }
      if (refundCreateAiChatCredit(chatCreditUserKey, "free")) {
        setChatCreditTick((n) => n + 1);
      }
      window.localStorage.setItem(flag, "1");
      orphanChatCreditRefundArmedRef.current = false;
    } catch {
      /* ignore */
    }
  }, [designId, chatCreditUserKey]);

  const activePage = useMemo(() => {
    if (!site?.pages?.length) return null;
    return (
      site.pages.find((p) => p.id === site.activePageId) || site.pages[0]
    );
  }, [site]);
  const html = activePage?.html || "";
  const previewHtml = useMemo(() => {
    if (!html) return "";
    let out = html;
    // Always strip duplicate contact under header in preview (even if stored HTML is old)
    out = stripDuplicateContactStrips(out);
    if (payload) {
      const prefs = normalizeCreateAiDesignPrefs(payload.designPrefs);
      const wantSticky =
        Boolean(prefs.stickyHeader) ||
        /data-create-ai-sticky=["']1["']/i.test(out) ||
        /data-create-ai-sticky-chrome=["']1["']/i.test(out);
      out = applyCreateAiTopBar(out, prefs.topBar, {
        email: payload.email,
        mobile: payload.mobile,
        address: payload.address,
      });
      out = stripDuplicateContactStrips(out);
      out = applyCreateAiHeaderSticky(out, wantSticky);
    }
    if (!isMulti || !site?.pages?.length) {
      out = stripOrphanDuplicateNav(out);
      out = syncCreateAiSinglePageNav(out);
      // Live preview must re-stamp nav active/scroll rails (stored HTML goes stale)
      out = ensureSinglePageSectionScroll(out);
      return out;
    }
    out = normalizeCreateAiStudioNav(
      out,
      site.pages.map((p) => ({ id: p.id, label: p.label })),
      site.activePageId || activePage?.id,
    );
    if (activePage && activePage.id !== "home") {
      out = ensureCreateAiInnerPageLayout(out, {
        brandName: payload?.brandName || "Brand",
        pageLabel: activePage.label,
        pageId: activePage.id,
      });
    }
    // Match single-page soft responsive + hamburger in preview
    out = ensureCreateAiResponsive(out);
    out = normalizeCreateAiHeaderBar(out);
    out = stripOrphanDuplicateNav(out);
    if (payload) {
      const prefs = normalizeCreateAiDesignPrefs(payload.designPrefs);
      const wantSticky =
        Boolean(prefs.stickyHeader) ||
        /data-create-ai-sticky=["']1["']/i.test(html) ||
        /data-create-ai-sticky-chrome=["']1["']/i.test(html);
      out = applyCreateAiTopBar(out, prefs.topBar, {
        email: payload.email,
        mobile: payload.mobile,
        address: payload.address,
      });
      out = applyCreateAiHeaderSticky(out, wantSticky);
    }
    out = stripDuplicateContactStrips(out);
    return out;
  }, [
    html,
    isMulti,
    site?.pages,
    site?.activePageId,
    activePage,
    payload,
  ]);

  // Keep Edit mode ON across refresh until user turns it Off
  useEffect(() => {
    editModeRestoredRef.current = false;
  }, [designId]);

  useEffect(() => {
    if (editModeRestoredRef.current) return;
    if (!designId || !html || building) return;
    try {
      const on =
        window.localStorage.getItem(editModeStorageKey(designId)) === "1";
      if (on) {
        const freeze = previewHtml || html;
        editModeSrcDocRef.current = freeze;
        setEditFreezeSrcDoc(freeze);
        setEditMode(true);
        setStatus(
          "Edit mode On — text, images & sections. Chat/responsive paused.",
        );
      }
    } catch {
      /* ignore */
    }
    editModeRestoredRef.current = true;
  }, [designId, html, building, previewHtml]);

  useEffect(() => {
    const active = (building || pageBusy) && !html;
    if (!active) {
      if (html) setBuildProgress(100);
      return;
    }
    setBuildProgress((p) => (p >= 95 ? 10 : Math.max(8, Math.min(p, 40))));
    const id = window.setInterval(() => {
      setBuildProgress((p) => {
        if (p >= 92) return 92;
        const step = p < 35 ? 4 : p < 65 ? 2.2 : 0.7;
        return Math.min(92, p + step);
      });
    }, 450);
    return () => window.clearInterval(id);
  }, [building, pageBusy, html]);

  const buildProgressLabel =
    buildProgress < 28
      ? "Planning layout…"
      : buildProgress < 55
        ? "Building sections…"
        : buildProgress < 78
          ? "Styling & content…"
          : "Almost ready…";

  const polishHtml = (raw: string) => {
    if (!payload) return raw;
    const brand = payload.brandName || "Brand";
    // Prefer logo already in HTML (chat-applied) over stale onboarding empty/old logo
    const htmlLogo =
      raw.match(
        /<img\b[^>]*data-create-ai-logo=["']1["'][^>]*src=["']([^"']+)["'][^>]*>/i,
      )?.[1] ||
      raw.match(
        /<img\b[^>]*src=["']([^"']+)["'][^>]*data-create-ai-logo=["']1["'][^>]*>/i,
      )?.[1] ||
      "";
    const logoSrc = (htmlLogo || payload.logoImage || "").trim();
    // Soft polish only — no default mobile menu / brand chrome (AI owns the design)
    let out = fixCreateAiImages(raw, payload.category);
    out = stripCreateAiContactPromptLeak(out);
    out = stripCreateAiChatWidgets(out);
    // Remove old stock sample hero videos (user: no predefined video)
    out = out.replace(
      /<div\b[^>]*data-create-ai-hero-video=["']1["'][^>]*>[\s\S]*?(?:ForBiggerEscapes|gtv-videos-bucket)[\s\S]*?<\/div>/gi,
      "",
    );
    out = stripDuplicateContactStrips(out);
    out = normalizeCreateAiCopyrightYear(out);
    out = injectBrandLogo(out, logoSrc, brand);
    out = ensureCreateAiHeaderBrand(out, brand, logoSrc);
    out = injectOnboardingContact(out, {
      email: payload.email,
      mobile: payload.mobile,
      address: payload.address,
    });
    out = ensureCreateAiResponsive(out);
    out = normalizeCreateAiHeaderBar(out, { brandName: brand });
    // Header normalize rebuilds letter-mark — re-stamp chat/onboarding logo after.
    out = injectBrandLogo(out, logoSrc, brand);
    out = ensureCreateAiHeaderBrand(out, brand, logoSrc);
    out = stripSecondaryHeaderBrands(out, brand);
    out = normalizeCreateAiFloatingIfPresent(
      out,
      payload.mobile || "",
      payload.email || "",
    );
    const prefs = normalizeCreateAiDesignPrefs(payload.designPrefs);
    // Chat may enable sticky even if onboarding left it off — honor HTML marker
    const wantSticky =
      Boolean(prefs.stickyHeader) ||
      /data-create-ai-sticky=["']1["']/i.test(out) ||
      /data-create-ai-sticky-chrome=["']1["']/i.test(out);
    out = applyCreateAiDesignTheme(out, prefs);
    out = applyCreateAiTopBar(out, prefs.topBar, {
      email: payload.email,
      mobile: payload.mobile,
      address: payload.address,
    });
    out = stripDuplicateContactStrips(out);
    out = applyCreateAiHeaderSticky(out, wantSticky);
    out = enforceCreateAiHomeSections(
      out,
      prefs,
      brand,
      payload.address || "",
      {
        email: payload.email,
        mobile: payload.mobile,
        address: payload.address,
      },
    );
    if (!isMultiPageType(payload.pageType)) {
      out = ensureSinglePageSectionScroll(out);
    } else if (site?.pages?.length) {
      const pageId = site.activePageId || "home";
      const pageMeta =
        site.pages.find((p) => p.id === pageId) || site.pages[0];
      // Multi: keep studio nav attrs after polish, then re-apply soft responsive
      out = normalizeCreateAiStudioNav(
        out,
        site.pages.map((p) => ({ id: p.id, label: p.label })),
        pageId,
      );
      if (pageMeta && pageMeta.id !== "home") {
        out = ensureCreateAiInnerPageLayout(out, {
          brandName: brand,
          pageLabel: pageMeta.label,
          pageId: pageMeta.id,
        });
      }
      out = ensureCreateAiResponsive(out);
      out = normalizeCreateAiHeaderBar(out);
    }
    // Re-apply prefs after late header passes (normalize can drop sticky attrs)
    out = applyCreateAiDesignTheme(out, prefs);
    out = applyCreateAiTopBar(out, prefs.topBar, {
      email: payload.email,
      mobile: payload.mobile,
      address: payload.address,
    });
    out = applyCreateAiHeaderSticky(out, wantSticky);
    out = enforceCreateAiHomeSections(
      out,
      prefs,
      brand,
      payload.address || "",
      {
        email: payload.email,
        mobile: payload.mobile,
        address: payload.address,
      },
    );
    // Re-strip leaks after late header passes
    out = stripCreateAiChatWidgets(out);
    out = stripOrphanDuplicateNav(out);
    out = stripDuplicateContactStrips(out);
    out = normalizeCreateAiCopyrightYear(out);
    out = ensureCreateAiHeaderBrand(out, brand, logoSrc);
    out = stripSecondaryHeaderBrands(out, brand);
    out = applyCreateAiQaRails(out, brand, {
      email: payload.email,
      mobile: payload.mobile,
      address: payload.address,
    });
    out = injectCreateAiReferenceFinish(out);
    out = out.replace(
      /\[data-create-ai-topbar=["']1["']\]\s*\{[^}]+\}(\s*@media\s*\([^)]+\)\s*\{\s*\[data-create-ai-topbar=["']1["']\]\s*\{[^}]*\}\s*\})?/gi,
      "",
    );
    if (!isMultiPageType(payload.pageType)) {
      out = syncCreateAiSinglePageNav(out);
      out = ensureSinglePageSectionScroll(out);
    }
    return out;
  };

  const persistSite = (next: CreateAiSite) => {
    setSite(next);
    saveCreateAiSite(next, designId);
  };

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
    if (!designId || !isValidCreateAiDesignId(designId)) {
      router.replace("/user/my-websites");
      return;
    }
    const isResume =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("resume") === "1";
    resumeRef.current = isResume;
    if (!cancelled) setResumeMode(isResume);
    setActiveCreateAiDesignId(designId);
    let stored = getCreateAiPayload(designId);

    // Resume from My Websites: restore full payload + HTML from server (never re-generate on Edit)
    type ServerDesign = {
      designKey?: string;
      title?: string | null;
      brandName?: string | null;
      category?: string | null;
      pageType?: string | null;
      payload?: CreateAiPayload | null;
      site?: CreateAiSite | null;
    };
    let serverRow: ServerDesign | null = null;
    try {
      const res = await fetch(
        `/api/user/create-ai-designs?designKey=${encodeURIComponent(designId)}`,
        { credentials: "include", cache: "no-store" },
      );
      if (res.ok) {
        serverRow = (await res.json().catch(() => null)) as ServerDesign | null;
      }
    } catch {
      /* offline / guest */
    }

    if (
      serverRow?.payload &&
      typeof serverRow.payload === "object" &&
      (serverRow.payload.brandName || serverRow.payload.category)
    ) {
      stored = { ...serverRow.payload, designId };
      saveCreateAiPayload(stored, designId);
    }

    if (
      serverRow?.site &&
      Array.isArray(serverRow.site.pages) &&
      serverRow.site.pages.length > 0
    ) {
      const remoteSite: CreateAiSite = {
        pages: serverRow.site.pages.map((p) => ({
          id: p.id || "home",
          label: p.label || "Home",
          html: p.html || "",
        })),
        activePageId:
          serverRow.site.activePageId ||
          serverRow.site.pages[0]?.id ||
          "home",
      };
      // Server site is source of truth when logged-in row has HTML (resume / restore).
      saveCreateAiSite(remoteSite, designId);
    }

    if (!stored && serverRow) {
      stored = {
        designId,
        brandName:
          (serverRow.brandName || serverRow.title || "Brand").trim() || "Brand",
        description: "",
        category: (serverRow.category || "").trim(),
        websiteRelated: (serverRow.category || "").trim(),
        pageType: (serverRow.pageType || "single").trim() || "single",
        audience: "",
      };
      saveCreateAiPayload(stored, designId);
    }

    // My Websites → Edit: metadata is on server, HTML/payload often local-only.
    // Never bounce to home — hydrate payload so studio can open (and regenerate if needed).
    if (!stored) {
      try {
        const res = await fetch("/api/user/create-ai-designs", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const list = (await res.json().catch(() => [])) as Array<{
            designKey?: string;
            title?: string | null;
            brandName?: string | null;
            category?: string | null;
            pageType?: string | null;
          }>;
          const row = Array.isArray(list)
            ? list.find((d) => d.designKey === designId)
            : undefined;
          if (row) {
            stored = {
              designId,
              brandName: (row.brandName || row.title || "Brand").trim() || "Brand",
              description: "",
              category: (row.category || "").trim(),
              websiteRelated: (row.category || "").trim(),
              pageType: (row.pageType || "single").trim() || "single",
              audience: "",
            };
            saveCreateAiPayload(stored, designId);
          }
        }
      } catch {
        /* offline / guest */
      }
    }

    if (!stored && getCreateAiSite(designId)?.pages?.length) {
      stored = {
        designId,
        brandName: "Brand",
        description: "",
        category: "",
        websiteRelated: "",
        pageType: "single",
        audience: "",
      };
      saveCreateAiPayload(stored, designId);
    }

    if (!stored) {
      if (!cancelled) {
        setStatus("Create with AI draft is missing on this device");
        router.replace("/user/my-websites");
      }
      return;
    }

    if (cancelled) return;
    setPayload(stored);
    const existing = getCreateAiSite(designId);
    if (existing?.pages?.length) {
      const multi = isMultiPageType(stored.pageType);
      const logo = stored.logoImage || "";
      const brand = stored.brandName || "Brand";
      const pages = existing.pages.map((p) => ({
        ...p,
        html: (() => {
          const raw = (p.html || "").trim();
          // Corrupted chat output (blank preview with `"html`) — skip polish save
          if (
            raw.length < 400 ||
            /^["'`]/.test(raw) ||
            /^html\b/i.test(raw) ||
            !/<html\b/i.test(raw)
          ) {
            return p.html;
          }
          let html = fixCreateAiImages(p.html, stored.category);
          html = stripCreateAiChatWidgets(html);
          html = stripDuplicateContactStrips(html);
          html = injectBrandLogo(html, logo, brand);
          html = injectOnboardingContact(html, {
            email: stored.email,
            mobile: stored.mobile,
            address: stored.address,
          });
          html = ensureCreateAiResponsive(html);
          html = normalizeCreateAiHeaderBar(html);
          html = normalizeCreateAiFloatingIfPresent(
            html,
            stored.mobile || "",
            stored.email || "",
          );
          const prefs = normalizeCreateAiDesignPrefs(stored.designPrefs);
          const wantSticky =
            Boolean(prefs.stickyHeader) ||
            /data-create-ai-sticky=["']1["']/i.test(html);
          html = applyCreateAiDesignTheme(html, prefs);
          html = applyCreateAiTopBar(html, prefs.topBar, {
            email: stored.email,
            mobile: stored.mobile,
            address: stored.address,
          });
          html = applyCreateAiHeaderSticky(html, wantSticky);
          html = enforceCreateAiHomeSections(
            html,
            prefs,
            brand,
            stored.address || "",
            {
              email: stored.email,
              mobile: stored.mobile,
              address: stored.address,
            },
          );
          html = applyCreateAiQaRails(html, brand, {
            email: stored.email,
            mobile: stored.mobile,
            address: stored.address,
          });
          html = injectCreateAiReferenceFinish(html);
          if (!multi) {
            html = syncCreateAiSinglePageNav(html);
            html = ensureSinglePageSectionScroll(html);
          }
          if (multi) {
            html = normalizeCreateAiStudioNav(
              html,
              existing.pages.map((x) => ({ id: x.id, label: x.label })),
              existing.activePageId || p.id,
            );
            html = ensureCreateAiResponsive(html);
            html = normalizeCreateAiHeaderBar(html);
            html = applyCreateAiDesignTheme(html, prefs);
            html = applyCreateAiTopBar(html, prefs.topBar, {
              email: stored.email,
              mobile: stored.mobile,
              address: stored.address,
            });
            html = applyCreateAiHeaderSticky(html, wantSticky);
            html = applyCreateAiQaRails(html, brand, {
              email: stored.email,
              mobile: stored.mobile,
              address: stored.address,
            });
            html = injectCreateAiReferenceFinish(html);
          }
          html = stripCreateAiChatWidgets(html);
          html = html.replace(
            /\[data-create-ai-topbar=["']1["']\]\s*\{[^}]+\}(\s*@media\s*\([^)]+\)\s*\{\s*\[data-create-ai-topbar=["']1["']\]\s*\{[^}]*\}\s*\})?/gi,
            "",
          );
          return html;
        })(),
      }));
      const broken = pages.some((p) => {
        const raw = (p.html || "").trim();
        return (
          raw.length < 400 ||
          /^["'`]/.test(raw) ||
          /^html\b/i.test(raw) ||
          !/<html\b/i.test(raw)
        );
      });
      setSite({ ...existing, pages });
      if (!broken) {
        saveCreateAiSite({ ...existing, pages }, designId);
      }
      setBuilding(false);
      setStatus(
        broken
          ? "Preview corrupted by bad AI HTML — Generate with AI again"
          : "Loaded saved Create with AI preview",
      );
      if (broken) {
        setChat((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Preview was corrupted (broken HTML). Use Generate with AI again — invalid HTML is now blocked.",
          },
        ]);
      }
    } else if (isResume) {
      // Edit from My Websites — never auto-regenerate a missing preview
      started.current = true;
      setBuilding(false);
      setStatus(
        "Saved preview not found on this device — click Create with AI to rebuild, or Undo if you still have a local copy.",
      );
      setChat((prev) => [
        ...prev,
        chatMsg(
          "assistant",
          "Edit open ho gaya, lekin pehli preview is device pe save nahi mili. Dobara banane ke liye Create with AI dabao — warna pehle wala HTML sync hone ke baad Edit seedha load karega.",
        ),
      ]);
    }
    if (!cancelled) setBootDone(true);
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [designId, router]);

  useEffect(() => {
    if (!bootDone || !payload || !designId || started.current) return;
    if (resumeRef.current || resumeMode) {
      started.current = true;
      return;
    }
    if (getCreateAiSite(designId)?.pages?.length) {
      started.current = true;
      return;
    }
    started.current = true;

    const bodyBase = {
      brandName: payload.brandName,
      description: payload.description,
      category: payload.category,
      websiteRelated: payload.websiteRelated,
      pageType: payload.pageType,
      audience: payload.audience,
      email: payload.email,
      mobile: payload.mobile,
      address: payload.address,
      designPrefs: normalizeCreateAiDesignPrefs(payload.designPrefs),
    };

    const applyLogo = (html: string) =>
      polishHtml(html);

    const generateOne = async (pageLabel?: string) => {
      const res = await fetch("/api/ai/create-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bodyBase,
          logoImage: (payload.logoImage || "").startsWith("http")
            ? payload.logoImage
            : "",
          ...(pageLabel ? { pageLabel } : {}),
        }),
      });
      const data = (await res.json()) as {
        html?: string;
        provider?: string;
        message?: string;
        error?: string;
        fallback?: boolean;
      };
      if (!res.ok || !data.html) {
        throw new Error(data.error || data.message || "Generate failed");
      }
      return { ...data, html: applyLogo(data.html) };
    };

    void (async () => {
      setBuilding(true);
      const multi = isMultiPageType(payload.pageType);
      setStatus(
        multi
          ? "Generating Home page first (add more pages when ready)…"
          : "Generating single-page site with section scroll…",
      );
      try {
        // Multi-page: first paint = Home only (fast + reliable). User adds pages later.
        const homeData = await generateOne();
        const pages: CreateAiPage[] = [
          {
            id: "home",
            label: "Home",
            html: multi
              ? homeData.html!
              : ensureSinglePageSectionScroll(homeData.html!),
          },
        ];

        persistSite({ pages, activePageId: "home" });
        setProvider(homeData.provider || "");
        setStatus(
          multi
            ? "Home ready — use Add page for About, Services, and more"
            : sanitizeCreateAiStatus(homeData.message) ||
                "Single-page preview ready",
        );
        if (multi) setShowAddPage(true);
        setChat((prev) => [
          ...prev,
          {
            role: "assistant",
            content: multi
              ? "Home page is ready. In multi-page mode we generate Home first — use Add page for About, Services, Gallery, and more. Each page shares Home header and footer."
              : homeData.fallback
                ? "Starter single-page ready. Menu links scroll to sections."
                : "Single-page ready. Click menu items to scroll to sections.",
          },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generate failed";
        setStatus(msg);
        setChat((prev) => [
          ...prev,
          { role: "assistant", content: `Could not generate yet: ${msg}` },
        ]);
      } finally {
        setBuilding(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, designId, bootDone, resumeMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, chatBusy]);

  // Persist chat: always localStorage; logged-in sync also writes DB
  useEffect(() => {
    if (!designId || !chatHydratedRef.current || !chat.length) return;
    saveCreateAiChat(
      chat.map((m) => ({
        role: m.role,
        content: m.content,
        at: m.at,
        imagePreviews: m.imagePreviews,
      })),
      designId,
    );
  }, [chat, designId]);

  // Restore chat from localStorage (guest) / then DB if logged in has more
  useEffect(() => {
    if (!designId) return;
    chatHydratedRef.current = false;
    let cancelled = false;
    const local = getCreateAiChat(designId);
    if (local.length) {
      setChat(
        local.map((m) =>
          chatMsg(m.role, m.content, {
            at: m.at,
            imagePreviews: m.imagePreviews,
          }),
        ),
      );
    }
    chatHydratedRef.current = true;
    void (async () => {
      try {
        const res = await fetch(
          `/api/user/create-ai-designs?designKey=${encodeURIComponent(designId)}`,
          { credentials: "include", cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const row = (await res.json().catch(() => null)) as {
          chat?: Array<{
            role?: string;
            content?: string;
            at?: number;
            imagePreviews?: string[];
          }>;
        } | null;
        const remote = Array.isArray(row?.chat) ? row.chat : [];
        const localLen = getCreateAiChat(designId).length;
        if (remote.length <= localLen) return;
        const mapped = remote
          .filter(
            (m) =>
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string",
          )
          .map((m) =>
            chatMsg(m.role as "user" | "assistant", m.content || "", {
              at: m.at,
              imagePreviews: m.imagePreviews,
            }),
          );
        if (!cancelled && mapped.length) {
          setChat(mapped);
          saveCreateAiChat(
            mapped.map((m) => ({
              role: m.role,
              content: m.content,
              at: m.at,
              imagePreviews: m.imagePreviews,
            })),
            designId,
          );
        }
      } catch {
        /* guest / offline — localStorage only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [designId]);

  const updateActiveHtml = (nextHtml: string, opts?: { skipUndo?: boolean }) => {
    if (!site || !activePage || !payload) return;
    const candidate = (nextHtml || "").trim();
    // Never apply broken AI output that blanks the preview (e.g. `"html`)
    if (
      candidate.length < 400 ||
      /^["'`]/.test(candidate) ||
      /^html\b/i.test(candidate) ||
      !/<html\b/i.test(candidate) ||
      !/<body\b/i.test(candidate)
    ) {
      return;
    }
    const brandName = payload.brandName || "Brand";
    const htmlIn = polishHtml(nextHtml);
    if (
      htmlIn.length < 400 ||
      !/<html\b/i.test(htmlIn) ||
      !/<body\b/i.test(htmlIn)
    ) {
      return;
    }
    if (!opts?.skipUndo && html && html !== htmlIn) {
      setUndoStack((prev) => [...prev.slice(-11), html].slice(-12));
    }
    setPreviewKey((k) => k + 1);

    // Home chrome is source of truth — changing Home restitches every page.
    if (activePage.id === "home") {
      const withHome: CreateAiPage[] = site.pages.map((p) =>
        p.id === "home" ? { ...p, html: htmlIn } : p,
      );
      const restitched = isMulti
        ? restitchAllPagesWithHomeChrome({
            pages: withHome,
            brandName,
          }).map((p) => ({
            ...p,
            html: polishHtml(p.html),
          }))
        : withHome;
      persistSite({ ...site, pages: restitched, activePageId: "home" });
      return;
    }

    const home = site.pages.find((p) => p.id === "home") || site.pages[0];
    const stitched = polishHtml(
      stitchPageWithHomeChrome({
        homeHtml: home.html,
        pageHtml: htmlIn,
        pageLabel: activePage.label,
        pageId: activePage.id,
        brandName,
        pages: site.pages.map((p) => ({ id: p.id, label: p.label })),
      }),
    );
    persistSite({
      ...site,
      pages: site.pages.map((p) =>
        p.id === activePage.id ? { ...p, html: stitched } : p,
      ),
    });
  };

  const openPaidExportModal = () => {
    if (!html) return;
    if (authLoading) return;
    if (!user) {
      loginPurposeRef.current = "export";
      setShowPublishLogin(true);
      return;
    }
    const siteId =
      publishedSiteId ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem(
            `lestow-create-ai-published-site:${designId}`,
          ) || ""
        : "");
    const liveUrl =
      publishedUrl ||
      (typeof window !== "undefined"
        ? window.localStorage.getItem(
            `lestow-create-ai-published-url:${designId}`,
          ) || ""
        : "");
    if (!siteId || !liveUrl) {
      setStatus("Pehle Publish karo — phir Export code (paid) available hoga.");
      setChat((c) => [
        ...c,
        chatMsg(
          "assistant",
          "Export code ke liye pehle Publish karo. Publish ke baad wahi payment popup aayega jo Custom websites pe hota hai.",
        ),
      ]);
      return;
    }
    if (siteId && !publishedSiteId) setPublishedSiteId(siteId);
    if (liveUrl && !publishedUrl) setPublishedUrl(liveUrl);
    let slug = "";
    try {
      const pathname = new URL(liveUrl, window.location.origin).pathname;
      slug = decodeURIComponent(
        pathname.split("/").filter(Boolean).at(-1) || "",
      );
    } catch {
      slug = "";
    }
    if (!slug) {
      setStatus("Published URL missing — Republish karke phir Export try karo.");
      return;
    }
    setExportTarget({
      id: siteId,
      title: payload?.brandName || "Website",
      slug,
    });
    setShowExportModal(true);
  };

  const exportCode = () => openPaidExportModal();
  const exportAllPages = () => openPaidExportModal();

  const undoLastChange = () => {
    if (!undoStack.length || chatBusy) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    // Refund credit for last chat apply when user undoes
    let creditSrc = lastChatCreditSourceRef.current;
    if (
      !creditSrc &&
      orphanChatCreditRefundArmedRef.current &&
      getCreateAiChatCreditBalance(chatCreditUserKey).used > 0
    ) {
      creditSrc = "free";
      orphanChatCreditRefundArmedRef.current = false;
    }
    if (creditSrc) {
      if (refundCreateAiChatCredit(chatCreditUserKey, creditSrc)) {
        setChatCreditTick((n) => n + 1);
      }
      lastChatCreditSourceRef.current = null;
    }
    if (editModeRef.current) {
      const currentSite = siteRef.current;
      if (!currentSite) return;
      const activeId = currentSite.activePageId || currentSite.pages[0]?.id;
      const win = previewIframeRef.current?.contentWindow;
      if (win) {
        editScrollRef.current = { x: win.scrollX, y: win.scrollY };
      }
      editModeSrcDocRef.current = prev;
      setEditFreezeSrcDoc(prev);
      persistSite({
        ...currentSite,
        pages: currentSite.pages.map((p) =>
          p.id === activeId ? { ...p, html: prev } : p,
        ),
      });
      setPreviewKey((k) => k + 1);
      setStatus("Undo — previous edit restored");
      setChat((c) => [
        ...c,
        chatMsg(
          "assistant",
          creditSrc
            ? "Undo — pehla design wapas + 1 credit refund."
            : "Undo — pehla edit wapas.",
        ),
      ]);
      return;
    }
    updateActiveHtml(prev, { skipUndo: true });
    setChat((c) => [
      ...c,
      chatMsg(
        "assistant",
        creditSrc
          ? "Undo — pehla preview wapas + 1 credit refund."
          : "Undo — pehla preview wapas.",
      ),
    ]);
  };

  const capturePreviewVision = async (): Promise<ChatAttachment | null> => {
    const iframe = previewIframeRef.current;
    const body = iframe?.contentDocument?.body;
    if (!body) return null;
    try {
      const dataUrl = await toPng(body, {
        cacheBust: true,
        pixelRatio: 0.45,
        quality: 0.72,
        skipFonts: true,
        width: Math.min(body.scrollWidth || 1000, 1100),
        height: Math.min(Math.max(body.scrollHeight || 800, 600), 1400),
      });
      return await compressScreenshotDataUrl(dataUrl);
    } catch {
      return null;
    }
  };

  const selectPage = (pageId: string) => {
    if (!site) return;
    if (editMode) {
      // Flush edit before switching pages
      const doc = previewIframeRef.current?.contentDocument;
      if (doc?.documentElement) {
        const nextHtml = `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
        persistSite({
          ...site,
          activePageId: pageId,
          pages: site.pages.map((p) =>
            p.id === site.activePageId ? { ...p, html: nextHtml } : p,
          ),
        });
      } else {
        persistSite({ ...site, activePageId: pageId });
      }
      editModeSrcDocRef.current = "";
      setEditFreezeSrcDoc("");
      setPreviewKey((k) => k + 1);
      return;
    }
    persistSite({ ...site, activePageId: pageId });
  };

  const readIframeHtml = () => {
    const doc = previewIframeRef.current?.contentDocument;
    if (!doc?.documentElement) return "";
    try {
      return serializeCreateAiEditDocument(doc);
    } catch {
      return stripCreateAiEditChrome(
        `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`,
      );
    }
  };

  const persistActivePageHtml = (nextHtml: string) => {
    const currentSite = siteRef.current;
    if (!currentSite || nextHtml.length < 80) return;
    const activeId = currentSite.activePageId || currentSite.pages[0]?.id;
    if (!activeId) return;
    const current = currentSite.pages.find((p) => p.id === activeId)?.html || "";
    if (current === nextHtml) return;
    // Snapshot for Undo (edit mode + chat share same stack)
    if (current.length > 80) {
      setUndoStack((prev) => [...prev.slice(-11), current].slice(-12));
    }
    setEditSaving(true);
    persistSite({
      ...currentSite,
      pages: currentSite.pages.map((p) =>
        p.id === activeId ? { ...p, html: nextHtml } : p,
      ),
    });
    setStatus("Edit mode — auto-saved");
    window.setTimeout(() => setEditSaving(false), 600);
  };

  const autosaveEditModeHtml = () => {
    if (!editModeRef.current) return;
    // Persist only — never update iframe srcDoc (that reloads and jumps to top).
    persistActivePageHtml(readIframeHtml());
  };

  /** Persist + refresh rails in-place — do not remount iframe (scroll stays). */
  const syncEditModeDom = () => {
    syncEditDomRef.current?.();
  };

  const refreshEditModePreview = (nextHtml: string) => {
    const win = previewIframeRef.current?.contentWindow;
    if (win) {
      editScrollRef.current = { x: win.scrollX, y: win.scrollY };
    }
    editModeSrcDocRef.current = nextHtml;
    setEditFreezeSrcDoc(nextHtml);
    persistActivePageHtml(nextHtml);
    setPreviewKey((k) => k + 1);
  };

  const onEditMediaPicked = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const target = editMediaTargetRef.current;
    editMediaTargetRef.current = null;
    if (!target) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    }).catch(() => "");
    if (!dataUrl) return;
    applyCreateAiReplacedMedia(target, dataUrl);
    autosaveEditModeHtml();
  };

  const applyAddSectionKind = (kind: CreateAiEditSectionKind) => {
    const doc = previewIframeRef.current?.contentDocument;
    if (!doc || addSectionAfterIndex == null) return;
    insertCreateAiEditSection(doc, addSectionAfterIndex, kind);
    setAddSectionAfterIndex(null);
    syncEditModeDom();
  };

  const applyEditBg = () => {
    const doc = previewIframeRef.current?.contentDocument;
    if (!doc || editBgIndex == null) return;
    applyCreateAiSectionBackground(doc, editBgIndex, {
      color: editBgColor.trim() || undefined,
      imageUrl: editBgImageUrl.trim() || undefined,
    });
    setEditBgIndex(null);
    setEditBgImageUrl("");
    syncEditModeDom();
  };

  const applyEditYoutube = () => {
    const doc = previewIframeRef.current?.contentDocument;
    if (!doc || editYtIndex == null) return;
    const url = editYtUrl.trim();
    if (!url) return;
    applyCreateAiSectionYoutube(doc, editYtIndex, url);
    setEditYtIndex(null);
    setEditYtUrl("");
    syncEditModeDom();
  };

  const toggleEditMode = () => {
    if (!html) return;
    if (editMode) {
      if (editSaveTimer.current) {
        clearTimeout(editSaveTimer.current);
        editSaveTimer.current = null;
      }
      const nextHtml = readIframeHtml();
      persistActivePageHtml(nextHtml);
      editModeSrcDocRef.current = "";
      setEditFreezeSrcDoc("");
      setAddSectionAfterIndex(null);
      setEditBgIndex(null);
      setEditYtIndex(null);
      setEditMode(false);
      persistEditModeFlag(false);
      setStatus("Edit mode Off");
      return;
    }
    const freeze = previewHtml || html;
    editModeSrcDocRef.current = freeze;
    setEditFreezeSrcDoc(freeze);
    setEditMode(true);
    persistEditModeFlag(true);
    setStatus(
      "Edit mode On — text, images, Bg, Video, + Item, Delete. Nav/chat/responsive paused.",
    );
  };

  // Preview guard + optional designMode for manual edit
  useEffect(() => {
    if (!previewHtml && !editMode) return;
    const iframe = previewIframeRef.current;
    if (!iframe) return;

    const bind = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const scheduleSave = () => {
        if (!editModeRef.current) return;
        if (editSaveTimer.current) clearTimeout(editSaveTimer.current);
        editSaveTimer.current = setTimeout(() => {
          autosaveEditModeHtml();
        }, 700);
      };

      let editCleanup: (() => void) | undefined;

      const installHooks = () => ({
        onDirty: () => {
          syncEditDomRef.current?.();
        },
        onPersist: () => {
          persistActivePageHtml(readIframeHtml());
        },
        onRequestAddSection: (afterIndex: number) => {
          setAddSectionAfterIndex(afterIndex);
        },
        onReplaceMedia: (el: HTMLImageElement | SVGElement) => {
          editMediaTargetRef.current = el;
          editMediaInputRef.current?.click();
        },
        onRequestBg: (sectionIndex: number) => {
          setEditBgIndex(sectionIndex);
          setEditBgColor("#0f172a");
          setEditBgImageUrl("");
        },
        onRequestYoutube: (sectionIndex: number) => {
          setEditYtIndex(sectionIndex);
          setEditYtUrl("");
        },
      });

      if (editMode) {
        try {
          doc.designMode = "on";
        } catch {
          /* ignore */
        }
        doc.addEventListener("input", scheduleSave, true);
        doc.addEventListener("keyup", scheduleSave, true);
        doc.addEventListener("paste", scheduleSave, true);
        editCleanup = installCreateAiEditMode(doc, installHooks());
        syncEditDomRef.current = () => {
          const win = iframe.contentWindow;
          const x = win?.scrollX ?? 0;
          const y = win?.scrollY ?? 0;
          editCleanup?.();
          editCleanup = installCreateAiEditMode(doc, installHooks());
          // Persist to site only — do NOT change React srcDoc (reload → scroll top).
          persistActivePageHtml(readIframeHtml());
          requestAnimationFrame(() => {
            win?.scrollTo(x, y);
            requestAnimationFrame(() => win?.scrollTo(x, y));
          });
        };
        // Restore scroll after remount (Undo / rare refresh)
        const { x, y } = editScrollRef.current;
        if (x || y) {
          requestAnimationFrame(() => {
            iframe.contentWindow?.scrollTo(x, y);
            requestAnimationFrame(() => {
              iframe.contentWindow?.scrollTo(x, y);
              editScrollRef.current = { x: 0, y: 0 };
            });
          });
        }
      } else {
        syncEditDomRef.current = null;
        try {
          doc.designMode = "off";
        } catch {
          /* ignore */
        }
      }

      const onClick = (event: MouseEvent) => {
        const t = event.target as Element | null;
        if (!t) return;

        if (editModeRef.current) {
          // Edit chrome rails / media handled by installCreateAiEditMode
          if (t.closest?.("[data-cai-edit-chrome='1']")) return;
          if (t.closest?.("img, svg")) return;

          // Always kill navigation (hash / page / external) in edit mode
          const a = t.closest?.("a");
          if (a) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
          const interactive = t.closest?.(
            "button, [role='button'], nav, [data-cai-menu-btn], [data-cai-mobile-panel], [data-slider], [data-carousel], .swiper, .swiper-button-next, .swiper-button-prev, .swiper-pagination, [class*='slider'], [class*='carousel'], [class*='slick']",
          );
          if (interactive) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
          }
          return;
        }

        const a = t.closest?.("a") as HTMLAnchorElement | null;
        if (!a) return;
        const pageId = a.getAttribute("data-create-ai-page");
        if (pageId) {
          event.preventDefault();
          event.stopPropagation();
          if (!isMulti || !siteRef.current) return;
          selectPage(pageId);
          return;
        }
        const href = (a.getAttribute("href") || "").trim();
        if (/^#/.test(href) || /^(tel:|mailto:)/i.test(href)) return;
        event.preventDefault();
        event.stopPropagation();
      };
      doc.addEventListener("click", onClick, true);
      return () => {
        doc.removeEventListener("click", onClick, true);
        doc.removeEventListener("input", scheduleSave, true);
        doc.removeEventListener("keyup", scheduleSave, true);
        doc.removeEventListener("paste", scheduleSave, true);
        editCleanup?.();
        try {
          doc.designMode = "off";
        } catch {
          /* ignore */
        }
      };
    };

    let cleanup: (() => void) | undefined;
    const onLoad = () => {
      cleanup?.();
      try {
        const loc = iframe.contentWindow?.location?.href || "";
        if (loc && !/^about:(srcdoc|blank)/i.test(loc)) {
          if (!editModeRef.current) iframe.srcdoc = previewHtml;
          return;
        }
      } catch {
        if (!editModeRef.current) iframe.srcdoc = previewHtml;
        return;
      }
      cleanup = bind();
    };
    iframe.addEventListener("load", onLoad);
    cleanup = bind();
    return () => {
      iframe.removeEventListener("load", onLoad);
      cleanup?.();
      if (editSaveTimer.current) clearTimeout(editSaveTimer.current);
    };
    // While Edit mode is on, ignore previewHtml churn from autosave (that was
    // rebinding/remounting and jumping scroll to top). Remount via previewKey only.
  }, [isMulti, editMode, previewKey, editMode ? "" : previewHtml]);

  const addPage = async (labelRaw: string) => {
    const label = labelRaw.trim();
    if (!label || !payload || !site || pageBusy) return;
    if (site.pages.some((p) => p.label.toLowerCase() === label.toLowerCase())) {
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: `"${label}" page already exists.` },
      ]);
      return;
    }
    setPageBusy(true);
    setShowAddPage(false);
    setCustomPageName("");
    setChat((prev) => [
      ...prev,
      { role: "assistant", content: `Creating "${label}" page…` },
    ]);
    try {
      const res = await fetch("/api/ai/create-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: payload.brandName,
          description: payload.description,
          category: payload.category,
          websiteRelated: payload.websiteRelated,
          pageType: payload.pageType,
          audience: payload.audience,
          email: payload.email,
          mobile: payload.mobile,
          address: payload.address,
          pageLabel: label,
          designPrefs: normalizeCreateAiDesignPrefs(payload.designPrefs),
        }),
      });
      const data = (await res.json()) as {
        html?: string;
        error?: string;
        provider?: string;
      };
      if (!res.ok || !data.html) {
        throw new Error(data.error || "Could not create page");
      }
      const pageId = slugPageId(label);
      const brandName = payload.brandName || "Brand";
      const draftPages = [
        ...site.pages,
        {
          id: pageId,
          label,
          html: polishHtml(data.html),
        },
      ];
      const restitched = restitchAllPagesWithHomeChrome({
        pages: draftPages,
        brandName,
      }).map((p) => ({
        ...p,
        html: polishHtml(p.html),
      }));
      persistSite({
        pages: restitched,
        activePageId: pageId,
      });
      if (data.provider) setProvider(data.provider);
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `"${label}" page is ready — Home header/footer applied on all pages.`,
        },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Create page failed";
      setChat((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setPageBusy(false);
    }
  };

  const addAttachments = (items: ChatAttachment[]) => {
    setAttachments((prev) => [...prev, ...items].slice(0, 2));
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: ChatAttachment[] = [];
    for (const file of Array.from(files).slice(0, 2)) {
      if (!file.type.startsWith("image/")) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      });
      const att = await compressScreenshotDataUrl(dataUrl);
      if (att) next.push(att);
    }
    if (next.length) addAttachments(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPasteScreenshot = (event: ClipboardEvent<HTMLInputElement>) => {
    if (chatBusy || !html || attachments.length >= 2) return;
    const items = event.clipboardData?.items;
    if (!items?.length) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
      const file = item.getAsFile();
      if (file) imageFiles.push(file);
    }
    if (!imageFiles.length) return;
    event.preventDefault();
    const dt = new DataTransfer();
    for (const f of imageFiles.slice(0, 2 - attachments.length)) {
      dt.items.add(f);
    }
    void onPickFiles(dt.files);
  };

  const sendChat = async (event?: FormEvent) => {
    event?.preventDefault();
    const message = input.trim();
    if (editMode) {
      setChat((prev) => [
        ...prev,
        chatMsg(
          "assistant",
          "Edit mode on hai — pehle Edit mode band karo, phir chat use karo.",
        ),
      ]);
      return;
    }
    if ((!message && attachments.length === 0) || chatBusy || !html) return;

    const balance = getCreateAiChatCreditBalance(chatCreditUserKey);
    if (balance.total <= 0) {
      setChat((prev) => [
        ...prev,
        chatMsg(
          "user",
          message ||
            (attachments.length
              ? `Apply design from ${attachments.length} screenshot(s)`
              : ""),
        ),
        chatMsg(
          "assistant",
          `Free ${CREATE_AI_FREE_CHAT_CREDITS} chat credits khatam ho gaye. Buy credits to continue refining.`,
        ),
      ]);
      if (!user) {
        loginPurposeRef.current = "credits";
        setShowPublishLogin(true);
      } else {
        setShowBuyCredits(true);
      }
      return;
    }

    let pending = [...attachments];
    setInput("");
    setAttachments([]);
    setChatBusy(true);

    const chatMode = pickCreateAiChatMode(message, pending.length > 0);

    const phaseList =
      chatMode === "quality"
        ? ["Editing…", "QA loop…", "Applying preview…"]
        : isFastChatIntent(message) || isMicroTextColorAsk(message)
          ? ["Quick edit…", "Applying…"]
          : ["Editing…", "QA check…", "Applying preview…"];
    let phaseIdx = 0;
    setChatPhase(phaseList[0]);
    const phaseTimer = window.setInterval(() => {
      phaseIdx = Math.min(phaseIdx + 1, phaseList.length - 1);
      setChatPhase(phaseList[phaseIdx]);
    }, chatMode === "speed" ? 1600 : 2400);

    if (!pending.length) {
      // Quality / complex asks: auto screenshot for vision QA
      const wantVision =
        chatMode === "quality" && !isFastChatIntent(message);
      if (wantVision) {
        const snap = await capturePreviewVision();
        if (snap) pending = [snap];
      }
    }

    // Logo asks: shrink image so HTML inject doesn't trip broken-HTML guard
    if (pending.length && isLogoReplaceAsk(message || "logo")) {
      const shrunk: ChatAttachment[] = [];
      for (const att of pending) {
        const dataUrl = `data:${att.mimeType};base64,${att.base64}`;
        const small = await compressLogoDataUrl(dataUrl);
        shrunk.push(small || att);
      }
      pending = shrunk;
    } else if (pending.length && isHeroBannerImageAsk(message)) {
      // Banner/hero still: keep readable cover, under inject size guard (~350k)
      const shrunk: ChatAttachment[] = [];
      for (const att of pending) {
        const dataUrl = `data:${att.mimeType};base64,${att.base64}`;
        const small = await compressScreenshotDataUrl(dataUrl, 960, 0.78);
        shrunk.push(small || att);
      }
      pending = shrunk;
    }

    const imagePreviews = pending.map((a) => a.previewUrl);
    // User-attached reference must reach the API — never drop for "fast" section intents
    // (was pasting default testimonials while ignoring the screenshot).
    // Only skip vision upload for tiny text/color micro-asks on Speed.
    const sendImages =
      chatMode === "speed" &&
      isMicroTextColorAsk(message) &&
      pending.length > 0 &&
      !/match\s*(this|screenshot|design)|jaise|as\s*shown|reference|section|testimonial|team|faq|pricing/i.test(
        message,
      )
        ? []
        : pending;
    setChat((prev) => [
      ...prev,
      chatMsg(
        "user",
        message ||
          (pending.length
            ? `Apply design from ${pending.length} screenshot(s)`
            : ""),
        { imagePreviews: imagePreviews.length ? imagePreviews : undefined },
      ),
    ]);
    const wantsImages =
      /image|images|img|photo|photos|portrait|tasveer|pic\b|picture/i.test(
        message,
      );
    const wantsDedupeContact =
      /remove|hata|duplicate|dobara|kai bar|bar bar|repeat|extra contact/i.test(
        message,
      );

    try {
      if (tokensUsed >= TOKEN_SOFT_CAP && !tokenWarnShown.current) {
        tokenWarnShown.current = true;
        setChat((prev) => [
          ...prev,
          chatMsg(
            "assistant",
            `Token soft cap (~${TOKEN_SOFT_CAP}) is near — short asks keep replies faster.`,
          ),
        ]);
      }
      // Instant cleanup for contact spam (don't wait on AI claim "applied")
      if (wantsDedupeContact || wantsImages) {
        updateActiveHtml(html);
      }
      if (
        wantsDedupeContact &&
        !pending.length &&
        /remove|hata|duplicate|kai bar|bar bar/i.test(message)
      ) {
        setChat((prev) => [
          ...prev,
          chatMsg(
            "assistant",
            "Duplicate contact lines removed — one Contact details block remains.",
          ),
        ]);
        // Still ask AI to clean page copy, but UI already fixed
      }

      const runChat = async () => {
        const res = await fetch("/api/ai/create-site-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html,
            message,
            brandName: payload?.brandName,
            category: payload?.category,
            email: payload?.email,
            mobile: payload?.mobile,
            address: payload?.address,
            qualityMode: chatMode,
            topBar: Boolean(
              normalizeCreateAiDesignPrefs(payload?.designPrefs).topBar,
            ),
            history: chat
              .slice(chatMode === "speed" ? -6 : -12)
              .map(({ role, content }) => ({ role, content })),
            images: sendImages.map((a) => ({
              mimeType: a.mimeType,
              base64: a.base64,
            })),
          }),
        });
        const data = (await res.json()) as {
          html?: string;
          reply?: string;
          error?: string;
          applied?: boolean;
          provider?: string;
          model?: string;
          tokensUsed?: number;
          mode?: string;
          logoImage?: string;
        };
        return { res, data };
      };

      let { res, data } = await runChat();
      // Auto-retry once on hard failure (skip on speed for simple intents)
      if (
        (!res.ok || (data.applied === false && !data.html)) &&
        !(chatMode === "speed" && isFastChatIntent(message))
      ) {
        setChatPhase("Retry · QA loop…");
        ({ res, data } = await runChat());
      }

      if (!res.ok && !data.html) {
        throw new Error(data.error || "Chat failed");
      }
      const next = (data.html || "").trim();
      const applied = data.applied !== false && Boolean(next) && next !== html;
      // Charge only when preview actually changed
      if (applied) {
        const src = consumeCreateAiChatCredit(chatCreditUserKey);
        if (src) {
          lastChatCreditSourceRef.current = src;
          setChatCreditTick((n) => n + 1);
        }
      }
      if (data.tokensUsed) setTokensUsed((t) => t + (data.tokensUsed || 0));
      if (
        data.logoImage &&
        data.logoImage.startsWith("data:image") &&
        payload
      ) {
        const nextPayload = { ...payload, logoImage: data.logoImage };
        setPayload(nextPayload);
        saveCreateAiPayload(nextPayload, designId);
      }
      // Persist sticky pref when chat enables it (polish must not strip it next)
      if (
        payload &&
        (data.mode === "header-sticky" ||
          /header sticky/i.test(data.reply || "") ||
          /data-create-ai-sticky=["']1["']/i.test(next))
      ) {
        const prefs = normalizeCreateAiDesignPrefs(payload.designPrefs);
        if (!prefs.stickyHeader) {
          const nextPayload = {
            ...payload,
            designPrefs: { ...prefs, stickyHeader: true },
          };
          setPayload(nextPayload);
          saveCreateAiPayload(nextPayload, designId);
        }
      }
      if (applied) {
        setChatPhase("Applying preview…");
        updateActiveHtml(next);
        setChat((prev) => [
          ...prev,
          chatMsg(
            "assistant",
            data.reply || "Preview update ho gaya — check karo.",
          ),
        ]);
      } else {
        setChat((prev) => [
          ...prev,
          chatMsg(
            "assistant",
            data.reply ||
              data.error ||
              "Change apply nahi hua — clear bolo kya fix/add/remove karna hai.",
          ),
        ]);
      }
      if (data.provider) setProvider(data.provider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Chat failed";
      setChat((prev) => [
        ...prev,
        chatMsg("assistant", `${msg} — short specific request try karo.`),
      ]);
    } finally {
      window.clearInterval(phaseTimer);
      setChatBusy(false);
      setChatPhase("");
    }
  };

  const purchaseCreateAiChatCredits = async (packId: CreateAiChatCreditPackId) => {
    if (!user) {
      loginPurposeRef.current = "credits";
      setShowPublishLogin(true);
      return;
    }
    setBuyingCreditPack(true);
    try {
      const orderResponse = await fetch(
        "/api/user/payments/razorpay/create-ai-chat-credits-order",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packId }),
        },
      );
      const orderData = (await orderResponse.json().catch(() => ({}))) as {
        mock?: boolean;
        keyId?: string;
        orderId?: string;
        amount?: number;
        currency?: string;
        customerId?: string;
        credits?: number;
        displayPrice?: string;
        message?: string;
      };
      if (!orderResponse.ok || !orderData.orderId || !orderData.keyId) {
        throw new Error(orderData.message || "Unable to start credit purchase.");
      }

      const finish = async (payment: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        const verifyRes = await fetch(
          "/api/user/payments/razorpay/create-ai-chat-credits-verify",
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payment,
              packId,
            }),
          },
        );
        const verifyData = (await verifyRes.json().catch(() => ({}))) as {
          ok?: boolean;
          credits?: number;
          message?: string;
        };
        if (!verifyRes.ok || !verifyData.ok) {
          throw new Error(verifyData.message || "Payment verify failed.");
        }
        const credits = Number(verifyData.credits || orderData.credits || 0);
        const pack = getCreateAiChatCreditPack(packId);
        recordCreateAiChatCreditPurchase(chatCreditUserKey, {
          packId,
          credits,
          amountInr: pack?.priceInr || 0,
          paymentId: payment.razorpay_payment_id,
          orderId: payment.razorpay_order_id,
        });
        setChatCreditTick((n) => n + 1);
        setShowBuyCredits(false);
        setChat((prev) => [
          ...prev,
          chatMsg(
            "assistant",
            `${credits} chat credits add ho gaye. Invoice Billing mein mil jayegi.`,
          ),
        ]);
      };

      if (orderData.mock) {
        await finish({
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_order_id: orderData.orderId,
          razorpay_signature: "mock",
        });
        return;
      }

      await waitForRazorpayScript();
      const payment = await openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount ?? 0,
        currency: orderData.currency ?? "INR",
        customerId: orderData.customerId,
        rememberCustomer: Boolean(orderData.customerId),
        name: "Lestow",
        description: `Create with AI chat credits · ${orderData.displayPrice || ""}`,
        prefill: buildRazorpayPrefill(user),
        notes: {
          purpose: "create_ai_chat_credits",
          packId,
        },
      });
      await finish(payment);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Credit purchase failed";
      setChat((prev) => [...prev, chatMsg("assistant", msg)]);
    } finally {
      setBuyingCreditPack(false);
    }
  };

  const pageTypeLabel = isMulti ? "Multi-page website" : "Single-page website";
  const userInitial = (user?.name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();
  const displayPublishedUrl = (publishedUrl || "").replace(/^https?:\/\//, "");

  const getPublishedSlug = (url: string) => {
    if (!url) return "";
    try {
      const pathname = new URL(url, window.location.origin).pathname;
      return decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) || "");
    } catch {
      return "";
    }
  };

  const normalizePublishedSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleCopyPublishedUrl = async () => {
    if (!publishedUrl) return;
    try {
      await window.navigator.clipboard.writeText(publishedUrl);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = publishedUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    setShowCopiedMessage(true);
    window.setTimeout(() => setShowCopiedMessage(false), 2200);
  };

  const handleStartPublishedUrlEdit = () => {
    if (!publishedUrl) {
      setPublishedUrlError("Publish your website before editing its URL.");
      return;
    }
    setPublishedSlugDraft(getPublishedSlug(publishedUrl));
    setPublishedUrlError("");
    setPublishedUrlSaved(false);
    setIsEditingPublishedUrl(true);
  };

  const handleSavePublishedUrl = async () => {
    if (isSavingPublishedUrl) return;
    const slug = normalizePublishedSlug(publishedSlugDraft);
    if (slug.length < 3 || slug.length > 60) {
      setPublishedUrlError("Use 3 to 60 letters, numbers, or hyphens.");
      return;
    }
    const siteId =
      publishedSiteId ||
      (designId
        ? window.localStorage.getItem(
            `lestow-create-ai-published-site:${designId}`,
          )
        : null);
    if (!siteId) {
      setPublishedUrlError("Website not found. Publish it once and try again.");
      return;
    }

    setIsSavingPublishedUrl(true);
    setPublishedUrlError("");
    setPublishedUrlSaved(false);
    try {
      const response = await fetch(`/api/user/sites/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        slug?: string;
        message?: string;
      };
      if (!response.ok || !data.slug) {
        throw new Error(data.message || "Unable to update website URL");
      }
      const nextUrl = `${window.location.origin}/published/${data.slug}`;
      setPublishedUrl(nextUrl);
      setPublishedSiteUrl(nextUrl);
      setPublishedSlugDraft(data.slug);
      setIsEditingPublishedUrl(false);
      setPublishedUrlSaved(true);
      try {
        window.localStorage.setItem(
          `lestow-create-ai-published-url:${designId}`,
          nextUrl,
        );
      } catch {
        /* ignore */
      }
    } catch (error) {
      setPublishedUrlError(
        error instanceof Error ? error.message : "Unable to update website URL",
      );
    } finally {
      setIsSavingPublishedUrl(false);
    }
  };

  const publishCreateAiSite = async () => {
    if (authLoading || publishing) return;
    if (!user) {
      loginPurposeRef.current = "publish";
      setShowPublishLogin(true);
      return;
    }
    if (!designId || !payload || !site?.pages?.length || !html) {
      setStatus("Generate / load preview pehle, phir Publish.");
      return;
    }

    setPublishing(true);
    setStatus("Publishing Create with AI site…");
    try {
      await flushCreateAiDesignSync(designId);
      const prefs = normalizeCreateAiDesignPrefs(payload.designPrefs);
      const polishedPages = site.pages.map((page) => ({
        id: page.id,
        label: page.label,
        html: polishCreateAiExportHtml(
          applyCreateAiTopBar(page.html || "", Boolean(prefs.topBar), {
            email: payload.email,
            mobile: payload.mobile,
            address: payload.address,
          }),
          payload.brandName,
          {
            email: payload.email,
            mobile: payload.mobile,
            address: payload.address,
            homeSections: prefs.homeSections,
          },
        ),
      }));
      const createAiSitePayload = {
        pages: polishedPages,
        activePageId: site.activePageId || polishedPages[0]?.id || "home",
      };
      const mapKey = `lestow-create-ai-published-site:${designId}`;
      const urlKey = `lestow-create-ai-published-url:${designId}`;
      let existingSiteId = "";
      try {
        // Only this Create-AI design's site — never reuse custom/redesign active site
        existingSiteId = window.localStorage.getItem(mapKey) || "";
      } catch {
        existingSiteId = "";
      }

      const brand = (payload.brandName || "Website").trim();
      const category = (payload.category || "Create with AI").trim();
      const migrateRes = await fetch("/api/user/sites/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: brand,
          templateId: "create-ai",
          category,
          siteId: existingSiteId || undefined,
          config: {
            templateId: "create-ai",
            category,
            clientUpdatedAt: Date.now(),
            pageLinks: polishedPages.map((page) => ({
              label: page.label,
              href: page.id === "home" ? "#" : `#page-${page.id}`,
            })),
            sections: [
              {
                id: "create-ai-home",
                type: "CreateAiHtml",
                page: "",
                data: {},
              },
            ],
            templateVariables: { "--lestow-create-path": "create-ai" },
            businessInfo: {
              name: brand,
              description: payload.description || "",
              audience: payload.audience || "",
            },
            createPath: "create-ai",
            designId,
            createAiSite: createAiSitePayload,
          },
        }),
      });
      const migrated = (await migrateRes.json().catch(() => ({}))) as {
        id?: string;
        slug?: string;
        message?: string;
      };
      if (!migrateRes.ok || !migrated.id || !migrated.slug) {
        throw new Error(migrated.message || "Unable to save site for publish");
      }

      setUserActiveSiteId(migrated.id);
      setPublishedSiteId(migrated.id);
      try {
        window.localStorage.setItem(mapKey, migrated.id);
      } catch {
        /* ignore */
      }

      const pubRes = await fetch(`/api/user/sites/${migrated.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!pubRes.ok) {
        const err = (await pubRes.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(err.message || "Publish failed");
      }

      const liveUrl = `${window.location.origin}/published/${migrated.slug}`;
      setPublishedSiteUrl(liveUrl);
      setPublishedUrl(liveUrl);
      setIsEditingPublishedUrl(false);
      setPublishedUrlError("");
      setPublishedUrlSaved(false);
      setShowCopiedMessage(false);
      setShowPublishedPopup(true);
      setStatus("Published — live URL ready");
      try {
        window.localStorage.setItem(urlKey, liveUrl);
      } catch {
        /* ignore */
      }
      // Mark Create-AI design published so My Websites doesn't keep a Draft twin
      try {
        await fetch("/api/user/create-ai-designs", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            designKey: designId,
            title: brand,
            brandName: brand,
            category,
            pageType: payload.pageType || "single",
            pageCount: polishedPages.length,
            pageLabels: polishedPages.map((p) => p.label),
            status: "published",
            payload,
            site: createAiSitePayload,
          }),
        });
      } catch {
        /* ignore — Site already published */
      }
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : "Publish failed — try again",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-[#0b1220] text-white">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-xs text-white/80 hover:bg-white/5"
          >
            <ArrowLeft size={14} /> Home
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              Create with AI
              {payload?.brandName ? ` · ${payload.brandName}` : ""}
            </p>
            <p className="truncate text-[11px] text-white/50">
              {payload?.category ? (
                <span className="text-violet-300/90">
                  Category: {payload.category}
                  <span className="text-white/35"> · </span>
                </span>
              ) : null}
              {sanitizeCreateAiStatus(status)}
              {(() => {
                const engine = friendlyAiEngineLabel(provider);
                const clean = sanitizeCreateAiStatus(status).toLowerCase();
                if (!engine) return "";
                if (
                  clean.includes(engine.toLowerCase()) ||
                  clean.includes("draft") ||
                  clean.includes("preview ready")
                ) {
                  return "";
                }
                return ` · ${engine}`;
              })()}
              {tokensUsed > 0 ? ` · ~${tokensUsed} tok` : ""}
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="text-xs font-semibold text-white/80">Edit Mode</span>
          <div className="inline-flex items-center rounded-lg border border-white/15 bg-black/20 p-0.5">
            <button
              type="button"
              onClick={() => {
                if (editMode) toggleEditMode();
              }}
              disabled={!html || building || !editMode}
              title="Turn Edit mode Off"
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                !editMode
                  ? "bg-white/15 text-white"
                  : "text-white/55 hover:text-white/90"
              }`}
            >
              Off
            </button>
            <button
              type="button"
              onClick={() => {
                if (!editMode) toggleEditMode();
              }}
              disabled={!html || building || editMode}
              title="Turn Edit mode On"
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
                editMode
                  ? "bg-amber-400 text-zinc-950"
                  : "text-white/55 hover:text-white/90"
              }`}
            >
              <Pencil size={12} />
              {editSaving ? "Saving…" : "On"}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <div className="inline-flex items-center gap-1.5 sm:hidden">
            <span className="text-[10px] font-semibold text-white/75">
              Edit Mode
            </span>
            <div className="inline-flex items-center rounded-lg border border-white/15 bg-black/20 p-0.5">
            <button
              type="button"
              onClick={() => {
                if (editMode) toggleEditMode();
              }}
              disabled={!html || building || !editMode}
              className={`rounded-md px-2 py-1.5 text-[11px] font-semibold disabled:opacity-40 ${
                !editMode ? "bg-white/15 text-white" : "text-white/55"
              }`}
            >
              Off
            </button>
            <button
              type="button"
              onClick={() => {
                if (!editMode) toggleEditMode();
              }}
              disabled={!html || building || editMode}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold disabled:opacity-40 ${
                editMode ? "bg-amber-400 text-zinc-950" : "text-white/55"
              }`}
            >
              <Pencil size={11} /> On
            </button>
            </div>
          </div>
          <div className="inline-flex items-center rounded-lg border border-white/15 bg-black/20 p-0.5">
            {(
              [
                { id: "desktop", Icon: Monitor, label: "Desktop" },
                { id: "tablet", Icon: Tablet, label: "Tablet" },
                { id: "mobile", Icon: Smartphone, label: "Mobile" },
              ] as const
            ).map(({ id, Icon, label }) => (
              <button
                key={id}
                type="button"
                title={
                  editMode
                    ? "Exit Edit mode to change responsive view"
                    : `Responsive: ${label}`
                }
                disabled={editMode}
                onClick={() => setViewport(id)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  viewport === id
                    ? "bg-white/15 text-white"
                    : "text-white/55 hover:text-white/90"
                }`}
              >
                <Icon size={14} />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
              isMulti
                ? "bg-sky-500/20 text-sky-200"
                : "bg-emerald-500/20 text-emerald-200"
            }`}
            title={pageTypeLabel}
          >
            {isMulti ? <FileStack size={12} /> : <FileText size={12} />}
            {pageTypeLabel}
          </span>
          <button
            type="button"
            onClick={undoLastChange}
            disabled={!undoStack.length || chatBusy}
            title={
              editMode
                ? "Undo last edit-mode change"
                : "Undo last chat change"
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-40"
          >
            <Undo2 size={14} /> Undo
          </button>
          <button
            type="button"
            onClick={exportCode}
            disabled={!html}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-40"
          >
            <Code2 size={14} /> Export code
          </button>
          {isMulti && (site?.pages.length || 0) > 1 ? (
            <button
              type="button"
              onClick={exportAllPages}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/10"
            >
              <Download size={14} /> Export all (ZIP)
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void publishCreateAiSite()}
            disabled={publishing || building || !html}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Rocket size={14} />
            )}
            {publishedUrl ? "Republish" : "Publish"}
          </button>
          {user ? (
            <div className="relative" data-create-ai-user-menu>
              <button
                type="button"
                aria-label="Open account menu"
                aria-expanded={showUserMenu}
                title={user.name || user.email}
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/15 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/25"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  userInitial || <UserRound size={16} />
                )}
              </button>
              {showUserMenu ? (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[10010] w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0f172a] shadow-xl">
                  <div className="border-b border-white/10 px-4 py-3">
                    <p className="truncate text-sm font-semibold text-white">
                      {user.name || "Your account"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/55">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/user/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2 border-b border-white/10 px-4 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/5"
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      void logout();
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-white/85 transition hover:bg-white/5"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPublishLogin(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25"
              title="Login"
              aria-label="Login"
            >
              <UserRound size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Multi-page strip */}
      {isMulti ? (
        <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#0f172a] px-3 py-2">
          {(site?.pages || [{ id: "home", label: "Home", html: "" }]).map(
            (p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPage(p.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activePage?.id === p.id
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={pageBusy || building || !html}
            onClick={() => setShowAddPage((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-white/25 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-violet-400 hover:text-white disabled:opacity-40"
          >
            <Plus size={14} /> Add page
          </button>
        </div>
      ) : null}

      {showAddPage && isMulti ? (
        <div className="shrink-0 border-b border-white/10 bg-[#111827] px-3 py-3">
          <p className="mb-2 text-[11px] text-white/55">
            Home is ready — add any page in one click (header and footer stay shared from Home).
          </p>
          <div className="flex flex-wrap gap-2">
            {EXTRA_PAGE_SUGGESTIONS.filter(
              (name) =>
                !(site?.pages || []).some(
                  (p) => p.label.toLowerCase() === name.toLowerCase(),
                ),
            ).map((name) => (
              <button
                key={name}
                type="button"
                disabled={pageBusy}
                onClick={() => void addPage(name)}
                className="rounded-lg bg-white/8 px-2.5 py-1.5 text-xs text-white/85 hover:bg-violet-600/40 disabled:opacity-40"
              >
                + {name}
              </button>
            ))}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void addPage(customPageName);
            }}
          >
            <input
              value={customPageName}
              onChange={(e) => setCustomPageName(e.target.value)}
              placeholder="Custom page name…"
              className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs outline-none focus:border-violet-400"
            />
            <button
              type="submit"
              disabled={pageBusy || !customPageName.trim()}
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium disabled:opacity-40"
            >
              Create
            </button>
          </form>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          ref={previewShellRef}
          data-cai-preview-shell="1"
          className="relative min-h-[45vh] flex-[3] border-b border-white/10 lg:min-h-0 lg:border-b-0 lg:border-r"
        >
          {(building || pageBusy) && !html ? (
            <div className="absolute inset-0 z-10 grid place-items-center bg-[#0b1220]/90">
              <div className="flex w-[min(280px,80vw)] flex-col items-center gap-3 text-sm text-white/80">
                <Loader2 className="h-8 w-8 animate-spin text-violet-300" />
                <p className="text-center">
                  {pageBusy
                    ? "Creating page…"
                    : payload?.category
                      ? `Generating ${payload.category} site…`
                      : "Generating UI from your details…"}
                </p>
                <div className="w-full">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-violet-400 transition-[width] duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, Math.round(buildProgress))}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
                    <span>{buildProgressLabel}</span>
                    <span className="tabular-nums">
                      {Math.min(99, Math.round(buildProgress))}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {pageBusy && html ? (
            <div className="absolute inset-x-0 top-0 z-10 flex justify-center p-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                <Loader2 size={14} className="animate-spin" /> Building new page…
              </span>
            </div>
          ) : null}
          {html ? (
            <div className="flex h-full w-full justify-center overflow-auto bg-[#020617] p-2 sm:p-3">
              <div
                className={`relative isolate overflow-hidden rounded-lg border shadow-2xl transition-all duration-300 ${
                  editMode
                    ? "border-amber-400/70 ring-2 ring-amber-400/30"
                    : "border-white/10"
                }`}
                style={{
                  width: VIEWPORT_WIDTH[viewport],
                  maxWidth: "100%",
                  height: "100%",
                  minHeight: "100%",
                  flex:
                    viewport === "desktop" ? "1 1 auto" : "0 0 auto",
                  alignSelf: "stretch",
                  background: "#0b1220",
                }}
              >
                {editMode ? (
                  <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-950 shadow">
                    {editSaving ? "Auto-saving…" : "Edit mode"}
                  </div>
                ) : null}
                <iframe
                  ref={previewIframeRef}
                  key={`create-ai-preview-${previewKey}`}
                  title="Create with AI preview"
                  srcDoc={
                    editMode
                      ? editFreezeSrcDoc || previewHtml || html
                      : previewHtml || html
                  }
                  className="pointer-events-auto absolute inset-0 block h-full w-full border-0"
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    border: 0,
                    background: "transparent",
                  }}
                  sandbox="allow-same-origin allow-scripts allow-forms"
                />
              </div>
            </div>
          ) : (
            !building && (
              <div className="grid h-full place-items-center p-8 text-center text-sm text-white/60">
                No preview yet. Create with AI dubara try karo — ya chat se generate trigger karo.
              </div>
            )
          )}
        </section>

        <aside className="relative flex min-h-[40vh] flex-1 flex-col overflow-hidden border-l border-white/[0.06] bg-[linear-gradient(180deg,#0c1220_0%,#111827_45%,#0b1020_100%)] lg:min-h-0">
          {editMode ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#0c1220]/94 px-6 text-center backdrop-blur-sm">
              <Pencil size={22} className="text-amber-300" />
              <p className="text-sm font-semibold text-white">
                Edit mode on
              </p>
              <p className="text-xs text-white/60">
                AI chat, responsive views, nav &amp; sliders are paused. Edit
                text, images; use Color/Size bar, Bg / Video / + Item /
                Delete / ↑↓ / + Section. Exit Edit mode for chat.
              </p>
            </div>
          ) : null}
          <div className="relative border-b border-white/[0.07] px-4 py-3">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-[13px] font-semibold tracking-tight text-white">
                  Refine with chat
                </h2>
                {isMulti ? (
                  <p className="truncate text-[10px] font-medium text-white/40">
                    {activePage?.label || "Home"}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
                  title={`Free used ${chatCredits.freeUsed}/${chatCredits.freeCap}`}
                >
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                    used
                  </span>
                  <span className="text-[12px] font-semibold tabular-nums text-[#f5d0a0]">
                    {chatCredits.used}
                  </span>
                  <span className="h-3 w-px bg-white/15" />
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                    left
                  </span>
                  <span className="text-[12px] font-semibold tabular-nums text-[#6ee7b7]">
                    {chatCredits.total}
                  </span>
                </span>
                <button
                  type="button"
                  title="Buy credits"
                  onClick={() => {
                    if (!user) {
                      loginPurposeRef.current = "credits";
                      setShowPublishLogin(true);
                      return;
                    }
                    setShowBuyCredits(true);
                  }}
                  className="rounded-full bg-gradient-to-b from-[#5b8cff] to-[#3b6ef5] px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-[0_6px_16px_rgba(59,110,245,0.35)] transition hover:brightness-110 active:scale-[0.98]"
                >
                  Buy
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {chat.map((m, i) => {
              const isUser = m.role === "user";
              const at = m.at || Date.now();
              const dayLabel = formatChatDayLabel(at);
              const prevAt = i > 0 ? chat[i - 1]?.at : undefined;
              const showDay =
                i === 0 ||
                !prevAt ||
                formatChatDayLabel(prevAt) !== dayLabel;
              const clock = formatChatClock(at);
              return (
                <div key={`${m.role}-${i}-${at}`}>
                  {showDay ? (
                    <div className="mb-3 flex justify-center">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                        {dayLabel}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={`flex items-end gap-2 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <span
                      className={`mb-4 grid size-8 shrink-0 place-items-center rounded-full ${
                        isUser
                          ? "bg-violet-600 text-white"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                      title={isUser ? "You" : "AI"}
                    >
                      {isUser ? <UserRound size={15} /> : <Bot size={15} />}
                    </span>
                    <div
                      className={`group relative max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                        isUser
                          ? "bg-violet-600 text-white"
                          : "bg-white/8 text-white/90"
                      }`}
                    >
                      <button
                        type="button"
                        title="Delete message"
                        aria-label="Delete message"
                        disabled={chatBusy}
                        onClick={() =>
                          setChat((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className={`absolute -top-2 ${
                          isUser ? "-left-2" : "-right-2"
                        } grid size-6 place-items-center rounded-full border border-white/15 bg-[#1f2937] text-white/70 opacity-0 shadow transition hover:bg-red-600 hover:text-white group-hover:opacity-100 disabled:opacity-30`}
                      >
                        <Trash2 size={12} />
                      </button>
                      <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                        {isUser ? "You" : "AI"}
                      </p>
                      {m.imagePreviews?.length ? (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {m.imagePreviews.map((src, j) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={`${i}-img-${j}`}
                              src={src}
                              alt="Attached screenshot"
                              className="h-16 w-auto max-w-[140px] rounded-lg border border-white/20 object-cover"
                            />
                          ))}
                        </div>
                      ) : null}
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      {clock ? (
                        <p
                          className={`mt-1 text-right text-[10px] tabular-nums opacity-55`}
                        >
                          {clock}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {chatBusy ? (
              <div className="flex items-start gap-2">
                <span className="grid size-8 place-items-center rounded-full bg-emerald-500/20 text-emerald-300">
                  <Bot size={15} />
                </span>
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-xs text-white/60">
                  <Loader2 size={14} className="animate-spin" />{" "}
                  {chatPhase || "Updating…"}
                </div>
              </div>
            ) : null}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={sendChat}
            className="border-t border-white/[0.07] bg-black/20 p-3 backdrop-blur-sm"
          >
            {attachments.length ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <div
                    key={a.id}
                    className="relative overflow-hidden rounded-lg border border-white/20"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.previewUrl}
                      alt="Pending screenshot"
                      className="h-14 w-20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/70 text-white hover:bg-black"
                      aria-label="Remove screenshot"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => void onPickFiles(e.target.files)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                title="Upload screenshot / reference"
                disabled={editMode || chatBusy || !html || attachments.length >= 2}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-white/[0.08] disabled:opacity-40"
                aria-label="Upload screenshot"
              >
                <Paperclip size={16} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={onPasteScreenshot}
                placeholder="Paste a screenshot (Ctrl+V) or describe the change…"
                disabled={editMode || chatBusy || !html}
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#5b8cff]/50 focus:ring-1 focus:ring-[#5b8cff]/25 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={
                  editMode ||
                  chatBusy ||
                  !html ||
                  (!input.trim() && attachments.length === 0)
                }
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-[#7c5cff] to-[#5b3fd4] text-white shadow-[0_8px_20px_rgba(91,63,212,0.35)] transition hover:brightness-110 disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </aside>
      </div>

      <input
        ref={editMediaInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          e.target.value = "";
          void onEditMediaPicked(file);
        }}
      />

      {addSectionAfterIndex != null &&
        previewShellRef.current &&
        createPortal(
          <div className="absolute inset-0 z-[10025] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close add section"
              className="absolute inset-0 bg-black/55"
              onClick={() => setAddSectionAfterIndex(null)}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 text-slate-950 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                    Edit mode
                  </p>
                  <h3 className="mt-1 text-lg font-bold">Add section</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Inserts after the selected block. You can reorder with ↑ ↓.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddSectionAfterIndex(null)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CREATE_AI_EDIT_SECTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.kind}
                    type="button"
                    onClick={() => applyAddSectionKind(opt.kind)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-800 transition hover:border-amber-400 hover:bg-amber-50"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          previewShellRef.current,
        )}

      {editBgIndex != null &&
        previewShellRef.current &&
        createPortal(
          <div className="absolute inset-0 z-[10025] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close background editor"
              className="absolute inset-0 bg-black/55"
              onClick={() => setEditBgIndex(null)}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 text-slate-950 shadow-2xl">
              <h3 className="text-lg font-bold">Section background</h3>
              <p className="mt-1 text-sm text-slate-600">
                Color and/or image URL for this block.
              </p>
              <label className="mt-4 block text-xs font-semibold text-slate-500">
                Color
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(editBgColor) ? editBgColor : "#0f172a"}
                  onChange={(e) => setEditBgColor(e.target.value)}
                  className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-200"
                />
              </label>
              <label className="mt-3 block text-xs font-semibold text-slate-500">
                Image URL (optional)
                <input
                  type="url"
                  value={editBgImageUrl}
                  onChange={(e) => setEditBgImageUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditBgIndex(null)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyEditBg}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          previewShellRef.current,
        )}

      {editYtIndex != null &&
        previewShellRef.current &&
        createPortal(
          <div className="absolute inset-0 z-[10025] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close video editor"
              className="absolute inset-0 bg-black/55"
              onClick={() => setEditYtIndex(null)}
            />
            <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 text-slate-950 shadow-2xl">
              <h3 className="text-lg font-bold">YouTube video</h3>
              <p className="mt-1 text-sm text-slate-600">
                Paste a YouTube link for this section.
              </p>
              <input
                type="url"
                value={editYtUrl}
                onChange={(e) => setEditYtUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditYtIndex(null)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyEditYoutube}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          previewShellRef.current,
        )}

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {showBuyCredits ? (
        <div className="fixed inset-0 z-[10030] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close buy credits"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !buyingCreditPack && setShowBuyCredits(false)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(165deg,#121a2b_0%,#0d1424_100%)] p-6 text-white shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#5b8cff]/15 blur-3xl"
            />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Credits
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  Buy credits
                </h3>
                <p className="mt-1 text-xs text-white/45">
                  Used {chatCredits.used} · {chatCredits.total} left
                </p>
              </div>
              <button
                type="button"
                disabled={buyingCreditPack}
                onClick={() => setShowBuyCredits(false)}
                className="rounded-full border border-white/10 bg-white/[0.04] p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative mt-5 space-y-2.5">
              {CREATE_AI_CHAT_CREDIT_PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  disabled={buyingCreditPack}
                  onClick={() => void purchaseCreateAiChatCredits(pack.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:border-[#5b8cff]/35 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  <span className="text-sm font-semibold tracking-tight">
                    {pack.credits} credits
                  </span>
                  <span className="rounded-full bg-[#5b8cff]/15 px-3 py-1 text-sm font-semibold text-[#9ec0ff]">
                    ₹{pack.priceInr}
                  </span>
                </button>
              ))}
            </div>
            {buyingCreditPack ? (
              <p className="relative mt-4 flex items-center gap-2 text-xs text-white/55">
                <Loader2 size={14} className="animate-spin" /> Opening payment…
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <PublishLoginModal
        open={showPublishLogin}
        onClose={() => setShowPublishLogin(false)}
        title={
          loginPurposeRef.current === "credits"
            ? "Login to buy chat credits"
            : loginPurposeRef.current === "export"
              ? "Login to export your website"
              : "Login to publish your website"
        }
        description="Enter your email and we'll send a 6-digit login code."
        onAuthenticated={() => {
          setShowPublishLogin(false);
          if (loginPurposeRef.current === "credits") {
            setShowBuyCredits(true);
            return;
          }
          if (loginPurposeRef.current === "export") {
            openPaidExportModal();
            return;
          }
          void publishCreateAiSite();
        }}
      />

      <ExportWebsiteModal
        open={showExportModal}
        site={exportTarget}
        onClose={() => {
          setShowExportModal(false);
          setExportTarget(null);
        }}
      />

      {showPublishedPopup &&
        publishedUrl &&
        previewShellRef.current &&
        createPortal(
          <div className="absolute inset-0 z-[10020] flex items-center justify-center p-4">
            <button
              type="button"
              aria-label="Close published dialog"
              className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
              onClick={() => setShowPublishedPopup(false)}
            />

            <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white px-6 pb-7 pt-10 text-center shadow-2xl">
              <button
                type="button"
                aria-label="Close published popup"
                onClick={() => setShowPublishedPopup(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={18} />
              </button>

              <div className="flex flex-col items-center">
                <span
                  className="flex h-[59px] w-[59px] items-center justify-center rounded-full"
                  style={{ backgroundColor: "#116dff" }}
                  aria-hidden="true"
                >
                  <Check size={32} strokeWidth={2.5} className="text-white" />
                </span>

                <h2 className="mt-5 text-[28px] font-bold leading-tight tracking-tight text-slate-950">
                  Congratulations
                </h2>
                <p className="mt-2 text-base text-slate-600">
                  Your site is published!
                </p>
              </div>

              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Website URL
                </p>
                {isEditingPublishedUrl ? (
                  <form
                    className="mt-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleSavePublishedUrl();
                    }}
                  >
                    <div className="flex min-w-0 items-center rounded-xl border border-blue-400 bg-white px-3 shadow-sm ring-2 ring-blue-100 focus-within:border-blue-600">
                      <span className="shrink-0 whitespace-nowrap text-sm text-slate-500">
                        {displayPublishedUrl.replace(/[^/]*$/, "")}
                      </span>
                      <input
                        autoFocus
                        type="text"
                        value={publishedSlugDraft}
                        maxLength={60}
                        aria-label="Website URL"
                        aria-invalid={Boolean(publishedUrlError)}
                        onChange={(event) => {
                          setPublishedSlugDraft(
                            event.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")
                              .replace(/-{2,}/g, "-")
                              .slice(0, 60),
                          );
                          setPublishedUrlError("");
                          setPublishedUrlSaved(false);
                        }}
                        className="min-w-[8rem] flex-1 bg-transparent py-3 text-sm font-semibold text-slate-950 outline-none"
                        placeholder="my-website"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Use 3-60 lowercase letters, numbers, or hyphens. The old
                      link will stop working after this change.
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSavingPublishedUrl}
                        onClick={() => {
                          setIsEditingPublishedUrl(false);
                          setPublishedUrlError("");
                        }}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingPublishedUrl}
                        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {isSavingPublishedUrl ? "Saving..." : "Save URL"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-2 flex flex-nowrap items-center gap-2">
                    <a
                      href={publishedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 hover:text-blue-600"
                      title={displayPublishedUrl}
                    >
                      {displayPublishedUrl}
                    </a>
                    <button
                      type="button"
                      aria-label="Copy published URL"
                      onClick={() => void handleCopyPublishedUrl()}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:text-slate-900"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleStartPublishedUrlEdit}
                      className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                    >
                      Edit URL
                    </button>
                  </div>
                )}
                {publishedUrlError ? (
                  <p className="mt-3 text-sm font-semibold text-red-600" role="alert">
                    {publishedUrlError}
                  </p>
                ) : null}
                {publishedUrlSaved ? (
                  <p
                    className="mt-3 text-sm font-semibold text-emerald-700"
                    role="status"
                  >
                    Website URL updated successfully.
                  </p>
                ) : null}
              </div>

              {showCopiedMessage ? (
                <p
                  className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
                  role="status"
                  aria-live="polite"
                >
                  Link copied
                </p>
              ) : null}

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: "#116dff" }}
                >
                  <ExternalLink size={16} />
                  Open site
                </a>
                <Link
                  href="/user/domains"
                  onClick={() => setShowPublishedPopup(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  <Link2 size={16} />
                  Custom domain
                </Link>
              </div>
            </div>
          </div>,
          previewShellRef.current,
        )}
    </div>
  );
}
