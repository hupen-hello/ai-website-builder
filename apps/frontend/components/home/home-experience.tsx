"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MotionShell from "./motion-shell";
import HomeNav from "./home-nav";
import HeroSection from "./hero-section";
import DraftResumeModal from "./DraftResumeModal";
import BusinessOnboarding from "@/components/sections/businessonboarding";
import { FooterProvider } from "@/components/layout/footercontext";
import { UserAuthProvider } from "@/components/auth/UserAuthContext";
import { activateFlowPreviewStorage } from "@/lib/flowPreviewStorage";
import { getOnboardingDraftSummary } from "@/lib/onboardingDraft";
import { resetGuestWebsiteProgress } from "@/lib/userDraftReset";
import { clearUserActiveSiteId } from "@/lib/migrateGuestSite";
import { confirmStartFresh } from "@/lib/confirmDialog";

export default function HomeExperience() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingKey, setOnboardingKey] = useState(0);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
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

  const startBuilding = () => setShowOnboarding(true);

  const handleHeroStart = () => {
    if (draftSummary) {
      setDraftModalOpen(true);
      return;
    }
    startBuilding();
  };

  const resumeEditor = () => {
    if (!draftSummary?.editorUrl) return;
    if (draftSummary.createPath === "redesign") {
      activateFlowPreviewStorage("redesign");
    } else if (draftSummary.createPath === "create-custom") {
      activateFlowPreviewStorage("create-custom");
    }
    router.push(draftSummary.editorUrl);
  };

  const resumeSetup = () => {
    if (draftSummary?.createAiUrl) {
      setDraftModalOpen(false);
      router.push(draftSummary.createAiUrl);
      return;
    }
    if (
      draftSummary?.createPath === "create-custom" &&
      draftSummary.editorUrl &&
      !draftSummary.hasEditorEdits
    ) {
      setDraftModalOpen(false);
      router.push(draftSummary.editorUrl);
      return;
    }
    startBuilding();
  };

  const handleStartFresh = async () => {
    const ok = await confirmStartFresh();
    if (!ok) return;

    resetGuestWebsiteProgress();
    clearUserActiveSiteId();
    setDraftSummary(null);
    refreshDraftSummary();
    setDraftModalOpen(false);
    setOnboardingKey((key) => key + 1);
    setShowOnboarding(true);
  };

  return (
    <UserAuthProvider>
      <FooterProvider>
        {!showOnboarding ? (
          <MotionShell>
            <main className="overflow-clip bg-[#050b13] selection:bg-[#b9ff66] selection:text-[#07111e]">
              <HomeNav />
              <HeroSection
                onStart={handleHeroStart}
                draftSummary={draftSummary}
              />
              <DraftResumeModal
                open={draftModalOpen}
                draftSummary={draftSummary}
                onClose={() => setDraftModalOpen(false)}
                onContinueSetup={resumeSetup}
                onResumeEditor={resumeEditor}
                onStartFresh={handleStartFresh}
              />
              <HomeFooter onStart={handleHeroStart} draftSummary={draftSummary} />
            </main>
          </MotionShell>
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
      </FooterProvider>
    </UserAuthProvider>
  );
}

function HomeFooter({
  onStart,
  draftSummary,
}: {
  onStart: () => void;
  draftSummary: ReturnType<typeof getOnboardingDraftSummary>;
}) {
  return (
    <footer className="bg-gray-900 px-5 py-4 text-white sm:px-8">
      <div className="mx-auto max-w-[1320px]">
        <div className="hidden grid gap-12 border-b border-white/10 pb-14 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Image
              src="/lestow-logo.svg"
              alt="Lestow AI Website Builder"
              width={146}
              height={46}
              className="h-[46px] w-[146px] brightness-0 invert"
            />
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/42">
              The AI website builder that turns business context into strategy,
              design, copy, and a publish-ready website.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#b9ff66]"
            >
              {draftSummary ? "Continue building" : "Start building free"}{" "}
              <ArrowRight size={15} />
            </button>
          </div>
          <FooterColumn
            title="Product"
            links={[
              ["AI Website Builder", "/"],
              ["Templates", "/user/dashboard"],
            ]}
          />
          <FooterColumn
            title="Resources"
            links={[
              ["Help center", "/user/dashboard"],
              ["Contact support", "/user/billing"],
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              ["Pricing", "/user/plan"],
              ["About Lestow", "/"],
              ["Dashboard", "/user/dashboard"],
            ]}
          />
        </div>
        <div className="flex flex-col gap-4 text-xs text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright {new Date().getFullYear()} Lestow. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-white">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[.16em] text-white/75">
        {title}
      </h3>
      <ul className="mt-5 space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-white/38 transition hover:text-white"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
