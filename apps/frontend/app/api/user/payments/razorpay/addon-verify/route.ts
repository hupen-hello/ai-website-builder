import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  formatAddonBundleLabel,
  getPlanAddon,
  resolveAddonIds,
  type PlanAddonId,
} from "@/lib/planAddons";
import type { PlanCycle } from "@/lib/razorpayPlans";
import { getRazorpayCredentials } from "@/lib/razorpayServer";

type VerifyPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  addonId?: PlanAddonId;
  addonIds?: PlanAddonId[];
  cycle?: PlanCycle;
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

function resolveVerifyAddonIds(body: VerifyPayload) {
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

  let body: VerifyPayload;
  try {
    body = (await request.json()) as VerifyPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  const addonIds = resolveVerifyAddonIds(body);
  if (addonIds.length === 0) {
    return NextResponse.json({ message: "Unknown add-on." }, { status: 400 });
  }

  const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
  const { keySecret, useMock } = getRazorpayCredentials();
  const bundleLabel = formatAddonBundleLabel(addonIds, cycle);
  const message =
    addonIds.length === 1
      ? `${getPlanAddon(addonIds[0] || "")?.name || "Add-on"} activated.`
      : `${addonIds.length} add-ons activated: ${bundleLabel}.`;

  if (useMock) {
    return NextResponse.json({
      ok: true,
      mock: true,
      addonId: addonIds.length === 1 ? addonIds[0] : undefined,
      addonIds,
      cycle,
      paymentId: body.razorpay_payment_id || `pay_mock_${Date.now()}`,
      orderId: body.razorpay_order_id,
      message,
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

  return NextResponse.json({
    ok: true,
    addonId: addonIds.length === 1 ? addonIds[0] : undefined,
    addonIds,
    cycle,
    paymentId,
    orderId,
    message,
  });
}
