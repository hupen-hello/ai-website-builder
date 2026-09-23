import type { PlanCycle } from "@/lib/razorpayPlans";
import { formatInr, getRazorpayPlan } from "@/lib/razorpayPlans";
import {
  formatAddonBundleLabel,
  resolveAddonIds,
  sumAddonChargeAmount,
  sumAddonDisplayAmount,
  type PlanAddonId,
} from "@/lib/planAddons";

/**
 * INR charge for 1 year domain registration.
 * Aligned with Core pricing conversion used at Razorpay checkout.
 */
export const DOMAIN_YEARLY_CHARGE_INR = 1200;

export type DomainBundleOptions = {
  cycle?: PlanCycle;
  addonIds?: PlanAddonId[] | string[];
};

export function getDomainBundlePricing(options: DomainBundleOptions = {}) {
  const cycle: PlanCycle = options.cycle === "yearly" ? "yearly" : "monthly";
  const addonIds = resolveAddonIds(options.addonIds);
  const plan = getRazorpayPlan(cycle);
  const domainInr = DOMAIN_YEARLY_CHARGE_INR;
  const planInr = plan.chargeDisplayInr;
  const addonsInr = sumAddonDisplayAmount(addonIds, cycle);
  const addonsChargePaise = sumAddonChargeAmount(addonIds, cycle);
  const totalInr = domainInr + planInr + addonsInr;
  const planPeriodLabel = cycle === "yearly" ? "1 year" : "1 month";
  const planSuffix = cycle === "yearly" ? "/year" : "/month";
  const addonLabel = formatAddonBundleLabel(addonIds, cycle);

  return {
    cycle,
    addonIds,
    domainInr,
    planInr,
    addonsInr,
    totalInr,
    /** Razorpay amount in paise */
    chargeAmount: domainInr * 100 + plan.chargeAmount + addonsChargePaise,
    chargeCurrency: "INR" as const,
    domainLabel: `${formatInr(domainInr)}/year`,
    planLabel: `${formatInr(planInr)}${planSuffix}`,
    planPeriodLabel,
    addonsLabel: addonLabel
      ? `${addonLabel} (${formatInr(addonsInr)})`
      : "",
    resultPriceLabel: addonLabel
      ? `${formatInr(domainInr)}/year + Core ${formatInr(planInr)} (${planPeriodLabel}) + ${addonLabel}`
      : `${formatInr(domainInr)}/year + Core ${formatInr(planInr)} (${planPeriodLabel})`,
    breakdownLabel: addonLabel
      ? `Domain ${formatInr(domainInr)}/year + Core ${formatInr(planInr)}${planSuffix} + add-ons`
      : `Domain ${formatInr(domainInr)}/year + Core ${formatInr(planInr)}${planSuffix}`,
    checkoutLabel: `${formatInr(totalInr)} (domain + Core${addonIds.length ? " + add-ons" : ""})`,
    shortResultLabel: `${formatInr(domainInr)}/yr + Core ${planPeriodLabel}`,
    totalLabel: formatInr(totalInr),
  };
}
