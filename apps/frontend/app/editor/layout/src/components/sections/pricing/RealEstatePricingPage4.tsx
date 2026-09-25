"use client";

import type { ElementType } from "react";
import { Check, Crown, Diamond, Send, Star } from "lucide-react";
import { pricingPage4Content } from "../../../data/realEstatePage4Content";
import { getAccentStyle } from "../../../lib/accentStyle";
import type {
  PricingPage4Data,
  PricingPlan4,
} from "../../../types/realEstatePage4";
import type { SectionProps } from "../../../types/section";

const iconMap: Record<string, ElementType> = {
  Basic: Send,
  Standard: Star,
  Premium: Crown,
  Ultimate: Diamond,
};

function PricingCard({
  plan,
  buttonLabel,
}: {
  plan: PricingPlan4;
  buttonLabel: string;
}) {
  const Icon = iconMap[plan.name] ?? Star;

  return (
    <article className="group relative z-0 flex h-full flex-col rounded-2xl border-2 border-gray-100 bg-white shadow-sm transition-all duration-300 hover:z-10 hover:scale-105 hover:border-[var(--accent)] hover:shadow-xl">
      <div className="flex flex-1 flex-col p-8 text-center">
        <h4
          className="mb-2 text-[22px] font-bold text-[var(--accent)]"
          data-editor-field="name"
        >
          {plan.name}
        </h4>
        <p
          className="mb-8 text-sm text-gray-500"
          data-editor-field="description"
        >
          {plan.description}
        </p>

        <div className="mb-8 flex items-baseline justify-center gap-1">
          <span
            className="text-[44px] font-extrabold leading-none text-secondary"
            data-editor-field="price"
          >
            ${plan.price}
          </span>
          <span className="text-sm font-medium text-gray-500">
            / per listing
          </span>
        </div>

        <div className="mx-auto mb-10 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#f0f7f8] text-[var(--accent)] shadow-none transition-colors duration-300 group-hover:bg-[var(--accent)] group-hover:text-white group-hover:shadow-md">
          <Icon className="h-8 w-8" strokeWidth={1.5} />
        </div>

        <ul className="mb-8 space-y-4 text-left">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-3 text-[15px] font-medium text-secondary"
            >
              <Check
                className="h-5 w-5 flex-shrink-0 text-[var(--accent)]"
                strokeWidth={2.5}
              />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4">
          <button
            type="button"
            className="w-full rounded-md border border-[var(--accent)] bg-white py-3 text-sm font-bold tracking-wide text-[var(--accent)] transition-colors group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white hover:opacity-90"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function RealEstatePricingPage4({ data = {} }: SectionProps) {
  const authored = pricingPage4Content.RealEstatePricingPage4;
  const content: PricingPage4Data = {
    ...authored,
    ...(data as PricingPage4Data),
  };
  const plans = content.plans?.length ? content.plans : (authored.plans ?? []);
  const buttonLabel = content.buttonLabel ?? "CHOOSE PLAN";

  return (
    <section
      className="bg-white py-8 md:py-12"
      style={getAccentStyle(content.accentColor)}
      data-editor-section-label="pricing"
      data-editor-fields="accentColor pretitle title description buttonLabel plans"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h3
            className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--accent)]"
            data-editor-field="pretitle"
          >
            {content.pretitle ?? "Choose the Best Plan"}
          </h3>
          <h2
            className="mb-4 text-3xl font-bold text-secondary md:text-4xl"
            data-editor-field="title"
          >
            {content.title ?? "Find the Perfect Package for Your Property"}
          </h2>
          <p className="text-gray-600" data-editor-field="description">
            {content.description ?? ""}
          </p>
        </div>

        <div
          className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-2 xl:grid-cols-4 xl:gap-6"
          data-box-layout-grid="grid"
        >
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              buttonLabel={buttonLabel}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
