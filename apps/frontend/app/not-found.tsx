import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Home, LayoutDashboard, SearchX } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you requested could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="relative grid h-dvh min-h-[560px] grid-rows-[auto_1fr] overflow-hidden bg-[#070912] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px)",
          backgroundSize: "54px 54px",
          maskImage: "linear-gradient(to bottom, black, transparent 85%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-red-700/30 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-64 right-[-8rem] h-[38rem] w-[38rem] rounded-full bg-blue-700/25 blur-[120px]"
      />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="CSS Founder homepage"
          className="flex h-14 w-[150px] items-center justify-center overflow-hidden rounded-2xl bg-white px-3 shadow-[0_12px_40px_rgba(0,0,0,.24)] transition-transform hover:scale-[1.02]"
        >
          <Image
            src="/logo.png"
            alt="CSS Founder"
            width={140}
            height={56}
            className="h-auto w-full"
            priority
          />
        </Link>

        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300 backdrop-blur-xl sm:text-xs">
          <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_16px_rgba(239,68,68,.9)]" />
          Page unavailable
        </span>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-8 px-5 pb-8 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-10">
        <div className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-red-300">
            Error 404
          </span>

          <div className="relative mt-3 inline-flex items-center">
            <span className="bg-gradient-to-b from-white via-white to-slate-600 bg-clip-text text-[clamp(9rem,17vw,15rem)] font-black leading-[0.82] tracking-[-0.08em] text-transparent drop-shadow-[0_30px_45px_rgba(0,0,0,.35)]">
              404
            </span>
            <span className="absolute -right-5 top-1/2 flex h-20 w-20 -translate-y-1/2 items-center justify-center rounded-[1.6rem] border border-white/15 bg-gradient-to-br from-red-500 to-red-700 shadow-[0_18px_50px_rgba(220,38,38,.35)]">
              <SearchX size={36} strokeWidth={1.8} />
            </span>
          </div>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
            We checked every corner, but this address does not lead to a live
            page right now.
          </p>
        </div>

        <div className="mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.10] to-white/[0.04] p-1 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-[#101522]/90 px-6 py-8 sm:px-9 sm:py-10">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 h-36 w-36 rounded-full border-[24px] border-white/[0.025]"
            />

            <div className="mb-5 flex items-center justify-between lg:hidden">
              <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
                Error 404
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                <SearchX size={22} />
              </span>
            </div>

            <p className="hidden text-7xl font-black leading-none tracking-[-0.06em] text-white/10 max-lg:block">
              404
            </p>
            <h1 className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-4xl">
              This page took a
              <span className="text-red-500"> wrong turn.</span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">
              The link may be incorrect, moved, or no longer available. Head
              home to continue building your website.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-[0_14px_35px_rgba(220,38,38,.28)] transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Home size={17} />
                Go to homepage
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/user/dashboard"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <LayoutDashboard size={17} />
                Dashboard
              </Link>
            </div>

            <div className="mt-7 border-t border-white/10 pt-5 text-xs leading-5 text-slate-500">
              Check the URL for a typo, or use one of the safe routes above.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
