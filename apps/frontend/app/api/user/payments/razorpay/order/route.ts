import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  formatAddonBundleLabel,
  resolveAddonIds,
  sumAddonChargeAmount,
  sumAddonDisplayAmount,
  type PlanAddonId,
} from "@/lib/planAddons";
import {
  formatInr,
  formatPlanDisplayPrice,
  getRazorpayPlan,
  type PlanCycle,
} from "@/lib/razorpayPlans";
import {
  ensureRazorpayCustomer,
  fetchAuthUser,
  getRazorpayCredentials,
  listRazorpayCustomerTokens,
  razorpayAuthHeader,
} from "@/lib/razorpayServer";

type OrderPayload = {
  cycle?: PlanCycle;
  switchToYearly?: boolean;
  contact?: string;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
  addonIds?: PlanAddonId[];
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  const user = await fetchAuthUser(token);
  if (!user) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  let body: OrderPayload;
  try {
    body = (await request.json()) as OrderPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
  const siteId = body.siteId?.trim();
  if (!siteId) {
    return NextResponse.json(
      { message: "Select a website to upgrade before starting payment." },
      { status: 400 },
    );
  }

  const siteTitle = body.siteTitle?.trim() || undefined;
  const siteSlug = body.siteSlug?.trim() || undefined;
  const addonIds = resolveAddonIds(body.addonIds);
  const plan = getRazorpayPlan(cycle);
  const addonCharge = sumAddonChargeAmount(addonIds, cycle);
  const addonDisplay = sumAddonDisplayAmount(addonIds, cycle);
  const totalCharge = plan.chargeAmount + addonCharge;
  const totalDisplay = plan.chargeDisplayInr + addonDisplay;
  const addonLabel = formatAddonBundleLabel(addonIds, cycle);
  const displayPrice =
    addonIds.length > 0
      ? `${formatInr(totalDisplay)}${cycle === "yearly" ? " / year" : " / month"}`
      : formatPlanDisplayPrice(cycle);

  const { keyId, keySecret, useMock } = getRazorpayCredentials();

  if (useMock) {
    return NextResponse.json({
      mock: true,
      keyId: keyId || "rzp_test_mock",
      orderId: `order_mock_${Date.now()}`,
      customerId: `cust_mock_${user.id.slice(0, 8)}`,
      amount: totalCharge,
      currency: plan.chargeCurrency,
      planName: plan.name,
      cycle,
      siteId,
      siteTitle,
      siteSlug,
      addonIds,
      addonLabel,
      displayPrice,
    });
  }

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: "Razorpay credentials are not configured on the server." },
      { status: 500 },
    );
  }

  const shortSite = siteId.slice(0, 12);
  const receipt = `core-${cycle}-${shortSite}-${Date.now()}`.slice(0, 40);

  try {
    const contact = body.contact?.trim();
    const customerId = await ensureRazorpayCustomer(
      keyId,
      keySecret,
      user,
      contact,
    );
    let savedCardCount = 0;
    try {
      const tokens = await listRazorpayCustomerTokens(
        keyId,
        keySecret,
        customerId,
      );
      savedCardCount = tokens.length;
    } catch {
      savedCardCount = 0;
    }
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: razorpayAuthHeader(keyId, keySecret),
      },
      body: JSON.stringify({
        amount: totalCharge,
        currency: plan.chargeCurrency,
        receipt,
        notes: {
          planId: plan.planId,
          cycle,
          siteId,
          siteTitle: siteTitle || "",
          siteSlug: siteSlug || "",
          addonIds: addonIds.join(","),
        },
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      amount?: number;
      currency?: string;
      error?: { description?: string };
    };

    if (!response.ok || !data.id) {
      const description = data.error?.description || "Unable to create Razorpay order.";
      const message =
        description === "Authentication failed"
          ? "Razorpay authentication failed. Check RAZORPAY_KEY and RAZORPAY_SECRET in apps/frontend/.env.local, then restart the dev server."
          : description;

      return NextResponse.json({ message }, { status: 502 });
    }

    return NextResponse.json({
      keyId,
      customerId,
      orderId: data.id,
      amount: data.amount ?? totalCharge,
      currency: data.currency ?? plan.chargeCurrency,
      planName: plan.name,
      cycle,
      siteId,
      siteTitle,
      siteSlug,
      addonIds,
      addonLabel,
      displayPrice,
      savedCardCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create Razorpay order.",
      },
      { status: 502 },
    );
  }
}
