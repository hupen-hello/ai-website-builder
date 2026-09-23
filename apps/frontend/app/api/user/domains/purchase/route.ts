import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import { getDomainBundlePricing } from "@/lib/domainPricing";
import { resolveAddonIds, type PlanAddonId } from "@/lib/planAddons";
import type { PlanCycle } from "@/lib/razorpayPlans";
import {
  ensureRazorpayCustomer,
  fetchAuthUser,
  getRazorpayCredentials,
  razorpayAuthHeader,
} from "@/lib/razorpayServer";

type PurchasePayload = {
  domain?: string;
  contact?: string;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
  cycle?: PlanCycle;
  addonIds?: PlanAddonId[] | string[];
};

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const user = await fetchAuthUser(token);
  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let body: PurchasePayload;
  try {
    body = (await request.json()) as PurchasePayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  const domain = normalizeDomain(body.domain || "");
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json(
      { message: "Enter a valid domain like example.com" },
      { status: 400 },
    );
  }

  const siteId = body.siteId?.trim();
  if (!siteId) {
    return NextResponse.json(
      { message: "Please select a website for this domain." },
      { status: 400 },
    );
  }

  const siteTitle = body.siteTitle?.trim() || undefined;
  const siteSlug = body.siteSlug?.trim() || undefined;
  const cycle: PlanCycle = body.cycle === "yearly" ? "yearly" : "monthly";
  const addonIds = resolveAddonIds(body.addonIds);
  const pricing = getDomainBundlePricing({ cycle, addonIds });
  const { keyId, keySecret, useMock } = getRazorpayCredentials();

  if (useMock) {
    return NextResponse.json({
      mock: true,
      keyId: keyId || "rzp_test_mock",
      orderId: `order_domain_mock_${Date.now()}`,
      customerId: `cust_mock_${user.id.slice(0, 8)}`,
      amount: pricing.chargeAmount,
      currency: pricing.chargeCurrency,
      domain,
      siteId,
      siteTitle,
      siteSlug,
      includesPlan: true,
      cycle,
      addonIds,
      breakdown: {
        domainInr: pricing.domainInr,
        planInr: pricing.planInr,
        addonsInr: pricing.addonsInr,
        totalInr: pricing.totalInr,
      },
      displayPrice: pricing.checkoutLabel,
    });
  }

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: "Razorpay credentials are not configured on the server." },
      { status: 500 },
    );
  }

  const receipt = `dom-${domain.slice(0, 12)}-${Date.now()}`.slice(0, 40);

  try {
    const customerId = await ensureRazorpayCustomer(
      keyId,
      keySecret,
      user,
      body.contact?.trim(),
    );
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: razorpayAuthHeader(keyId, keySecret),
      },
      body: JSON.stringify({
        amount: pricing.chargeAmount,
        currency: pricing.chargeCurrency,
        receipt,
        notes: {
          purpose:
            cycle === "yearly"
              ? "domain_purchase_with_core_year"
              : "domain_purchase_with_core_month",
          domain,
          siteId,
          siteTitle: siteTitle || "",
          siteSlug: siteSlug || "",
          cycle,
          addonIds: addonIds.join(","),
          domainInr: String(pricing.domainInr),
          planInr: String(pricing.planInr),
          addonsInr: String(pricing.addonsInr),
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
      const description =
        data.error?.description || "Unable to create domain payment order.";
      const message =
        description === "Authentication failed"
          ? "Razorpay authentication failed. Check RAZORPAY_KEY and RAZORPAY_SECRET, then restart the dev server."
          : description;
      return NextResponse.json({ message }, { status: 502 });
    }

    return NextResponse.json({
      keyId,
      customerId,
      orderId: data.id,
      amount: data.amount ?? pricing.chargeAmount,
      currency: data.currency ?? pricing.chargeCurrency,
      domain,
      siteId,
      siteTitle,
      siteSlug,
      includesPlan: true,
      cycle,
      addonIds,
      breakdown: {
        domainInr: pricing.domainInr,
        planInr: pricing.planInr,
        addonsInr: pricing.addonsInr,
        totalInr: pricing.totalInr,
      },
      displayPrice: pricing.checkoutLabel,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to start domain purchase.",
      },
      { status: 502 },
    );
  }
}
