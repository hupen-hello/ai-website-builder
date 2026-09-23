import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import { resolveAddonIds, type PlanAddonId } from "@/lib/planAddons";
import type { PlanCycle } from "@/lib/razorpayPlans";

type VerifyPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  cycle?: PlanCycle;
  switchToYearly?: boolean;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
  addonIds?: PlanAddonId[];
};

function getRazorpaySecret() {
  return process.env.RAZORPAY_SECRET?.trim() || "";
}

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

  const siteId = body.siteId?.trim();
  if (!siteId) {
    return NextResponse.json(
      { message: "Missing website for plan activation." },
      { status: 400 },
    );
  }

  const siteTitle = body.siteTitle?.trim() || undefined;
  const siteSlug = body.siteSlug?.trim() || undefined;
  const addonIds = resolveAddonIds(body.addonIds);

  const useMock = process.env.RAZORPAY_USE_MOCK === "true";
  const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
  const switched = body.switchToYearly === true;
  const addonNote =
    addonIds.length > 0 ? ` Add-ons activated: ${addonIds.length}.` : "";

  if (useMock) {
    return NextResponse.json({
      ok: true,
      mock: true,
      planId: "core",
      cycle,
      siteId,
      siteTitle,
      siteSlug,
      addonIds,
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id || `pay_mock_${Date.now()}`,
      message: switched
        ? `Mock payment verified. Switched to Core Yearly for this website.${addonNote}`
        : `Mock payment verified. Core plan activated for this website.${addonNote}`,
    });
  }

  const secret = getRazorpaySecret();
  if (!secret) {
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

  if (!verifySignature(orderId, paymentId, signature, secret)) {
    return NextResponse.json(
      { message: "Payment verification failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    planId: "core",
    cycle,
    siteId,
    siteTitle,
    siteSlug,
    addonIds,
    orderId,
    paymentId,
    message: switched
      ? `Payment verified. Switched to Core Yearly for this website.${addonNote}`
      : `Payment verified. Core plan activated for this website.${addonNote}`,
  });
}
