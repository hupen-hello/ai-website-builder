"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Webdiffer from "./webdiffer";
import Image from "next/image";
import BusinessOnboarding from "./businessonboarding";
import Button from "@/components/ui/Button";
import {
  getOnboardingDraftSummary,
} from "@/lib/onboardingDraft";
import {
  resetGuestWebsiteProgress,
} from "@/lib/userDraftReset";
import { clearUserActiveSiteId } from "@/lib/migrateGuestSite";
import { confirmStartFresh } from "@/lib/confirmDialog";

export default function Main() {
  const router = useRouter();
  const words = useMemo(() => ["Today", "in Minutes"], []);

  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingKey, setOnboardingKey] = useState(0);
  const [draftSummary, setDraftSummary] = useState<
    ReturnType<typeof getOnboardingDraftSummary>
  >(null);

  const refreshDraftSummary = useCallback(() => {
    setDraftSummary(getOnboardingDraftSummary());
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(refreshDraftSummary);
    return () => window.cancelAnimationFrame(frame);
  }, [refreshDraftSummary]);

  const resumeOnboarding = () => {
    setShowOnboarding(true);
  };

  const resumeEditor = () => {
    if (draftSummary?.editorUrl) {
      router.push(draftSummary.editorUrl);
    }
  };

  const handleStartFresh = async () => {
    const ok = await confirmStartFresh();
    if (!ok) return;

    resetGuestWebsiteProgress();
    clearUserActiveSiteId();
    setDraftSummary(null);
    refreshDraftSummary();
    setOnboardingKey((k) => k + 1);
    setShowOnboarding(true);
  };

  useEffect(() => {
    const currentWord = words[wordIndex] || "";
    const isComplete = text === currentWord;
    const isEmpty = text === "";

    const speed = isDeleting ? 110 : isComplete ? 1900 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (isComplete) {
          setIsDeleting(true);
          return;
        }

        setText(currentWord.slice(0, text.length + 1));
      } else {
        if (isEmpty) {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
          return;
        }

        setText(currentWord.slice(0, text.length - 1));
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, words]);

  return (
    <div className="w-full h-screen flex flex-col md:justify-center items-center relative">
      <div className="absolute left-0 top-0 h-full w-full max-w-[600px] pointer-events-none">
        <Image
          src="/texture-left.png"
          alt="left-texture"
          fill
          className="object-contain object-left-top"
          priority
        />
      </div>

      <div className="absolute right-0 top-0 h-full w-full max-w-[600px] pointer-events-none">
        <Image
          src="/texture-right.png"
          alt="right-texture"
          fill
          className="object-contain object-top-right"
          priority
        />
      </div>

      {!showOnboarding ? (
        <>
          <div className="w-full text-center flex flex-col gap-3 px-4 z-10">
            <h1 className="text-4xl sm:text-4xl md:text-6xl lg:text-[60px] 2xl:text-[95px] font-bold tracking-tight mt-25 lg:mt-10">
              Build Your <br />
              <span className="relative inline-block whitespace-nowrap">
                <span className="text-[var(--red)]">Website</span>

                <span className="text-black">
                  {" "}
                  {text}
                  <span className="ml-1 animate-pulse animate-fade-cursor text-6xl">
                    |
                  </span>
                </span>
              </span>
            </h1>

            <p className="text-gray-600 text-sm font-medium">
              Create a stunning website in minutes with the power of AI, expert
              guidance, or <br /> your own custom design.
            </p>
          </div>

          <div className="w-full max-w-6xl z-10 mt-2 lg:mt-5 mb-4 lg:mb-0">
            {draftSummary ? (
              <div className="mx-auto mb-4 max-w-xl rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-800">
                  Welcome back, {draftSummary.name}!
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {draftSummary.hasEditorEdits
                    ? "Your template edits are saved on this device — open the editor to continue."
                    : draftSummary.category
                      ? `Your ${draftSummary.category} website setup is saved on this device.`
                      : "Your setup is saved on this device."}
                  {!draftSummary.hasEditorEdits &&
                    (draftSummary.hasTemplate
                      ? " Pick up at template preview."
                      : " Continue where you left off.")}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  {draftSummary.hasEditorEdits && draftSummary.editorUrl ? (
                    <Button
                      type="button"
                      onClick={resumeEditor}
                      variant="danger"
                      className="px-6 py-2 text-sm font-bold"
                    >
                      Resume editor
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    onClick={resumeOnboarding}
                    variant={
                      draftSummary.hasEditorEdits ? "secondary" : "danger"
                    }
                    className="px-6 py-2 text-sm font-bold"
                  >
                    {draftSummary.hasEditorEdits
                      ? "Back to setup"
                      : "Continue where you left off"}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="mt-3 text-xs font-semibold text-slate-500 underline-offset-2 hover:text-red-600 hover:underline"
                >
                  Start fresh — clear everything on this device
                </button>
              </div>
            ) : null}

            <Webdiffer onStart={resumeOnboarding} />
          </div>
        </>
      ) : (
        <BusinessOnboarding
          key={onboardingKey}
          onBack={() => {
            setShowOnboarding(false);
            refreshDraftSummary();
          }}
          onDraftChange={refreshDraftSummary}
        />
      )}
    </div>
  );
}
