"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import MainHero from "./components/MainHero";
import EditorLoadingScreen from "./components/EditorLoadingScreen";
import {
  UserAuthProvider,
  useUserAuth,
} from "@/components/auth/UserAuthContext";
import { hasEditorDraftFor, readEditorDraft } from "@/lib/editorDraft";
import { canOpenEditorFromOnboarding } from "@/lib/onboardingDraft";
import { consumePlanSuccessMessage, redirectToAuth } from "@/lib/authReturn";
import { applyPendingCoreIfNeeded } from "@/lib/userPlan";
import { showAppAlert } from "@/lib/confirmDialog";
import { readRedesignEditorPack } from "@/lib/redesign-editor-session";
import { readRedesignEditorSections } from "@/lib/build-redesign-home-sections";
import { setActiveRedesignDesignId } from "@/lib/redesign-design-id";

function EditorPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useUserAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [approvedEditorRoute, setApprovedEditorRoute] = useState("");
  const [editorBootReady, setEditorBootReady] = useState(false);
  const designId = (searchParams.get("designId") || "").trim();
  const redesignPack =
    designId.startsWith("rd_") ? readRedesignEditorPack(designId) : null;
  const redesignDraft = designId.startsWith("rd_")
    ? readEditorDraft(undefined, undefined, designId)
    : null;
  const templateId =
    searchParams.get("templateId") ||
    redesignPack?.templateId ||
    redesignDraft?.templateId ||
    null;
  const category =
    searchParams.get("category") ||
    redesignPack?.category ||
    redesignDraft?.category ||
    null;
  const siteId = searchParams.get("siteId");
  // Ignore `page=` — switching editor pages must not remount the shell
  // (that was re-fetching the site in a careers ↔ rent loop).
  const editorRouteKey = [
    templateId || "",
    category || "",
    siteId || "",
    designId || "",
  ].join(":");
  const isBareEditorUrl =
    !templateId && !category && !siteId && !designId.startsWith("rd_");
  const isPrivateSiteBlocked = Boolean(siteId && !user);
  const accessApproved =
    !authLoading &&
    approvedEditorRoute === editorRouteKey &&
    !isBareEditorUrl &&
    !isPrivateSiteBlocked;

  useEffect(() => {
    if (designId.startsWith("rd_")) setActiveRedesignDesignId(designId);
  }, [designId]);

  useEffect(() => {
    setEditorBootReady(false);
  }, [editorRouteKey]);

  useEffect(() => {
    const handleEditorReady = () => setEditorBootReady(true);
    window.addEventListener("ai-builder-editor-ready", handleEditorReady);
    return () => {
      window.removeEventListener("ai-builder-editor-ready", handleEditorReady);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const guardTimeout = window.setTimeout(() => {
      if (isBareEditorUrl) {
        router.replace(user ? "/user/dashboard" : "/");
        return;
      }

      if (siteId && !user) {
        redirectToAuth({
          returnUrl: `/editor?${searchParams.toString()}`,
        });
        return;
      }

      if (!siteId) {
        if (!templateId || !category) {
          router.replace("/");
          return;
        }

        const redesignOk =
          designId.startsWith("rd_") &&
          Boolean(templateId && category) &&
          (
            (Boolean(redesignPack?.templateId) &&
              redesignPack?.templateId === templateId &&
              redesignPack?.category === category) ||
            Boolean(redesignDraft?.templateId) ||
            Boolean(readRedesignEditorSections(designId)?.length)
          );

        const hasSetupAccess =
          redesignOk ||
          canOpenEditorFromOnboarding(templateId, category) ||
          hasEditorDraftFor(templateId, category);
        if (!hasSetupAccess) {
          router.replace("/");
          return;
        }
      }

      setApprovedEditorRoute(editorRouteKey);
    }, 0);

    return () => window.clearTimeout(guardTimeout);
  }, [
    authLoading,
    category,
    designId,
    editorRouteKey,
    isBareEditorUrl,
    redesignPack?.category,
    redesignPack?.templateId,
    redesignDraft?.templateId,
    router,
    searchParams,
    siteId,
    templateId,
    user,
  ]);

  useEffect(() => {
    if (!accessApproved || !editorBootReady) return;
    if (siteId) applyPendingCoreIfNeeded(siteId);
    else applyPendingCoreIfNeeded();
    const message = consumePlanSuccessMessage();
    if (!message) return;
    void showAppAlert({
      title: "Upgrade successful",
      text: message,
      icon: "success",
      confirmButtonText: "Continue",
    });
  }, [accessApproved, editorBootReady, siteId]);

  if (!accessApproved) {
    return <EditorLoadingScreen message="Loading editor…" />;
  }

  return (
    <main className="relative min-h-screen bg-white text-black">
      <Header onMenuClick={() => setMobileOpen(true)} />

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <MainHero collapsed={collapsed} />

      {!editorBootReady ? (
        <div className="fixed inset-0 z-[20000]">
          <EditorLoadingScreen message="Loading editor…" />
        </div>
      ) : null}
    </main>
  );
}

export default function Page() {
  return (
    <UserAuthProvider>
      <Suspense fallback={<EditorLoadingScreen message="Loading editor…" />}>
        <EditorPageContent />
      </Suspense>
    </UserAuthProvider>
  );
}
