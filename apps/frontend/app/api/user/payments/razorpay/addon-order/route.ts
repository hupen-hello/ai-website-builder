import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  formatAddonBundleLabel,
  formatAddonPrice,
  getAddonPrice,
  getPlanAddon,
  resolveAddonIds,
  sumAddonChargeAmount,
  sumAddonDisplayAmount,
  type PlanAddonId,
} from "@/lib/planAddons";
import { formatInr, type PlanCycle } from "@/lib/razorpayPlans";
import {
  ensureRazorpayCustomer,
  fetchAuthUser,
  getRazorpayCredentials,
  razorpayAuthHeader,
} from "@/lib/razorpayServer";

type AddonOrderPayload = {
  addonId?: PlanAddonId;
  addonIds?: PlanAddonId[];
  cycle?: PlanCycle;
  contact?: string;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
};

function resolveOrderAddonIds(body: AddonOrderPayload) {
  if (body.addonId) {
    return resolveAddonIds([body.addonId]);
  }
  return resolveAddonIds(body.addonIds);
}

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

  let body: AddonOrderPayload;
  try {
    body = (await request.json()) as AddonOrderPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  const addonIds = resolveOrderAddonIds(body);
  if (addonIds.length === 0) {
    return NextResponse.json({ message: "Select at least one add-on." }, { status: 400 });
  }

  const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
  const totalCharge = sumAddonChargeAmount(addonIds, cycle);
  const totalDisplay = sumAddonDisplayAmount(addonIds, cycle);
  const addonLabel = formatAddonBundleLabel(addonIds, cycle);
  const displayPrice = `${formatInr(totalDisplay)}${cycle === "yearly" ? " / year" : " / month"}`;
  const primaryAddon = getPlanAddon(addonIds[0] || "");
  const { keyId, keySecret, useMock } = getRazorpayCredentials();

  if (useMock) {
    return NextResponse.json({
      mock: true,
      keyId: keyId || "rzp_test_mock",
      orderId: `order_addon_mock_${Date.now()}`,
      customerId: `cust_mock_${user.id.slice(0, 8)}`,
      amount: totalCharge,
      currency: "INR",
      addonId: addonIds.length === 1 ? addonIds[0] : undefined,
      addonIds,
      addonName: addonLabel || primaryAddon?.name,
      cycle,
      displayPrice,
    });
  }

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: "Razorpay credentials are not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const contact = body.contact?.trim();
    const customerId = await ensureRazorpayCustomer(
      keyId,
      keySecret,
      user,
      contact,
    );
    const receipt = body.siteId
      ? `addon-${body.siteId.slice(0, 8)}-${Date.now()}`.slice(0, 40)
      : `addon-${addonIds[0]}-${Date.now()}`.slice(0, 40);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: razorpayAuthHeader(keyId, keySecret),
      },
      body: JSON.stringify({
        amount: totalCharge,
        currency: "INR",
        receipt,
        notes: {
          purpose: "plan_addon",
          addonId: addonIds.length === 1 ? addonIds[0] : undefined,
          addonIds: addonIds.join(","),
          cycle,
          userId: user.id,
          siteId: body.siteId?.trim() || undefined,
          siteTitle: body.siteTitle?.trim() || undefined,
          siteSlug: body.siteSlug?.trim() || undefined,
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
      return NextResponse.json(
        {
          message: data.error?.description || "Unable to create add-on order.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      keyId,
      customerId,
      orderId: data.id,
      amount: data.amount ?? totalCharge,
      currency: data.currency ?? "INR",
      addonId: addonIds.length === 1 ? addonIds[0] : undefined,
      addonIds,
      addonName: addonLabel || primaryAddon?.name,
      cycle,
      displayPrice,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create add-on order.",
      },
      { status: 502 },
    );
  }
}
