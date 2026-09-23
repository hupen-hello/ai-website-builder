export type PlanCycle = "monthly" | "yearly";

export const RAZORPAY_PLANS = {
  monthly: {
    planId: "core-monthly",
    name: "Core Monthly",
    /** Main card price shown in UI (INR). */
    displayAmount: 900,
    displaySuffix: "/month",
    chargeAmount: 90000,
    chargeCurrency: "INR",
    chargeDisplayInr: 900,
    note: "Billed monthly. Cancel anytime.",
  },
  yearly: {
    planId: "core-yearly",
    name: "Core Yearly",
    /** Monthly equivalent shown on the card (INR). */
    displayAmount: 700,
    displaySuffix: "/month",
    billed: "₹8,400 billed yearly",
    chargeAmount: 840000,
    chargeCurrency: "INR",
    chargeDisplayInr: 8400,
    note: "Save 22% with annual billing.",
  },
} as const;

export function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatPlanChargeInr(cycle: PlanCycle) {
  return formatInr(RAZORPAY_PLANS[cycle].chargeDisplayInr);
}

export function formatPlanDisplayPrice(cycle: PlanCycle) {
  const plan = RAZORPAY_PLANS[cycle];
  return `${formatInr(plan.displayAmount)}${plan.displaySuffix}`;
}

export function getRazorpayPlan(cycle: PlanCycle) {
  return RAZORPAY_PLANS[cycle];
}
