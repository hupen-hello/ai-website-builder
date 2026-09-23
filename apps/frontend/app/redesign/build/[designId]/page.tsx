"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Pencil,
  Sparkles,
  UserRound,
} from "lucide-react";
import { saveBuiltSiteTheme, type BuiltSiteTheme, createFallbackTheme, clearBuiltSiteHtml, clearBuiltSiteSections } from "@/lib/built-site-theme";
import {
  getRedesignBuildPayload,
  type RedesignBuildPayload,
} from "@/lib/redesign-build-storage";
import { setActiveRedesignDesignId } from "@/lib/redesign-design-id";
import {
  clearRedesignBuildFeed,
  getRedesignBuildStartedAt,
  pushRedesignBuildFeed,
} from "@/lib/redesign-build-feed";
import { useUserAuth, UserAuthProvider } from "@/components/auth/UserAuthContext";
import UserAvatar from "@/components/auth/UserAvatar";
import GetQuoteEnquiryModal from "@/components/home/GetQuoteEnquiryModal";
import { seedRedesignEditorFromExtract } from "@/lib/seed-redesign-editor";
import { pickRedesignLibraryPack } from "@/lib/pick-redesign-library";
import { getBuilderTemplate, getTemplatesForCategory } from "@/app/editor/layout/src/data/templateFlow";
import { readRedesignEditorSections } from "@/lib/build-redesign-home-sections";

const BUILD_STEPS = [
  { id: 1, label: "Reading your website" },
  { id: 2, label: "Lestow redesigning" },
  { id: 3, label: "Ready" },
] as const;

/** Keep the build screen live for at least 1 minute before Edit Website. */
const MIN_BUILD_HOLD_MS = 60_000;

const SECTION_REVEAL_ORDER = [
  "Topbar",
  "Header",
  "Banner",
  "About",
  "Product",
  "WhyChooseUs",
  "Gallery",
  "Testimonial",
  "FAQ",
  "FormDetail",
  "Footer",
] as const;

function sectionRevealLabels(variants: Record<string, string>): string[] {
  const labels: string[] = [];
  for (const type of SECTION_REVEAL_ORDER) {
    if (variants[type] || type === "Header" || type === "Banner" || type === "Footer") {
      labels.push(type);
    }
  }
  for (const key of Object.keys(variants)) {
    if (!labels.includes(key)) labels.push(key);
  }
  return labels.length ? labels : ["Header", "Banner", "About", "Footer"];
}

function BuildExperience() {
  const router = useRouter();
  const params = useParams();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";
  const [payload, setPayload] = useState<RedesignBuildPayload | null>(null);
  const [theme, setTheme] = useState<BuiltSiteTheme | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Lestow redesigning");
  const [previewKey, setPreviewKey] = useState(0);
  const [elapsedMin, setElapsedMin] = useState(0);
  const [editorUrl, setEditorUrl] = useState<string | null>(null);
  const [revealSections, setRevealSections] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [pendingComposeUrl, setPendingComposeUrl] = useState<string | null>(null);
  const [pendingBrandedUrl, setPendingBrandedUrl] = useState<string | null>(null);
  const [showEditCta, setShowEditCta] = useState(false);
  const finishGateRef = useRef(false);

  useEffect(() => {
    if (!designId) {
      router.replace("/");
      return;
    }
    setActiveRedesignDesignId(designId);
    const stored = getRedesignBuildPayload(designId);
    if (!stored) {
      router.replace("/");
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (active) setPayload(stored);
    });
    return () => {
      active = false;
    };
  }, [router, designId]);

  useEffect(() => {
    if (!payload) return;

    let cancelled = false;

    const extractAndBuild = async () => {
      try {
        clearBuiltSiteHtml();
        clearBuiltSiteSections(designId);
        clearRedesignBuildFeed(designId);
        pushRedesignBuildFeed(
          {
            tone: "work",
            title: "Lestow redesigning",
            detail: `Domain ${payload.domainName}`,
          },
          designId,
        );
        setActiveStep(1);
        setStatusLabel("Lestow redesigning — reading your website…");
        pushRedesignBuildFeed(
          {
            tone: "work",
            title: "Lestow redesigning",
            detail: "Reading brand, logo, images, and content…",
          },
          designId,
        );
        const response = await fetch("/api/extract-site-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domainUrl: payload.domainName,
            referenceUrl: payload.referenceName,
            websiteName: payload.websiteName,
            vision: payload.vision,
          }),
        });

        let extracted: BuiltSiteTheme;
        if (response.ok) {
          extracted = (await response.json()) as BuiltSiteTheme;
        } else {
          const errBody = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          pushRedesignBuildFeed(
            {
              tone: "warn",
              title: "Domain read limited",
              detail:
                errBody.message ||
                "Could not fully read the site — using basic brand fallback.",
            },
            designId,
          );
          extracted = createFallbackTheme({
            websiteName: payload.websiteName,
            domainUrl: payload.domainName || payload.websiteName,
            referenceUrl: payload.referenceName,
            vision: payload.vision,
          });
        }

        if (cancelled) return;

        saveBuiltSiteTheme(extracted, designId);
        setTheme(extracted);
        setPreviewKey((value) => value + 1);
        setActiveStep(1);
        const imgCount = (extracted.contentImages || []).length;
        const hasLogo = Boolean((extracted.logoImage || "").trim());
        pushRedesignBuildFeed(
          {
            tone: imgCount || hasLogo ? "ok" : "warn",
            title: "Domain data ready",
            detail: `${extracted.brandName || "Brand"} · ${hasLogo ? "logo" : "no logo"} · ${imgCount} images`,
          },
          designId,
        );

        setActiveStep(2);
        setStatusLabel("Lestow redesigning — components + your data…");

        const localPack = await pickRedesignLibraryPack({
          vision: payload.vision,
          websiteRelated: payload.websiteRelated,
          brandName: extracted.brandName || payload.websiteName,
          description: extracted.description || extracted.paragraphs?.[0] || "",
          domainUrl: extracted.domainUrl || payload.domainName,
        });

        const aiPickPromise = fetch("/api/ai/redesign-pick-components", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: extracted, vision: payload.vision }),
        })
          .then((r) => r.json())
          .catch(() => ({})) as Promise<{
          category?: string;
          templateId?: string;
          sectionVariants?: Record<string, string>;
          pickedBy?: "ai" | "heuristic";
        }>;

        const timedAi = await Promise.race([
          aiPickPromise,
          new Promise<null>((resolve) =>
            window.setTimeout(() => resolve(null), 2500),
          ),
        ]);

        if (cancelled) return;

        const preferredCategory = (payload.category || "").trim();
        const category =
          preferredCategory ||
          (timedAi && typeof timedAi === "object" && timedAi.category?.trim()) ||
          localPack?.category ||
          "";
        let templateId = "";
        if (category) {
          const list = getTemplatesForCategory(category);
          const homeFirst =
            list.find(
              (t) =>
                /home/i.test(t.id) || t.type === "Single Page Website",
            ) || list[0];
          templateId = homeFirst?.id || "";
        }
        if (!templateId) {
          templateId =
            (timedAi && typeof timedAi === "object" && timedAi.templateId?.trim()) ||
            localPack?.templateId ||
            "";
        }

        if (category && templateId) {
          const tpl = getBuilderTemplate(templateId, category);
          const sectionVariants =
            (timedAi && typeof timedAi === "object" && timedAi.sectionVariants) ||
            tpl?.sectionVariants ||
            {};

          const seeded = await seedRedesignEditorFromExtract({
            theme: extracted,
            category,
            templateId,
            payload: { ...payload, category, templateId },
            designId,
            sectionVariants,
            pickedBy:
              timedAi && typeof timedAi === "object" && timedAi.pickedBy === "ai"
                ? "ai"
                : "heuristic",
          });
          if (cancelled) return;
          setEditorUrl(seeded.editorUrl);
          const homeSecs = readRedesignEditorSections(designId) || [];
          const labels = homeSecs.length
            ? homeSecs.map((s) => s.type)
            : sectionRevealLabels(sectionVariants);
          setRevealSections(labels);
          setRevealedCount(0);
          const branded =
            seeded.brandedPreviewUrl ||
            `/redesign/build/${encodeURIComponent(designId)}/live`;
          setPendingBrandedUrl(branded);
          setPendingComposeUrl(seeded.composePreviewUrl || null);
          const composedTheme: BuiltSiteTheme = {
            ...extracted,
            buildMode: "template-library",
            templateId,
            templateCategory: category,
            // Hold full preview until sections finish revealing + min hold.
            composePreviewUrl: undefined,
          };
          saveBuiltSiteTheme(composedTheme, designId);
          setTheme(composedTheme);
          setPreviewKey((v) => v + 1);
          setStatusLabel("Lestow redesigning — loading sections…");
          pushRedesignBuildFeed(
            {
              tone: "work",
              title: "Components ready",
              detail: `Placing ${labels.length} sections with your logo & content…`,
            },
            designId,
          );
          return;
        }

        setStatusLabel("Lestow redesigning — layouts unavailable");
        pushRedesignBuildFeed(
          {
            tone: "warn",
            title: "Layouts unavailable",
            detail: "Upload components in custom-layouts, then retry.",
          },
          designId,
        );
        setIsComplete(true);
        setActiveStep(3);
        return;


      } catch {
        if (cancelled) return;

        const fallback = createFallbackTheme({
          websiteName: payload.websiteName,
          domainUrl: payload.domainName || payload.websiteName,
          referenceUrl: payload.referenceName,
          vision: payload.vision,
        });

        saveBuiltSiteTheme(fallback, designId);
        setTheme(fallback);
        setPreviewKey((value) => value + 1);
        setRevealSections(["Header", "Banner", "About", "Footer"]);
        setRevealedCount(0);
        setPendingComposeUrl(null);
        setEditorUrl(`/editor?designId=${encodeURIComponent(designId)}`);
        setStatusLabel("Lestow redesigning — loading sections…");
      }
    };

    extractAndBuild();

    return () => {
      cancelled = true;
    };
  }, [payload, designId]);

  // Reveal sections one-by-one; unlock Edit Website only after all + min 1 min hold.
  useEffect(() => {
    if (!payload || isComplete || revealSections.length === 0) return;
    if (finishGateRef.current) return;

    const started = getRedesignBuildStartedAt(designId);
    const elapsed = Math.max(0, Date.now() - started);
    const remainingHold = Math.max(0, MIN_BUILD_HOLD_MS - elapsed);

    if (revealedCount < revealSections.length) {
      const left = Math.max(1, revealSections.length - revealedCount);
      const tickMs = Math.max(1100, Math.floor(remainingHold / left));
      const timer = window.setTimeout(() => {
        const next = revealedCount + 1;
        setRevealedCount(next);
        const label = revealSections[revealedCount];
        if (label) {
          pushRedesignBuildFeed(
            {
              tone: "ok",
              title: `${label} loaded`,
              detail: `${next}/${revealSections.length} sections in preview`,
            },
            designId,
          );
        }
      }, tickMs);
      return () => window.clearTimeout(timer);
    }

    const waitMore = Math.max(0, MIN_BUILD_HOLD_MS - (Date.now() - started));
    const finishTimer = window.setTimeout(() => {
      if (finishGateRef.current) return;
      finishGateRef.current = true;
      setTheme((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          // Prefer branded (domain + color/font) over raw compose LaunchCo preview.
          composePreviewUrl:
            pendingBrandedUrl ||
            pendingComposeUrl ||
            prev.composePreviewUrl,
        };
        saveBuiltSiteTheme(next, designId);
        return next;
      });
      setPreviewKey((v) => v + 1);
      setActiveStep(3);
      setIsComplete(true);
      setShowEditCta(true);
      setStatusLabel("Lestow redesign ready");
      pushRedesignBuildFeed(
        {
          tone: "ok",
          title: "Lestow redesign ready",
          detail: "All sections loaded — Edit Website is available.",
        },
        designId,
      );
    }, waitMore);

    return () => window.clearTimeout(finishTimer);
  }, [
    payload,
    designId,
    isComplete,
    revealSections,
    revealedCount,
    pendingComposeUrl,
    pendingBrandedUrl,
  ]);

  useEffect(() => {
    if (!payload || isComplete) return;
    const elapsedTimer = window.setInterval(() => {
      const started = getRedesignBuildStartedAt(designId);
      setElapsedMin(Math.max(0, Math.floor((Date.now() - started) / 60_000)));
    }, 1000);
    return () => window.clearInterval(elapsedTimer);
  }, [payload, isComplete, designId]);

  const websiteLabel =
    payload?.domainName.trim() || payload?.websiteName.trim() || "Your website";

  if (!payload) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#fbfaf6] text-sm text-slate-500">
        Preparing Lestow redesign…
      </div>
    );
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[#fbfaf6] text-[#08132f]">
      <BuildHeader />

      <div className="redesign-build-shell mx-auto min-h-0 w-full max-w-[1320px] flex-1 overflow-hidden px-4 py-4 sm:px-7 lg:px-8 lg:py-5 2xl:max-w-[1632px]">
        <aside className="redesign-build-sidebar flex min-h-0 flex-col gap-3 overflow-hidden sm:gap-4">
          <BuildStepper activeStep={activeStep} isComplete={isComplete} />

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_60px_rgba(23,38,76,.06)] sm:p-5">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-white ${
                  isComplete ? "bg-emerald-500" : "bg-[#315ff4]"
                }`}
              >
                {isComplete ? <Check size={12} strokeWidth={3} /> : <Sparkles size={12} />}
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold tracking-[-0.02em]">
                  {isComplete ? "Lestow redesign ready" : "Lestow redesigning"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{statusLabel}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Website
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[#08132f]" title={websiteLabel}>
                  {websiteLabel}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span
                  className={`size-2 rounded-full ${
                    isComplete ? "bg-emerald-500" : "animate-pulse bg-emerald-500"
                  }`}
                />
                {elapsedMin}m elapsed
                {isComplete ? " · ready to edit" : ""}
              </div>
            </div>
          </section>
        </aside>

        <section className="redesign-build-preview flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-slate-200/90 bg-white p-3 shadow-[0_24px_80px_rgba(23,38,76,.08)] sm:p-4">
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-[#08132f]">
                Live Preview
              </h2>
              <p className="truncate text-xs text-slate-500">
                {revealSections.length > 0 && !isComplete
                  ? `Building ${Math.min(revealedCount, revealSections.length)} of ${revealSections.length} sections`
                  : isComplete
                    ? "Your branded redesign is ready"
                    : "Components with your domain data"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {showEditCta ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      editorUrl ||
                        `/editor?designId=${encodeURIComponent(designId)}`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#315ff4] px-3.5 py-2 text-xs font-semibold text-white shadow-[0_10px_24px_rgba(49,95,244,.28)] transition hover:brightness-95"
                >
                  <Pencil size={13} strokeWidth={2.4} />
                  Edit Website
                </button>
              ) : null}
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <span
                  className={`size-2 rounded-full bg-emerald-500 ${isComplete ? "" : "animate-pulse"}`}
                />
                {isComplete ? "Ready" : "Lestow redesigning"}
              </div>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 shadow-[inset_0_1px_0_rgba(255,255,255,.8)]">
            {isComplete && (pendingBrandedUrl || theme?.composePreviewUrl) ? (
              <iframe
                key={`${previewKey}-branded`}
                title="Lestow redesign preview"
                src={pendingBrandedUrl || theme?.composePreviewUrl || ""}
                scrolling="yes"
                className="absolute inset-0 h-full w-full border-0 bg-white"
              />
            ) : pendingBrandedUrl && revealSections.length > 0 ? (
              <SectionRevealPreview
                revealedCount={revealedCount}
                composeUrl={pendingBrandedUrl}
              />
            ) : (
              <BuildPreviewPlaceholder
                websiteLabel={websiteLabel}
                brandName={theme?.brandName}
                logoImage={theme?.logoImage}
              />
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function BuildPreviewPlaceholder({
  websiteLabel,
  brandName,
  logoImage,
}: {
  websiteLabel?: string;
  brandName?: string;
  logoImage?: string;
}) {
  const title = (brandName || "").trim() || websiteLabel || "Your website";
  return (
    <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-4 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6 text-center">
      {logoImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoImage}
          alt=""
          className="h-14 w-14 rounded-full border border-white object-cover shadow-md"
        />
      ) : (
        <span className="grid size-14 place-items-center rounded-full bg-[#315ff4] text-lg font-bold text-white shadow-md">
          {(title.slice(0, 1) || "L").toUpperCase()}
        </span>
      )}
      <div>
        <p className="text-base font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-sm text-slate-500">
          Reading your site — design preview starts next…
        </p>
      </div>
      <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700">
        <span className="size-2 animate-pulse rounded-full bg-[#315ff4]" />
        Preparing sections
      </span>
    </div>
  );
}

function SectionRevealPreview({
  revealedCount,
  composeUrl,
}: {
  revealedCount: number;
  composeUrl?: string | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!composeUrl) return;
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const limit = Math.max(1, revealedCount);
    const send = () => {
      win.postMessage(
        { type: "lestow-redesign-reveal-limit", limit },
        window.location.origin,
      );
    };
    send();
    const t = window.setTimeout(send, 200);
    return () => window.clearTimeout(t);
  }, [composeUrl, revealedCount]);

  if (!composeUrl) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        Preparing branded preview…
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-white">
      <iframe
        ref={iframeRef}
        title="Lestow redesign live design"
        src={`${composeUrl}?limit=1`}
        className="absolute inset-0 block h-full w-full border-0 bg-white"
        onLoad={() => {
          iframeRef.current?.contentWindow?.postMessage(
            {
              type: "lestow-redesign-reveal-limit",
              limit: Math.max(1, revealedCount),
            },
            window.location.origin,
          );
        }}
      />
    </div>
  );
}

function BuildHeader() {
  const router = useRouter();
  const { user, authLoading, logout } = useUserAuth();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const onDoc = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [profileOpen]);

  return (
    <>
      <header className="relative z-40 h-16 shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl 2xl:h-20">
        <div className="mx-auto flex h-full max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-7 lg:px-8 2xl:max-w-[1632px]">
          <Link
            href="/"
            aria-label="Lestow home"
            className="relative block h-8 w-[108px] shrink-0 2xl:h-10 2xl:w-[120px]"
          >
            <Image
              src="/lestow-logo.svg"
              alt="Lestow AI Website Builder"
              fill
              priority
              className="object-contain object-left"
            />
          </Link>

          <nav className="flex items-center justify-end gap-2 sm:gap-3">
            {authLoading ? (
              <div
                aria-hidden
                className="flex h-10 w-40 animate-pulse items-center gap-2 rounded-full bg-slate-100 px-1.5"
              >
                <span className="size-8 rounded-full bg-slate-200" />
                <span className="h-3 flex-1 rounded bg-slate-200" />
              </div>
            ) : user ? (
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((open) => !open)}
                  aria-expanded={profileOpen}
                  className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-1.5 pr-3 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <UserAvatar
                    name={user.name}
                    email={user.email}
                    avatarUrl={user.avatarUrl}
                    size={32}
                    className="border-2 border-white shadow-sm"
                  />
                  <span className="max-w-36 truncate text-xs font-semibold text-[#08132f]">
                    {user.name || user.email}
                  </span>
                  <ChevronDown size={15} className="text-slate-500" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-2xl border border-zinc-200 bg-white p-2 text-zinc-900 shadow-[0_20px_55px_rgba(39,32,56,0.16)]">
                    <div className="flex items-center gap-3 px-2 py-2.5">
                      <UserAvatar
                        name={user.name}
                        email={user.email}
                        avatarUrl={user.avatarUrl}
                        size={40}
                      />
                      <span className="grid min-w-0">
                        <strong className="truncate text-xs">
                          {user.name || "Account"}
                        </strong>
                        <small className="truncate text-[10px] text-zinc-500">
                          {user.email}
                        </small>
                      </span>
                    </div>
                    <div className="my-1 h-px bg-zinc-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        router.push("/user/dashboard");
                      }}
                      className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                    >
                      <LayoutDashboard size={16} /> Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        router.push("/user/profile");
                      }}
                      className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                    >
                      <UserRound size={16} /> Profile
                    </button>
                    <div className="my-1 h-px bg-zinc-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        void logout();
                      }}
                      className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 text-xs text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth"
                  aria-label="Sign in or create account"
                  title="Account"
                  className="grid size-10 place-items-center rounded-full border border-slate-200 bg-slate-50 text-[#08132f] transition hover:border-blue-300 hover:bg-blue-50 2xl:size-11"
                >
                  <UserRound size={18} strokeWidth={2} />
                </Link>
                <button
                  type="button"
                  onClick={() => setQuoteOpen(true)}
                  className="rounded-lg bg-black px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-black/75 sm:px-5 2xl:px-7 2xl:py-3 2xl:text-xs"
                >
                  Get Quote
                </button>
              </>
            )}
            {user ? (
              <button
                type="button"
                onClick={() => setQuoteOpen(true)}
                className="rounded-lg bg-black px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-black/75 sm:px-5 2xl:px-7 2xl:py-3 2xl:text-xs"
              >
                Get Quote
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <GetQuoteEnquiryModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
    </>
  );
}

function BuildStepper({
  activeStep,
  isComplete,
}: {
  activeStep: number;
  isComplete: boolean;
}) {
  return (
    <ol className="shrink-0 space-y-2">
      {BUILD_STEPS.map((step) => {
        const isDone = isComplete ? true : activeStep > step.id;
        const isCurrent = !isComplete && activeStep === step.id;

        return (
          <li
            key={step.id}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition ${isCurrent
              ? "border-[#315ff4] bg-blue-50/50"
              : isDone
                ? "border-emerald-200 bg-emerald-50/60"
                : "border-slate-200 bg-white"
              }`}
          >
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${isDone
                ? "bg-emerald-500 text-white"
                : isCurrent
                  ? "bg-[#315ff4] text-white"
                  : "bg-slate-100 text-slate-400"
                }`}
            >
              {isDone ? <Check size={14} strokeWidth={3} /> : step.id}
            </span>
            <span
              className={`text-sm font-medium ${isCurrent || isDone ? "text-[#08132f]" : "text-slate-400"
                }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function RedesignBuildPage() {
  return (
    <UserAuthProvider>
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center bg-[#fbfaf6] text-sm text-slate-500">
            Loading build experience...
          </div>
        }
      >
        <BuildExperience />
      </Suspense>
    </UserAuthProvider>
  );
}
