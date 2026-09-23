"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react";
import { useFooter } from "../layout/footercontext";
import Categorystep from "./categorystep";
import CategoryType from "./categorytype";
import CreateAiDesignPrefsStep, {
  CREATE_AI_PREFS_PHASES,
  type CreateAiPrefsPhase,
} from "./createaidesignprefs";
import RedesignDesignPrefsStep from "./redesigndesignprefs";
import TemplatePreview from "./templatepreview";
import PageSelection from "./pageselection";
import WebsiteCreation from "./websitecreation";
import ReferenceCard from "./referencecard";
import { refreshCategoryContentFromApi } from "@/app/editor/layout/src/data/templateFlow";
import { createCreateAiDesignId, setActiveCreateAiDesignId, getActiveCreateAiDesignId } from "@/lib/create-ai-design-id";
import { getCreateAiPayload, saveCreateAiPayload } from "@/lib/create-ai-storage";
import {
  defaultCreateAiDesignPrefs,
  type CreateAiDesignPrefs,
} from "@/lib/create-ai-design-prefs";
import {
  defaultRedesignDesignPrefs,
  isRedesignDesignPrefsComplete,
  type RedesignDesignPrefs,
} from "@/lib/redesign-design-prefs";
import UserAvatar from "@/components/auth/UserAvatar";
import {
  defaultOnboardingBusinessInfo,
  hasMeaningfulOnboardingProgress,
  isOnboardingBusinessInfoComplete,
  readNewestOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingBusinessInfo,
} from "@/lib/onboardingDraft";
import {
  hasMeaningfulRedesignProgress,
  readRedesignFormDraft,
  saveRedesignFormDraft,
} from "@/lib/redesign-form-storage";
import { saveRedesignBuildPayload } from "@/lib/redesign-build-storage";
import {
  buildFooterColumnsFromOnboardingSelection,
  buildPageLinksFromOnboardingSelection,
  defaultOnboardingPagesSelection,
  normalizeOnboardingPagesSelection,
  type OnboardingPagesSelection,
} from "@/lib/onboardingPages";
import { clearUserActiveSiteId, setLastEditorUrl } from "@/lib/migrateGuestSite";
import { clearEditorDraft } from "@/lib/editorDraft";
import { saveOnboardingNavSnapshot } from "@/lib/onboardingNavSnapshot";
import {
  writeFlowFooterColumns,
  writeFlowPageLinks,
} from "@/lib/flowPreviewStorage";
import { useUserAuth } from "@/components/auth/UserAuthContext";
import GetQuoteEnquiryModal from "@/components/home/GetQuoteEnquiryModal";

type BusinessOnboardingProps = {
  onBack: () => void;
  onDraftChange?: () => void;
};

type WebsiteAction = "redesign" | "create-ai" | "create-custom";
type OnboardingEntryMode = "choose" | "create" | "redesign";

/** Local form for Redesign flow only — does not change create-new onboarding draft shape. */
type RedesignFormInfo = {
  audience: OnboardingBusinessInfo["audience"];
  name: string;
  hasExistingSite: "" | "yes" | "no";
  domainName: string;
  domainVerified: boolean;
  referenceName: string;
  referenceVerified: boolean;
  vision: string;
  description: string;
  websiteRelated: OnboardingBusinessInfo["websiteRelated"];
  pageType: OnboardingBusinessInfo["pageType"];
  email: string;
  mobile: string;
  address: string;
  includeDetails: boolean;
  hasLogo: "" | "yes" | "no";
  logoName: string;
};

const defaultRedesignFormInfo = (): RedesignFormInfo => ({
  audience: "clients",
  name: "",
  hasExistingSite: "yes",
  domainName: "",
  domainVerified: false,
  referenceName: "",
  referenceVerified: false,
  vision: "",
  description: "",
  websiteRelated: "products",
  pageType: "single-page",
  email: "",
  mobile: "",
  address: "",
  includeDetails: false,
  hasLogo: "no",
  logoName: "",
});

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
const isValidPhone = (phone: string) => /^\d{7,15}$/.test(phone);

export default function BusinessOnboarding({
  onBack,
  onDraftChange,
}: BusinessOnboardingProps) {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useUserAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const restoredRef = useRef(false);
  const categoryPageTypeRef = useRef<{
    category: string;
    pageType: OnboardingBusinessInfo["pageType"];
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [entryMode, setEntryMode] = useState<OnboardingEntryMode>("choose");
  const [selectedWebsiteAction, setSelectedWebsiteAction] = useState<
    WebsiteAction | ""
  >("");
  const [websiteActionSubmitted, setWebsiteActionSubmitted] = useState(false);
  /** Redesign-only form → build (Shuffle-style library pick happens on build). */
  const [redesignInfo, setRedesignInfo] = useState<RedesignFormInfo>(
    defaultRedesignFormInfo,
  );
  /** 0 = domain form, 1 = category + page type + theme */
  const [redesignStep, setRedesignStep] = useState(0);
  const [redesignPrefs, setRedesignPrefs] = useState<RedesignDesignPrefs>(
    defaultRedesignDesignPrefs,
  );
  const [step, setStep] = useState(0);
  const { setHideFooter } = useFooter();
  const [loadspinner, setLoadspinner] = useState(false);
  const [openingFromPreview, setOpeningFromPreview] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const [businessInfoSubmitted, setBusinessInfoSubmitted] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<OnboardingBusinessInfo>(
    defaultOnboardingBusinessInfo,
  );
  const [selectedCategory, setSelectedCategory] = useState("Business");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [showMonitor, setShowMonitor] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [pagesSelection, setPagesSelection] = useState<OnboardingPagesSelection>(
    () => defaultOnboardingPagesSelection(null, "single-page"),
  );
  const [aiDesignPrefs, setAiDesignPrefs] = useState<CreateAiDesignPrefs>(
    defaultCreateAiDesignPrefs,
  );
  const [aiDesignPhase, setAiDesignPhase] =
    useState<CreateAiPrefsPhase>("color");

  useEffect(() => {
    setHideFooter(true);
    return () => {
      setHideFooter(false);
    };
  }, [setHideFooter]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshCategoryContentFromApi();
      if (!cancelled) setContentReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const redesignDraft = readRedesignFormDraft();
    const draft = readNewestOnboardingDraft();
    const redesignUpdated = redesignDraft?.updatedAt ?? 0;
    const pathUpdated = draft?.updatedAt ?? 0;
    // Resume Redesign when form progress exists and it isn't older than
    // another flow's onboarding draft. Form-only (no path draft) is OK.
    const resumeRedesign =
      Boolean(redesignDraft && hasMeaningfulRedesignProgress(redesignDraft)) &&
      (draft?.createPath === "redesign" ||
        !draft ||
        redesignUpdated >= pathUpdated);

    if (resumeRedesign && redesignDraft) {
      setEntryMode("redesign");
      setSelectedWebsiteAction("redesign");
      setRedesignStep(redesignDraft.redesignStep || 0);
      setRedesignInfo({
        audience: redesignDraft.audience,
        name: redesignDraft.name,
        hasExistingSite: redesignDraft.hasExistingSite,
        domainName: redesignDraft.domainName,
        domainVerified: redesignDraft.domainVerified,
        referenceName: redesignDraft.referenceName,
        referenceVerified: redesignDraft.referenceVerified,
        vision: redesignDraft.vision,
        description: redesignDraft.description,
        websiteRelated: redesignDraft.websiteRelated,
        pageType: redesignDraft.pageType,
        email: redesignDraft.email,
        mobile: redesignDraft.mobile,
        address: redesignDraft.address,
        includeDetails: redesignDraft.includeDetails,
        hasLogo: redesignDraft.hasLogo,
        logoName: redesignDraft.logoName,
      });
      setRedesignPrefs(redesignDraft.prefs);
      setHydrated(true);
      return;
    }

    if (draft && hasMeaningfulOnboardingProgress(draft)) {
      const pageType =
        draft.businessInfo.websiteRelated === "campaign-page"
          ? "single-page"
          : draft.businessInfo.pageType;
      categoryPageTypeRef.current = {
        category: draft.selectedCategory,
        pageType,
      };
      const templateId = draft.selectedTemplateId;
      const restoredStep =
        draft.step === 3 && !templateId ? 2 : draft.step;

      // Only Create-AI draft may reopen the AI studio — never hijack Redesign/Custom.
      if (draft.createPath === "create-ai") {
        const aiId = (draft.createAiDesignId || "").trim();
        if (aiId && /^ca_/i.test(aiId)) {
          setActiveCreateAiDesignId(aiId);
          if (getCreateAiPayload(aiId)) {
            router.replace(`/create-ai/${aiId}`);
            return;
          }
        }
        setEntryMode("create");
        setSelectedWebsiteAction("create-ai");
        setStep(restoredStep);
        setBusinessInfo(draft.businessInfo);
        setSelectedCategory(draft.selectedCategory);
        setHydrated(true);
        return;
      }

      if (draft.createPath === "redesign") {
        setEntryMode("redesign");
        setSelectedWebsiteAction("redesign");
        // Form draft missing/expired — hydrate from mirrored onboarding draft.
        const info = draft.businessInfo;
        setRedesignInfo((prev) => ({
          ...prev,
          audience: info.audience || prev.audience,
          name: info.name || prev.name,
          vision: info.description || prev.vision,
          description: info.description || prev.description,
          websiteRelated: info.websiteRelated || prev.websiteRelated,
          pageType: info.pageType || prev.pageType,
          email: info.email || prev.email,
          mobile: info.mobile || prev.mobile,
          address: info.address || prev.address,
          includeDetails: info.includeDetails,
          hasLogo: info.hasLogo || prev.hasLogo,
          logoName: info.logoName || prev.logoName,
        }));
        if (draft.selectedCategory) {
          setRedesignPrefs((prev) => ({
            ...prev,
            category: draft.selectedCategory,
            pageType:
              info.pageType === "multi-page" ? "multi-page" : "single-page",
          }));
        }
        setRedesignStep(Math.min(Math.max(draft.step, 0), 4));
        setHydrated(true);
        return;
      }

      // create-custom only
      setEntryMode("create");
      setSelectedWebsiteAction("create-custom");
      setStep(restoredStep);
      setBusinessInfo(draft.businessInfo);
      setSelectedCategory(draft.selectedCategory);
      setSelectedTemplateId(templateId);
      setShowMonitor(draft.showMonitor && Boolean(templateId));
      setPagesSelection(
        normalizeOnboardingPagesSelection(
          draft.pagesSelection,
          templateId,
          pageType,
        ),
      );
    }
    setHydrated(true);
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    // Create-AI and Create-Custom each write their own key — never Redesign.
    if (entryMode !== "create") return;
    if (
      selectedWebsiteAction !== "create-ai" &&
      selectedWebsiteAction !== "create-custom"
    ) {
      return;
    }
    saveOnboardingDraft({
      step,
      businessInfo,
      selectedCategory,
      selectedTemplateId,
      showMonitor,
      pagesSelection,
      createPath: selectedWebsiteAction,
      createAiDesignId:
        selectedWebsiteAction === "create-ai"
          ? getActiveCreateAiDesignId() || undefined
          : undefined,
    });
    onDraftChange?.();
  }, [
    hydrated,
    entryMode,
    step,
    businessInfo,
    selectedCategory,
    selectedTemplateId,
    showMonitor,
    pagesSelection,
    selectedWebsiteAction,
    onDraftChange,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    if (entryMode !== "redesign") return;
    if (
      !hasMeaningfulRedesignProgress({
        ...redesignInfo,
        redesignStep,
      })
    ) {
      return;
    }
    saveRedesignFormDraft({
      redesignStep,
      audience: redesignInfo.audience,
      name: redesignInfo.name,
      hasExistingSite: redesignInfo.hasExistingSite,
      domainName: redesignInfo.domainName,
      domainVerified: redesignInfo.domainVerified,
      referenceName: redesignInfo.referenceName,
      referenceVerified: redesignInfo.referenceVerified,
      vision: redesignInfo.vision,
      description: redesignInfo.description,
      websiteRelated: redesignInfo.websiteRelated,
      pageType: redesignInfo.pageType,
      email: redesignInfo.email,
      mobile: redesignInfo.mobile,
      address: redesignInfo.address,
      includeDetails: redesignInfo.includeDetails,
      hasLogo: redesignInfo.hasLogo,
      logoName: redesignInfo.logoName,
      prefs: redesignPrefs,
    });
    // Mirror into path-scoped onboarding key so Continue button sees Redesign.
    saveOnboardingDraft({
      step: Math.min(redesignStep, 3),
      businessInfo: {
        ...defaultOnboardingBusinessInfo(),
        audience: redesignInfo.audience || "clients",
        name: redesignInfo.name,
        description: redesignInfo.vision || redesignInfo.description,
        websiteRelated: redesignInfo.websiteRelated || "service-provider",
        pageType: redesignPrefs.pageType || redesignInfo.pageType || "single-page",
        email: redesignInfo.email,
        mobile: redesignInfo.mobile,
        address: redesignInfo.address,
        includeDetails: redesignInfo.includeDetails,
        hasLogo: redesignInfo.hasLogo || "no",
        logoName: redesignInfo.logoName,
      },
      selectedCategory: redesignPrefs.category || "Business",
      selectedTemplateId: null,
      showMonitor: false,
      createPath: "redesign",
    });
    onDraftChange?.();
  }, [
    hydrated,
    entryMode,
    redesignStep,
    redesignInfo,
    redesignPrefs,
    onDraftChange,
  ]);

  // Only clear theme + pages when the user actually changes category/page type —
  // not on the first hydrate after restoring a saved draft.
  useEffect(() => {
    if (!hydrated) return;
    const pageType =
      businessInfo.websiteRelated === "campaign-page"
        ? "single-page"
        : businessInfo.pageType;
    const prev = categoryPageTypeRef.current;
    categoryPageTypeRef.current = {
      category: selectedCategory,
      pageType,
    };
    if (!prev) return;
    if (prev.category === selectedCategory && prev.pageType === pageType) {
      return;
    }
    setSelectedTemplateId(null);
    setShowMonitor(false);
    setPagesSelection(defaultOnboardingPagesSelection(null, pageType));
  }, [
    hydrated,
    selectedCategory,
    businessInfo.pageType,
    businessInfo.websiteRelated,
  ]);

  const isBusinessInfoValid = isOnboardingBusinessInfoComplete(businessInfo);

  const isReferenceCardValid =
    Boolean(redesignInfo.audience) &&
    Boolean(redesignInfo.name.trim()) &&
    Boolean(redesignInfo.vision.trim()) &&
    Boolean(redesignInfo.domainName.trim()) &&
    redesignInfo.domainVerified &&
    (redesignInfo.includeDetails
      ? isValidEmail(redesignInfo.email) &&
        isValidPhone(redesignInfo.mobile) &&
        Boolean(redesignInfo.address.trim())
      : true);

  const goToPagesStep = (templateId: string) => {
    if (!selectedCategory || !templateId) return;
    const pageType =
      businessInfo.websiteRelated === "campaign-page"
        ? "single-page"
        : businessInfo.pageType;
    setSelectedTemplateId(templateId);
    setShowMonitor(true);
    const nextPages = defaultOnboardingPagesSelection(templateId, pageType);
    setPagesSelection(nextPages);
    saveOnboardingDraft({
      step: 3,
      businessInfo,
      selectedCategory,
      selectedTemplateId: templateId,
      showMonitor: true,
      pagesSelection: nextPages,
      createPath: "create-custom",
    });
    setStep(3);
  };

  /** Create with AI: open dedicated studio (70% UI + 30% chat) — not redesign / not templates. */
  const launchAiCreateFromDetails = () => {
    if (!selectedCategory) return;
    const pageType =
      businessInfo.websiteRelated === "campaign-page"
        ? "single-page"
        : businessInfo.pageType || "single-page";
    const designId = createCreateAiDesignId();
    setActiveCreateAiDesignId(designId);
    saveCreateAiPayload(
      {
        designId,
        brandName: businessInfo.name.trim() || "Your Brand",
        description: businessInfo.description.trim(),
        category: selectedCategory,
        websiteRelated: businessInfo.websiteRelated || "",
        pageType,
        audience: businessInfo.audience || "",
        email: businessInfo.email || "",
        mobile: businessInfo.mobile || "",
        address: businessInfo.address || "",
        hasLogo: businessInfo.hasLogo || "",
        logoImage: businessInfo.logoImage || "",
        designPrefs: aiDesignPrefs,
      },
      designId,
    );
    saveOnboardingDraft({
      step: 2,
      businessInfo,
      selectedCategory,
      selectedTemplateId: null,
      showMonitor: false,
      pagesSelection: defaultOnboardingPagesSelection(null, pageType),
      createPath: "create-ai",
      createAiDesignId: designId,
    });
    // Do not clear create-custom editor drafts — flows stay isolated.
    setSelectedWebsiteAction("create-ai");
    setOpeningFromPreview(true);
    router.push(`/create-ai/${designId}`);
  };

  const openEditorWithTemplate = (templateId: string) => {
    if (!selectedCategory || !templateId || openingFromPreview) return;

    setOpeningFromPreview(true);
    setSelectedTemplateId(templateId);
    setShowMonitor(true);
    clearUserActiveSiteId();
    // Drop stale editor draft so Choose-pages nav isn't overwritten by an older
    // full theme menu saved from a previous session.
    clearEditorDraft();

    const pageLinks = buildPageLinksFromOnboardingSelection(
      pagesSelection,
      templateId,
      businessInfo.websiteRelated === "campaign-page"
        ? "single-page"
        : businessInfo.pageType,
    );
    const footerColumns = buildFooterColumnsFromOnboardingSelection(
      pagesSelection,
      templateId,
      businessInfo.websiteRelated === "campaign-page"
        ? "single-page"
        : businessInfo.pageType,
    );

    saveOnboardingDraft({
      step: 3,
      businessInfo,
      selectedCategory,
      selectedTemplateId: templateId,
      showMonitor: true,
      pagesSelection,
      createPath: "create-custom",
    });

    try {
      writeFlowPageLinks("create-custom", pageLinks);
      writeFlowFooterColumns("create-custom", footerColumns);
      saveOnboardingNavSnapshot({
        templateId,
        menu: pageLinks,
        footerColumns,
      });
      // Mark so editor stamps Header/Footer from Choose pages (not full theme menu).
      sessionStorage.setItem("css-ai-onboarding-page-links-ready", "1");
      sessionStorage.setItem("css-ai-apply-onboarding-header", "1");
      sessionStorage.removeItem("css-ai-onboarding-menu-subset");
      sessionStorage.removeItem("css-ai-sync-header-from-onboarding");
    } catch {
      /* ignore */
    }

    const params = new URLSearchParams({
      templateId,
      category: selectedCategory,
    });
    if (businessInfo.name.trim()) {
      params.set("businessName", businessInfo.name.trim());
    }

    const editorUrl = `/editor?${params.toString()}`;
    setLastEditorUrl(editorUrl);
    router.push(editorUrl);
  };

  const startRedesignBuild = async () => {
    if (openingFromPreview) return;
    setOpeningFromPreview(true);
    setLoadspinner(true);
    await new Promise((resolve) => setTimeout(resolve, 120));
    const { createRedesignDesignId, setActiveRedesignDesignId } = await import(
      "@/lib/redesign-design-id"
    );
    const designId = createRedesignDesignId();
    setActiveRedesignDesignId(designId);
    saveRedesignBuildPayload(
      {
        websiteName: redesignInfo.name,
        domainName: redesignInfo.domainName,
        referenceName: "",
        vision: redesignInfo.vision,
        designId,
        audience: redesignInfo.audience,
        websiteRelated: redesignInfo.websiteRelated || "service-provider",
        category: redesignPrefs.category,
        pageType: redesignPrefs.pageType,
        colorPalette: redesignPrefs.colorPalette,
        fontFamily: redesignPrefs.fontFamily,
        email: redesignInfo.email,
        mobile: redesignInfo.mobile,
        address: redesignInfo.address,
      },
      designId,
    );
    router.push(`/redesign/build/${designId}`);
  };

  const handleContinue = async () => {
    if (entryMode === "choose") {
      if (!selectedWebsiteAction) {
        setWebsiteActionSubmitted(true);
        return;
      }
      if (selectedWebsiteAction === "redesign") {
        setEntryMode("redesign");
        setRedesignStep(0);
        return;
      }
      if (
        selectedWebsiteAction === "create-ai" ||
        selectedWebsiteAction === "create-custom"
      ) {
        setEntryMode("create");
        return;
      }
      setWebsiteActionSubmitted(true);
      return;
    }

    if (entryMode === "redesign") {
      if (redesignStep === 0) {
        if (!isReferenceCardValid) {
          setBusinessInfoSubmitted(true);
          return;
        }
        setBusinessInfoSubmitted(false);
        setRedesignStep(1);
        return;
      }
      if (redesignStep === 1) {
        if (!redesignPrefs.category?.trim()) return;
        setRedesignStep(2);
        return;
      }
      if (redesignStep === 2) {
        if (!redesignPrefs.pageType) return;
        setRedesignStep(3);
        return;
      }
      if (redesignStep === 3) {
        if (!redesignPrefs.colorPalette) return;
        setRedesignStep(4);
        return;
      }
      if (redesignStep === 4) {
        if (!isRedesignDesignPrefsComplete(redesignPrefs)) return;
        await startRedesignBuild();
      }
      return;
    }

    if (step === 0 && !isBusinessInfoValid) {
      setBusinessInfoSubmitted(true);
      return;
    }

    // Create with AI: business → color → font → header → category → generate
    if (step === 0 && selectedWebsiteAction === "create-ai") {
      setBusinessInfoSubmitted(false);
      setAiDesignPhase("color");
      setStep(1);
      return;
    }

    if (step === 1 && selectedWebsiteAction === "create-ai") {
      const idx = CREATE_AI_PREFS_PHASES.indexOf(aiDesignPhase);
      if (idx < CREATE_AI_PREFS_PHASES.length - 1) {
        setAiDesignPhase(CREATE_AI_PREFS_PHASES[idx + 1]!);
        return;
      }
      setStep(2);
      return;
    }

    if (step === 1 && !selectedCategory) {
      return;
    }

    if (step === 2 && selectedWebsiteAction === "create-ai") {
      if (!selectedCategory) return;
      setLoadspinner(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      launchAiCreateFromDetails();
      setLoadspinner(false);
      return;
    }

    if (step === 2) {
      if (!selectedTemplateId) return;
      goToPagesStep(selectedTemplateId);
      return;
    }

    if (step === 3) {
      if (!selectedTemplateId) return;
      openEditorWithTemplate(selectedTemplateId);
      return;
    }

    setLoadspinner(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (step < 3) {
      setStep((prev) => prev + 1);
    }
    setLoadspinner(false);
  };

  const handleBack = () => {
    if (entryMode === "redesign") {
      if (redesignStep > 0) {
        setRedesignStep((s) => s - 1);
        return;
      }
      setEntryMode("choose");
      setBusinessInfoSubmitted(false);
      setRedesignStep(0);
      return;
    }
    if (entryMode === "choose") {
      onBack();
      return;
    }
    if (step === 0) {
      setEntryMode("choose");
      return;
    }
    if (
      entryMode === "create" &&
      selectedWebsiteAction === "create-ai" &&
      step === 1
    ) {
      const idx = CREATE_AI_PREFS_PHASES.indexOf(aiDesignPhase);
      if (idx > 0) {
        setAiDesignPhase(CREATE_AI_PREFS_PHASES[idx - 1]!);
        return;
      }
    }
    if (
      entryMode === "create" &&
      selectedWebsiteAction === "create-ai" &&
      step === 2
    ) {
      setAiDesignPhase("header");
      setStep(1);
      return;
    }
    setStep((prev) => prev - 1);
  };

  const showOnboardingFooter = entryMode !== "choose";

  if (!contentReady) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[#fbfaf6]">
        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#315ff4] border-t-transparent" />
          Loading categories &amp; templates…
        </div>
      </div>
    );
  }

  return (
    <main
      className={`relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#fbfaf6] pt-[84px] text-[#08132f] 2xl:pt-20 ${
        showOnboardingFooter ? "pb-[72px]" : "pb-0"
      }`}
    >
      <OnboardingBackdrop />

      <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl 2xl:h-20">
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
          </nav>
        </div>
      </header>

      <div className="relative z-10 w-full max-w-[1320px] overflow-visible px-4 sm:px-7 lg:px-8 2xl:max-w-[1632px]">
        <div className="w-full">
          {entryMode === "choose" && (
            <div className="min-w-0 w-full">
              <WebsiteCreation
                showErrors={websiteActionSubmitted}
                selectedAction={selectedWebsiteAction}
                onActionChange={(action) => {
                  setSelectedWebsiteAction(action);
                  setWebsiteActionSubmitted(false);
                  setBusinessInfoSubmitted(false);
                  if (action === "redesign") {
                    setEntryMode("redesign");
                    setRedesignStep(0);
                    return;
                  }
                  if (action === "create-ai" || action === "create-custom") {
                    setEntryMode("create");
                    setStep(0);
                    if (action === "create-ai") {
                      setAiDesignPhase("color");
                      setBusinessInfo((prev) =>
                        prev.pageType === "single-page"
                          ? prev
                          : { ...prev, pageType: "single-page" },
                      );
                    }
                  }
                }}
              />
            </div>
          )}

          {entryMode === "redesign" && redesignStep === 0 && (
            <div className="min-w-0 w-full">
              <ReferenceCard
                value={redesignInfo}
                showErrors={businessInfoSubmitted}
                onChange={(nextValue) => {
                  setRedesignInfo(nextValue as RedesignFormInfo);
                  const referenceIsValid =
                    Boolean(nextValue.audience) &&
                    Boolean(nextValue.name.trim()) &&
                    Boolean(nextValue.vision.trim()) &&
                    Boolean(nextValue.domainName.trim()) &&
                    nextValue.domainVerified &&
                    (nextValue.includeDetails
                      ? isValidEmail(nextValue.email) &&
                        isValidPhone(nextValue.mobile) &&
                        Boolean(nextValue.address.trim())
                      : true);
                  if (referenceIsValid) {
                    setBusinessInfoSubmitted(false);
                  }
                }}
              />
            </div>
          )}

          {entryMode === "redesign" && redesignStep === 1 && (
            <div className="min-w-0 w-full">
              <RedesignDesignPrefsStep
                phase="category"
                value={redesignPrefs}
                onChange={setRedesignPrefs}
              />
            </div>
          )}
          {entryMode === "redesign" && redesignStep === 2 && (
            <div className="min-w-0 w-full">
              <RedesignDesignPrefsStep
                phase="pageType"
                value={redesignPrefs}
                onChange={setRedesignPrefs}
              />
            </div>
          )}
          {entryMode === "redesign" && redesignStep === 3 && (
            <div className="min-w-0 w-full">
              <RedesignDesignPrefsStep
                phase="color"
                value={redesignPrefs}
                onChange={setRedesignPrefs}
              />
            </div>
          )}
          {entryMode === "redesign" && redesignStep === 4 && (
            <div className="min-w-0 w-full">
              <RedesignDesignPrefsStep
                phase="font"
                value={redesignPrefs}
                onChange={setRedesignPrefs}
              />
            </div>
          )}

          {entryMode === "create" && step === 0 && (
            <div className="min-w-0 w-full">
            <Categorystep
              value={businessInfo}
              showErrors={businessInfoSubmitted}
              createPath={
                selectedWebsiteAction === "create-ai" ||
                selectedWebsiteAction === "create-custom"
                  ? selectedWebsiteAction
                  : "create-custom"
              }
              onChange={(nextValue) => {
                setBusinessInfo(nextValue);
                  if (isOnboardingBusinessInfoComplete(nextValue)) {
                  setBusinessInfoSubmitted(false);
                }
              }}
            />
            </div>
          )}
          {entryMode === "create" &&
            selectedWebsiteAction === "create-ai" &&
            step === 1 && (
              <CreateAiDesignPrefsStep
                phase={aiDesignPhase}
                value={aiDesignPrefs}
                onChange={setAiDesignPrefs}
              />
            )}
          {entryMode === "create" &&
            ((selectedWebsiteAction === "create-ai" && step === 2) ||
              (selectedWebsiteAction !== "create-ai" && step === 1)) && (
            <CategoryType
              selectedCategory={selectedCategory}
              websiteRelated={businessInfo.websiteRelated}
              onCategoryChange={setSelectedCategory}
              createPath={
                selectedWebsiteAction === "create-ai" ? "create-ai" : "create-custom"
              }
            />
          )}
          {entryMode === "create" &&
            selectedWebsiteAction !== "create-ai" &&
            step === 2 && (
            <TemplatePreview
              selectedCategory={selectedCategory}
              selectedTemplateId={selectedTemplateId}
              onTemplateSelect={setSelectedTemplateId}
              showMonitor={showMonitor}
              onShowMonitorChange={setShowMonitor}
              businessName={businessInfo.name}
              pageType={
                businessInfo.websiteRelated === "campaign-page"
                  ? "single-page"
                  : businessInfo.pageType
              }
              onOpenEditorWithTheme={goToPagesStep}
              openingEditor={openingFromPreview}
            />
          )}
          {entryMode === "create" &&
            selectedWebsiteAction !== "create-ai" &&
            step === 3 && (
            <PageSelection
              templateId={selectedTemplateId}
              pageType={
                businessInfo.websiteRelated === "campaign-page"
                  ? "single-page"
                  : businessInfo.pageType
              }
              selectedPages={pagesSelection.selectedPages}
              onChange={(selectedPages) =>
                setPagesSelection({ selectedPages })
              }
            />
          )}
        </div>
      </div>

      {showOnboardingFooter && (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 py-2.5 backdrop-blur-xl 2xl:h-[72px]">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between px-4 sm:px-7 lg:px-8 2xl:max-w-[1632px]">
            <div className="flex items-center gap-3">
              <button
          type="button"
                onClick={handleBack}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-blue-700 px-4 text-xs font-medium text-white shadow-sm transition hover:border-blue-300 2xl:h-10 2xl:px-5 2xl:text-sm"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>

            {entryMode !== "redesign" && (
              <div className="hidden items-center gap-2 text-[11px] font-medium text-slate-400 sm:flex 2xl:text-xs">
                <span className="size-1.5 rounded-full bg-[#315ff4]" />
                Your progress is saved automatically
              </div>
            )}
            {entryMode === "redesign" && <div className="hidden sm:block" />}

            <button
          type="button"
          onClick={handleContinue}
              disabled={
                loadspinner ||
                openingFromPreview ||
                (entryMode === "redesign" &&
                  redesignStep === 0 &&
                  !isReferenceCardValid) ||
                (entryMode === "redesign" &&
                  redesignStep === 1 &&
                  !redesignPrefs.category?.trim()) ||
                (entryMode === "redesign" &&
                  redesignStep === 2 &&
                  !redesignPrefs.pageType) ||
                (entryMode === "redesign" &&
                  redesignStep === 3 &&
                  !redesignPrefs.colorPalette) ||
                (entryMode === "redesign" &&
                  redesignStep === 4 &&
                  !isRedesignDesignPrefsComplete(redesignPrefs)) ||
                (entryMode === "create" && step === 0 && !isBusinessInfoValid) ||
                (entryMode === "create" &&
                  selectedWebsiteAction === "create-ai" &&
                  step === 2 &&
                  !selectedCategory) ||
                (entryMode === "create" &&
                  selectedWebsiteAction !== "create-ai" &&
                  step === 1 &&
                  !selectedCategory) ||
                (entryMode === "create" &&
                  selectedWebsiteAction !== "create-ai" &&
                  step === 2 &&
                  !selectedTemplateId) ||
                (entryMode === "create" &&
                  selectedWebsiteAction !== "create-ai" &&
                  step === 3 &&
                  (pagesSelection.selectedPages.length === 0 ||
                    !selectedTemplateId))
              }
              className="group inline-flex h-9 min-w-[122px] items-center justify-center gap-2 rounded-lg bg-[#08132f] px-5 text-xs font-medium text-white shadow-[0_8px_20px_rgba(8,19,47,.16)] transition hover:bg-[#315ff4] disabled:cursor-not-allowed disabled:opacity-50 2xl:h-10 2xl:min-w-[142px] 2xl:px-6 2xl:text-sm"
        >
          {loadspinner && (
                <span className="size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {loadspinner || openingFromPreview
                ? "Loading..."
                : entryMode === "redesign" && redesignStep === 4
                  ? "Start redesign"
                : entryMode === "create" &&
                    selectedWebsiteAction === "create-ai" &&
                    step === 2
                  ? "Generate with AI"
                  : entryMode === "create" && step === 3
                    ? "Open editor"
                    : "Continue"}
              {!loadspinner && !openingFromPreview && (
                <ArrowRight
                  size={14}
                  className="transition group-hover:translate-x-0.5"
                />
              )}
            </button>
          </div>
      </div>
      )}

      <GetQuoteEnquiryModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
      />
    </main>
  );
}

function OnboardingBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 top-16 overflow-hidden 2xl:top-20"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,.82),transparent_42%),linear-gradient(180deg,#fcfbf8_0%,#faf9f4_100%)]" />
      <svg
        viewBox="0 0 1600 760"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <pattern
            id="onboarding-dots"
            width="17"
            height="17"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.35" fill="#6299ff" opacity=".82" />
          </pattern>
        </defs>

        <path
          d="M-72 183 A250 250 0 0 1 218 -58"
          fill="none"
          stroke="#a9c8ff"
          strokeWidth="116"
          opacity=".82"
        />
        <circle cx="263" cy="185" r="62" fill="#cbb4ed" opacity=".64" />
        <rect
          x="72"
          y="188"
          width="145"
          height="145"
          fill="url(#onboarding-dots)"
        />
        <path
          d="M268 74 C420 58 436 184 568 184"
          fill="none"
          stroke="#70a7ff"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
          opacity=".9"
        />

        <path
          d="M1295 760 A270 270 0 0 1 1565 490 L1565 760 Z"
          fill="#FFD3C4"
          opacity=".9"
        />
        <rect
          x="1498"
          y="624"
          width="150"
          height="136"
          fill="#f5a03b"
          opacity=".72"
        />
        <rect
          x="1570"
          y="624"
          width="120"
          height="136"
          fill="#ffd25f"
          opacity=".72"
        />
        <path
          d="M1405 760 A118 118 0 0 1 1523 642"
          fill="none"
          stroke="#155292"
          strokeWidth="4"
        />
        <path
          d="M1000 580 C1090 690 1170 652 1235 664 C1295 676 1332 724 1430 690"
          fill="none"
          stroke="#70a7ff"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
          opacity=".9"
        />

        <path
          d="M1490 70 C1490 84 1497 92 1510 92 C1497 92 1490 100 1490 114 C1490 100 1483 92 1470 92 C1483 92 1490 84 1490 70Z"
          fill="#76a9ff"
        />
        <path
          d="M1462 112 C1462 123 1468 129 1478 129 C1468 129 1462 135 1462 146 C1462 135 1456 129 1446 129 C1456 129 1462 123 1462 112Z"
          fill="#d4b8ec"
        />
        <path
          d="M1516 140 C1516 150 1521 156 1531 156 C1521 156 1516 162 1516 172 C1516 162 1511 156 1501 156 C1511 156 1516 150 1516 140Z"
          fill="#f6bd4d"
        />
        <path
          d="M88 620 C88 633 95 641 108 641 C95 641 88 649 88 662 C88 649 81 641 68 641 C81 641 88 633 88 620Z"
          fill="#f6bd4d"
        />
        <path
          d="M136 650 C136 661 142 667 153 667 C142 667 136 673 136 684 C136 673 130 667 119 667 C130 667 136 661 136 650Z"
          fill="#d4b8ec"
        />
        <path
          d="M106 685 C106 699 113 707 127 707 C113 707 106 715 106 729 C106 715 99 707 85 707 C99 707 106 699 106 685Z"
          fill="#76a9ff"
        />
      </svg>
      <div className="absolute inset-px rounded-2xl border border-slate-200/60" />
    </div>
  );
}
