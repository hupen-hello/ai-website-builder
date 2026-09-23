import {
  ArrowRight,
  Check,
  Crown,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const starterFeatures = [
  "Unlimited paid hosting sites",
  "2 staging websites",
  "2 pages per staged site",
  "50 CMS items per staged site",
  "1 full collaborator seat",
  "Agency and freelancer guests",
];

const coreFeatures = [
  "Everything included in Starter",
  "10 staging websites",
  "300 pages per staged site",
  "Unlimited AI section generation",
  "Custom code on staged sites",
  "Code components and export",
  "Priority support",
  "1 shared design library",
];

export default function PlansTab() {
  return (
    <section className="relative min-h-full overflow-hidden px-4 py-7 sm:px-6 sm:py-9 lg:px-9">
      <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-28 size-80 rounded-full bg-emerald-100/50 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1080px]">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-blue-700 shadow-sm backdrop-blur">
            <Sparkles size={12} /> Simple pricing
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-.025em] text-zinc-950 sm:text-4xl">
            Start free. Upgrade when you&apos;re ready.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-500">
            One free plan for getting started and one powerful upgrade for
            growing your websites.
          </p>
        </div>

        <div className="mt-9 grid items-stretch gap-5 px-[50px] md:grid-cols-2">
          <article className="relative flex min-h-[560px] flex-col rounded-[30px] border border-zinc-200 bg-white/92 p-6 shadow-[0_18px_50px_rgba(24,39,75,.08)] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
                <Zap size={19} />
              </span>
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-700">
                Current plan
              </span>
            </div>

            <h3 className="mt-6 text-xl font-semibold text-zinc-950">
              Starter
            </h3>
            <div className="mt-3 flex items-end gap-1">
              <strong className="text-5xl tracking-[-.065em] text-zinc-950">
                $0
              </strong>
              <span className="pb-1.5 text-xs text-zinc-500">/month</span>
            </div>
            <p className="mt-4 min-h-[48px] text-xs leading-5 text-zinc-500">
              All the essentials you need to create and publish your first
              website.
            </p>

            <button
              type="button"
              disabled
              className="mt-5 h-11 cursor-default rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-400"
            >
              Your current plan
            </button>

            <div className="my-6 h-px bg-zinc-200" />
            <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-400">
              Starter includes
            </p>
            <ul className="mt-4 space-y-3.5">
              {starterFeatures.map((feature) => (
                <PlanFeature key={feature}>{feature}</PlanFeature>
              ))}
            </ul>
          </article>

          <article className="relative flex min-h-[560px] flex-col overflow-hidden rounded-[30px] border border-blue-500 bg-[linear-gradient(150deg,#edf4ff_0%,#ffffff_48%,#edfff8_100%)] p-6 shadow-[0_24px_65px_rgba(49,95,244,.18)] sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-blue-300/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 size-48 rounded-full bg-emerald-200/35 blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <Crown size={19} />
              </span>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-[9px] font-semibold uppercase tracking-wider text-white shadow-lg shadow-blue-200">
                Best value
              </span>
            </div>

            <div className="relative">
              <h3 className="mt-6 text-xl font-semibold text-zinc-950">Core</h3>
              <div className="mt-3 flex items-end gap-1">
                <strong className="text-5xl tracking-[-.065em] text-zinc-950">
                  $9
                </strong>
                <span className="pb-1.5 text-xs text-zinc-500">/month</span>
              </div>
              <p className="mt-4 min-h-[48px] text-xs leading-5 text-zinc-500">
                More pages, AI generation, and professional tools for growing
                websites.
              </p>

              <button
                type="button"
                className="group mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(120deg,#315ff4,#6b4ff8_56%,#20c997)] text-xs font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Upgrade to Core <ArrowRight size={14} />
              </button>

              <div className="my-6 h-px bg-blue-100" />
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-blue-600">
                Core includes
              </p>
              <ul className="mt-4 space-y-3.5">
                {coreFeatures.map((feature) => (
                  <PlanFeature key={feature}>{feature}</PlanFeature>
                ))}
              </ul>
            </div>
          </article>
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck size={17} />
            </span>
            <div>
              <p className="text-xs font-medium text-zinc-800">
                No hidden fees or long-term contracts
              </p>
              <p className="mt-1 text-[10px] text-zinc-500">
                Upgrade or return to Starter whenever you need.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-medium text-emerald-700">
            SSL, CDN, and backups included
          </span>
        </div>
      </div>
    </section>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-[13px] leading-4 text-zinc-600">
      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
        <Check size={9} strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}
