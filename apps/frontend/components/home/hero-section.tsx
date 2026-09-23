import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import Button from "../ui/Button";
import type { getOnboardingDraftSummary } from "@/lib/onboardingDraft";
import { getHeroStartLabel } from "./DraftResumeModal";

type HeroSectionProps = {
  onStart: () => void;
  draftSummary?: ReturnType<typeof getOnboardingDraftSummary>;
};

const statuses = [
  {
    icon: LayoutDashboard,
    text: "Pages structured",
    className: "-left-4 top-[34%] lg:-left-28",
  },
  {
    icon: Sparkles,
    text: "Brand system applied",
    className: "-right-4 top-[24%] lg:-right-32",
  },
  {
    icon: Globe2,
    text: "Ready to publish",
    className: "right-[4%] bottom-[12%] lg:-right-24",
  },
];

export default function HeroSection({
  onStart,
  draftSummary = null,
}: HeroSectionProps) {
  return (
    <section
      data-hero-scroll
      className="relative h-[210vh] min-h-[1500px] bg-[#315ff4] text-white"
    >
      <div className="sticky top-0 h-screen min-h-[740px] overflow-hidden px-5 pt-[112px] sm:px-8 lg:pt-[116px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_46%,rgba(163,197,255,.64),transparent_30%),radial-gradient(circle_at_13%_78%,rgba(118,255,210,.53),transparent_24%),linear-gradient(120deg,#2855ed_0%,#3768ff_58%,#2d5df4_100%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.34)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.34)_1px,transparent_1px)] [background-size:clamp(74px,10.6vw,152px)_clamp(74px,10.6vw,152px)]" />
        <div className="absolute inset-0 bg-[linear-gradient(118deg,transparent_17%,rgba(255,255,255,.13)_31%,transparent_43%,rgba(255,255,255,.15)_61%,transparent_74%)]" />
        <div
          data-hero-glow
          className="absolute bottom-[-26%] left-1/2 h-[72%] w-[90%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse,rgba(177,255,210,.75),rgba(87,153,255,.3)_45%,transparent_70%)] blur-2xl"
        />

        <div
          data-hero-copy
          className="relative z-20 mx-auto max-w-[1180px] text-center"
        >
          <div data-hero-text>
            <h1 className="text-[clamp(3rem,6.5vw,6.2rem)] font-normal leading-[.92] tracking-[-.055em]">
              <span className="block overflow-hidden pb-2">
                <span data-hero-line className="block">
                  Build Your
                </span>
              </span>
              <span className="block overflow-hidden pb-3">
                <span data-hero-line className="block">
                  Website in{" "}
                  <span className="bg-lime-300 px-2 font-serif italic tracking-[-.065em] text-black sm:px-5">
                    <span>10 </span> Minutes
                  </span>
                </span>
              </span>
            </h1>
            <p
              data-hero-fade
              className="mx-auto mt-2 max-w-3xl text-base font-light tracking-[-.02em] text-white/80 sm:text-[18px] sm:leading-8"
            >
              Create a professional website in minutes with AI. Generate
              stunning layouts, engaging content, and customize every detail to
              match your brand.
            </p>
          </div>

          <Button
            type="button"
            onClick={onStart}
            variant="dark"
            className="group relative z-30 mx-auto mt-6 flex h-14 w-full max-w-[min(100%,420px)] items-center justify-center gap-3 bg-black px-4 text-base font-medium text-white opacity-100 shadow-[0_18px_40px_rgba(4,17,74,.28)] [clip-path:polygon(17px_0,100%_0,100%_100%,0_100%,0_17px)] transition duration-300 hover:-translate-y-1 hover:bg-black hover:shadow-[0_24px_50px_rgba(4,17,74,.38)]"
          >
            {getHeroStartLabel(draftSummary)}{" "}
            <ArrowRight
              size={19}
              className="transition group-hover:translate-x-1"
            />
          </Button>
        </div>

        <div className="absolute left-1/2 top-[430px] z-10 w-[min(88vw,1080px)] -translate-x-1/2 [perspective:1800px] sm:top-[420px]">
          <div
            data-hero-device
            className="relative origin-top [backface-visibility:hidden] [transform-style:preserve-3d]"
          >
            <div className="absolute -inset-16 rounded-[42%] bg-cyan-100/30 blur-[65px]" />
            <div className="absolute -inset-7 rounded-[2.6rem] border border-white/15" />
            <div className="absolute -inset-3 rounded-[2.25rem] border border-cyan-100/25" />
            <div className="relative overflow-hidden rounded-[1.4rem] border border-white/60 bg-[#07111e] p-2.5 shadow-[0_55px_120px_rgba(5,24,111,.6),0_0_0_1px_rgba(255,255,255,.12)] sm:rounded-[2rem] sm:p-4">
              <div
                data-dashboard-shine
                className="pointer-events-none absolute -left-1/2 top-0 z-20 h-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/18 to-transparent"
              />
              <div className="flex h-10 items-center justify-between px-2 text-white/45 sm:px-3">
                <div className="flex gap-1.5">
                  <span className="size-2 rounded-full bg-white/25" />
                  <span className="size-2 rounded-full bg-white/25" />
                  <span className="size-2 rounded-full bg-[#b9ff66]" />
                </div>
                <span className="text-[8px] font-semibold uppercase tracking-[.18em]">
                  Lestow command center
                </span>
                <span className="rounded-md bg-[#b9ff66] px-2.5 py-1 text-[8px] font-semibold text-[#07111e]">
                  Live
                </span>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-[.9rem] bg-white sm:rounded-[1.25rem]">
                <Image
                  src="/lestow-dashboard.png"
                  alt="Lestow AI website builder dashboard"
                  fill
                  priority
                  className="object-cover object-top"
                />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5" />
              </div>
            </div>

            <div
              data-dashboard-status
              className="absolute -top-[74px] left-1/2 hidden -translate-x-1/2 translate-y-10 scale-75 items-center gap-3 whitespace-nowrap rounded-full border border-white/20 bg-[#07111e]/85 px-5 py-3 text-xs font-medium text-white opacity-0 shadow-2xl backdrop-blur-xl sm:flex"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#b9ff66] opacity-70" />
                <span className="relative inline-flex size-2 rounded-full bg-[#b9ff66]" />
              </span>
              Your AI command center is ready
            </div>

            {statuses.map(({ icon: Icon, text, className }) => (
              <div
                data-dashboard-status
                key={text}
                className={`absolute ${className} hidden translate-y-10 scale-75 items-center gap-3 rounded-sm bg-black/75 px-5 py-3 text-sm font-medium text-white opacity-0 shadow-[0_20px_50px_rgba(4,18,77,.35)] backdrop-blur-md sm:flex`}
              >
                <Icon size={18} className="text-[#b9ff66]" />
                {text}
              </div>
            ))}
            <div
              data-dashboard-status
              className="absolute -bottom-6 left-[9%] hidden translate-y-10 scale-75 items-center gap-2 rounded-sm bg-black/70 px-4 py-3 text-xs text-white/85 opacity-0 backdrop-blur-md md:flex"
            >
              <CheckCircle2 size={17} className="text-[#b9ff66]" /> Website
              health: excellent
            </div>
          </div>
        </div>

        <div
          data-scroll-hint
          className="absolute inset-x-0 bottom-5 z-20 flex justify-center"
        >
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[9px] font-semibold uppercase tracking-[.18em] text-white/65 backdrop-blur-md">
            Scroll to open the dashboard
          </span>
        </div>
      </div>
    </section>
  );
}
