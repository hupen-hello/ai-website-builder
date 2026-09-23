"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CodePanel, { type CodePanelSize, type OpenedCodeSection } from "../components/CodePanel";
import ElementPanel, { type SelectedElement } from "../components/ElementPanel";
import ExportWebsiteModal from "../components/ExportWebsiteModal";
import LoginPublishModal from "../components/LoginPublishModal";
import MainHero from "../components/MainHero";
import Navbar from "../components/Navbar";
import { setActiveRedesignDesignId } from "@/lib/redesign-design-id";
import { mirrorBuiltSiteCache } from "@/lib/built-site-theme";

const ELEMENT_PANEL_PERCENT = 14;

const CODE_PANEL_WIDTHS: Record<CodePanelSize, number> = {
  Mobile: 70,
  Tablet: 50,
  Desktop: 30,
};

export default function RedesignPage() {
  const params = useParams();
  const router = useRouter();
  const designId =
    typeof params.designId === "string" ? params.designId.trim() : "";
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [codePanelSize, setCodePanelSize] = useState<CodePanelSize>("Desktop");
  const [previewDevice, setPreviewDevice] = useState<CodePanelSize>("Desktop");
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isElementPanelOpen, setIsElementPanelOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showCodeToggle, setShowCodeToggle] = useState(false);
  const [showElementToggle, setShowElementToggle] = useState(false);
  const [openedCodeSection, setOpenedCodeSection] = useState<OpenedCodeSection | null>(null);

  useEffect(() => {
    if (!designId) {
      router.replace("/");
      return;
    }
    setActiveRedesignDesignId(designId);
    mirrorBuiltSiteCache(designId);
  }, [designId, router]);

  useEffect(() => {
    const handleElementSelection = (event: MessageEvent<Partial<SelectedElement> & { type?: string; sectionId?: string; label?: string; html?: string }>) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "redesign-exit-view-mode") {
        setIsViewMode(false);
        return;
      }
      if (event.data?.type === "redesign-code-panel-open" && event.data.sectionId && event.data.label && typeof event.data.html === "string") {
        setOpenedCodeSection({
          id: event.data.sectionId,
          label: event.data.label,
          html: event.data.html,
        });
        setShowCodeToggle(true);
        setIsViewMode(false);
        setIsElementPanelOpen(false);
        setSelectedElement(null);
        setCodePanelSize("Desktop");
        setPreviewDevice("Desktop");
        setIsCodePanelOpen(true);
        return;
      }
      if (event.data?.type === "redesign-element-cleared") {
        setSelectedElement(null);
        setIsElementPanelOpen(false);
        return;
      }
      if (event.data?.type !== "redesign-element-selected") return;
      setIsViewMode(false);
      setIsCodePanelOpen(false);
      setSelectedElement(event.data as SelectedElement);
      setIsElementPanelOpen(true);
      setShowElementToggle(true);
    };

    window.addEventListener("message", handleElementSelection);
    return () => window.removeEventListener("message", handleElementSelection);
  }, []);

  useEffect(() => {
    const handleHistoryApplied = () => {
      setSelectedElement(null);
      setIsElementPanelOpen(false);
    };

    window.addEventListener("redesign-history-applied", handleHistoryApplied);
    return () => window.removeEventListener("redesign-history-applied", handleHistoryApplied);
  }, []);

  useEffect(() => {
    const handleUnsavedChanges = () => setHasUnsavedChanges(true);
    window.addEventListener("redesign-unsaved-changes", handleUnsavedChanges);
    return () => window.removeEventListener("redesign-unsaved-changes", handleUnsavedChanges);
  }, []);

  useEffect(() => {
    const handleSaveChanges = () => setHasUnsavedChanges(false);
    window.addEventListener("redesign-save-changes", handleSaveChanges);
    return () => window.removeEventListener("redesign-save-changes", handleSaveChanges);
  }, []);

  const codePanelWidth = CODE_PANEL_WIDTHS[codePanelSize];

  const previewWidth =
    100 -
    (isViewMode ? 0 : isCodePanelOpen ? codePanelWidth : 0) -
    (isViewMode ? 0 : isElementPanelOpen ? ELEMENT_PANEL_PERCENT : 0);
  const hasBottomPanel = !isViewMode && (isCodePanelOpen || isElementPanelOpen);

  const enterViewMode = () => {
    setIsCodePanelOpen(false);
    setIsElementPanelOpen(false);
    setIsViewMode(true);
  };

  const openCodePanel = () => {
    if (isElementPanelOpen) {
      setIsElementPanelOpen(false);
    }
    setShowCodeToggle(true);
    setCodePanelSize("Desktop");
    setPreviewDevice("Desktop");
    setIsViewMode(false);
    setIsCodePanelOpen(true);
  };

  const toggleCodePanel = () => {
    if (isCodePanelOpen) {
      setIsCodePanelOpen(false);
      return;
    }
    openCodePanel();
  };

  const toggleElementPanel = () => {
    if (isElementPanelOpen) {
      setIsElementPanelOpen(false);
      return;
    }
    setIsCodePanelOpen(false);
    setIsElementPanelOpen(true);
    if (!selectedElement) {
      window.dispatchEvent(new CustomEvent("redesign-request-primary-element"));
    }
  };

  const handleCodePanelSizeChange = (size: CodePanelSize) => {
    setCodePanelSize(size);
    setPreviewDevice(size);
  };

  const handlePrimaryAction = () => {
    if (hasUnsavedChanges) {
      window.dispatchEvent(new CustomEvent("redesign-save-changes"));
      setHasUnsavedChanges(false);
      return;
    }
    setIsExportOpen(true);
  };

  const handleLogin = (email: string) => {
    const existingRaw = window.localStorage.getItem("lestow-user");
    let existing: { name?: string; email?: string; password?: string; avatar?: string } = {};
    try {
      existing = existingRaw ? JSON.parse(existingRaw) : {};
    } catch {
      existing = {};
    }
    window.localStorage.setItem(
      "lestow-user",
      JSON.stringify({
        ...existing,
        email,
        name: existing.name || email.split("@")[0],
      }),
    );
    setUserEmail(email);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    window.localStorage.removeItem("lestow-user");
    setUserEmail(null);
    setIsExportOpen(false);
  };

  return (
    <main
      data-redesign-theme={isDark ? "dark" : "light"}
      className={`redesign-shell fixed inset-0 flex flex-col overflow-hidden transition-colors ${isDark ? "bg-[#0d0f12] text-white" : "bg-white text-slate-900"}`}
    >
      {!isViewMode && (
      <Navbar
        isDark={isDark}
        hasUnsavedChanges={hasUnsavedChanges}
        userEmail={userEmail}
        onPrimaryAction={handlePrimaryAction}
        onLogout={handleLogout}
      />
      )}
      <LoginPublishModal
        open={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />
      <ExportWebsiteModal
        open={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        designId={designId}
      />

      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className={`order-1 min-h-0 w-full ${hasBottomPanel ? "h-[60%]" : "h-full"} lg:contents`}>
          <MainHero
            width={previewWidth}
            breakpoint={isCodePanelOpen ? codePanelSize : previewDevice}
            isDark={isDark}
            isCodePanelOpen={isCodePanelOpen}
            isElementPanelOpen={isElementPanelOpen}
            showCodeToggle={showCodeToggle}
            showElementToggle={showElementToggle}
            onBreakpointChange={(size) => {
              setPreviewDevice(size);
              setCodePanelSize(size);
            }}
            onThemeChange={setIsDark}
            onToggleCodePanel={toggleCodePanel}
            onToggleElementPanel={toggleElementPanel}
            onOpenCodePanel={openCodePanel}
            isViewMode={isViewMode}
            onViewModeChange={(next) => {
              if (next) enterViewMode();
              else setIsViewMode(false);
            }}
            onAddPage={() => setIsLoginOpen(true)}
          />
        </div>

        {hasBottomPanel && (
          <div className="order-2 flex h-[40%] min-h-0 w-full border-t border-white/10 lg:contents lg:border-0">
            {isCodePanelOpen && (
              <CodePanel
                width={codePanelWidth}
                size={codePanelSize}
                onSizeChange={handleCodePanelSizeChange}
                openedSection={openedCodeSection}
              />
            )}

            {isElementPanelOpen && (
              <ElementPanel
                width={ELEMENT_PANEL_PERCENT}
                isDark={isDark}
                selection={selectedElement}
                onChange={setSelectedElement}
                onClose={() => setIsElementPanelOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
