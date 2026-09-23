import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import { getDomainBundlePricing } from "@/lib/domainPricing";
import { resolveAddonIds, type PlanAddonId } from "@/lib/planAddons";
import type { PlanCycle } from "@/lib/razorpayPlans";
import { getRazorpayCredentials } from "@/lib/razorpayServer";

type VerifyPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  domain?: string;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
  cycle?: PlanCycle;
  addonIds?: PlanAddonId[] | string[];
};

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
) {
  const expected = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return false;
  }

  return true;
}

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
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  let body: VerifyPayload;
  try {
    body = (await request.json()) as VerifyPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  const domain = normalizeDomain(body.domain || "");
  const siteId = body.siteId?.trim();
  if (!domain || !siteId) {
    return NextResponse.json(
      { message: "Domain and website are required." },
      { status: 400 },
    );
  }

  const siteTitle = body.siteTitle?.trim() || undefined;
  const siteSlug = body.siteSlug?.trim() || undefined;
  const cycle: PlanCycle = body.cycle === "yearly" ? "yearly" : "monthly";
  const addonIds = resolveAddonIds(body.addonIds);
  const pricing = getDomainBundlePricing({ cycle, addonIds });
  const { keySecret, useMock } = getRazorpayCredentials();
  const planPeriod = cycle === "yearly" ? "1 year" : "1 month";

  if (useMock) {
    return NextResponse.json({
      ok: true,
      mock: true,
      domain,
      siteId,
      siteTitle,
      siteSlug,
      cycle,
      addonIds,
      includesPlan: true,
      price: pricing.resultPriceLabel,
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id || `pay_mock_${Date.now()}`,
      expiresAt: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      message: `Mock payment verified. Domain purchased and Core (${planPeriod}) activated${
        addonIds.length ? " with selected add-ons" : ""
      }.`,
    });
  }

  if (!keySecret) {
    return NextResponse.json(
      { message: "Razorpay secret is not configured on the server." },
      { status: 500 },
    );
  }

  const orderId = body.razorpay_order_id?.trim();
  const paymentId = body.razorpay_payment_id?.trim();
  const signature = body.razorpay_signature?.trim();

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { message: "Missing Razorpay payment verification fields." },
      { status: 400 },
    );
  }

  if (!verifySignature(orderId, paymentId, signature, keySecret)) {
    return NextResponse.json(
      { message: "Payment verification failed." },
      { status: 400 },
    );
  }

  // ResellerClub registerDomain will be wired here after payment.
  return NextResponse.json({
    ok: true,
    domain,
    siteId,
    siteTitle,
    siteSlug,
    cycle,
    addonIds,
    includesPlan: true,
    price: pricing.resultPriceLabel,
    orderId,
    paymentId,
    expiresAt: new Date(
      Date.now() + 365 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    message: `Payment verified. Domain purchase recorded and Core (${planPeriod}) activated${
      addonIds.length ? " with selected add-ons" : ""
    }.`,
  });
}
