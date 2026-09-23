"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowRight, Sparkles, X } from "lucide-react";
import type { getOnboardingDraftSummary } from "@/lib/onboardingDraft";

type DraftSummary = NonNullable<ReturnType<typeof getOnboardingDraftSummary>>;

type DraftResumeModalProps = {
  open: boolean;
  draftSummary: DraftSummary | null;
  onClose: () => void;
  onContinueSetup: () => void;
  onResumeEditor: () => void;
  onStartFresh: () => void | Promise<void>;
};

const subscribeToClientMount = () => () => {};

export default function DraftResumeModal({
  open,
  draftSummary,
  onClose,
  onContinueSetup,
  onResumeEditor,
  onStartFresh,
}: DraftResumeModalProps) {
  const mounted = useSyncExternalStore(
    subscribeToClientMount,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || !draftSummary || !mounted) return null;

  const handleContinueSetup = () => {
    onClose();
    onContinueSetup();
  };

  const handleResumeEditor = () => {
    onClose();
    onResumeEditor();
  };

  const handleStartFresh = () => {
    void onStartFresh();
  };

  const description =
    draftSummary.createPath === "redesign" && draftSummary.editorUrl
      ? "Your Redesign site is saved on this device. Open the editor to keep editing, or continue setup."
      : draftSummary.createPath === "redesign"
        ? "Your Redesign setup is saved on this device. Continue to rebuild from your existing domain."
        : draftSummary.createAiUrl
          ? "Your Create with AI site is saved on this device. Open the studio to keep refining."
          : draftSummary.editorUrl
            ? "Your template edits are saved on this device. Pick up right where you left off."
            : draftSummary.category
              ? `Your ${draftSummary.category} website setup is saved on this device.`
              : "Your progress is saved on this device.";

  const continueLabel =
    draftSummary.createPath === "redesign"
      ? draftSummary.editorUrl
        ? "Back to Redesign setup"
        : "Continue Redesign"
      : draftSummary.createAiUrl
        ? "Open Create with AI"
        : draftSummary.editorUrl
          ? "Back to setup"
          : "Continue where you left off";

  const editorLabel =
    draftSummary.createPath === "redesign"
      ? "Open editor"
      : "Resume editor";

  const showEditorCta = Boolean(draftSummary.editorUrl);
  const primaryIsEditor =
    showEditorCta && !draftSummary.createAiUrl;
  const primaryIsCreateAi = Boolean(draftSummary.createAiUrl);

  return createPortal(
    <div
      className="fixed inset-0 z-[10050] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-resume-title"
    >
      <button
        type="button"
        aria-label="Close draft dialog"
        className="absolute inset-0 bg-[#08132f]/75 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_32px_100px_rgba(8,19,47,0.42)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#173fdb] via-[#1b47e8] to-[#08132f] px-6 pb-8 pt-8 text-center sm:px-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 left-6 size-36 rounded-full bg-[#b9ff66]/12 blur-3xl"
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/80 backdrop-blur-sm transition hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="relative mx-auto mb-5 flex justify-center">
            <Image
              src="/lestow-logo.svg"
              alt="Lestow AI Website Builder"
              width={132}
              height={40}
              priority
              className="h-10 w-[132px] brightness-0 invert"
            />
          </div>

          <div className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
            <Sparkles size={13} className="text-[#b9ff66]" />
            Saved draft
          </div>

          <h2
            id="draft-resume-title"
            className="relative mt-4 text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[30px]"
          >
            Welcome back, {draftSummary.name}!
          </h2>
          <p className="relative mx-auto mt-2 max-w-sm text-sm leading-6 text-white/72">
            {description}
          </p>
        </div>

        <div className="space-y-3 px-6 py-6 sm:px-8 sm:py-7">
          {showEditorCta ? (
            <button
              type="button"
              onClick={handleResumeEditor}
              className={`group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition hover:-translate-y-0.5 ${
                primaryIsEditor
                  ? "bg-[#b9ff66] text-[#07111e] shadow-[0_10px_28px_rgba(185,255,102,0.28)] hover:bg-lime-300"
                  : "border border-slate-200 bg-white text-[#08132f] hover:border-[#173fdb]/35 hover:bg-slate-50"
              }`}
            >
              {editorLabel}
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-0.5"
              />
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleContinueSetup}
            className={`inline-flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
              primaryIsCreateAi || (!showEditorCta && !primaryIsCreateAi)
                ? "bg-[#08132f] text-white shadow-[0_10px_28px_rgba(8,19,47,0.14)] hover:bg-[#173fdb]"
                : "border border-slate-200 bg-white text-[#08132f] hover:border-[#173fdb]/35 hover:bg-slate-50"
            }`}
          >
            {continueLabel}
          </button>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleStartFresh}
              className="text-xs font-medium text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline"
            >
              Start fresh — clear everything on this device
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function getHeroStartLabel(
  draftSummary: ReturnType<typeof getOnboardingDraftSummary>,
): string {
  if (!draftSummary) return "Start Building";

  const name = draftSummary.name.trim() || "there";
  if (draftSummary.createAiUrl) {
    return `Hi, ${name} Continue Create with AI`;
  }
  if (draftSummary.editorUrl) {
    return `Hi, ${name} Resume Building`;
  }
  return `Hi, ${name} Continue Building`;
}
