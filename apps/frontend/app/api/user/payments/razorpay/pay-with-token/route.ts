import { createHmac } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import type { PlanCycle } from "@/lib/razorpayPlans";
import {
  createRazorpayTokenPayment,
  ensureRazorpayCustomer,
  fetchAuthUser,
  fetchRazorpayPayment,
  getRazorpayCredentials,
  RazorpayTokenChargeUnavailableError,
  razorpayAuthHeader,
} from "@/lib/razorpayServer";

type PayWithTokenPayload = {
  orderId?: string;
  tokenId?: string;
  customerId?: string;
  cvv?: string;
  cycle?: PlanCycle;
  switchToYearly?: boolean;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
  contact?: string;
};

function createPaymentSignature(
  orderId: string,
  paymentId: string,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
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

  let body: PayWithTokenPayload;
  try {
    body = (await request.json()) as PayWithTokenPayload;
  } catch {
    return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  const tokenId = body.tokenId?.trim();
  const customerId = body.customerId?.trim();
  const siteId = body.siteId?.trim();
  const cycle = body.cycle === "yearly" ? "yearly" : "monthly";
  const switched = body.switchToYearly === true;

  if (!orderId || !tokenId || !customerId || !siteId) {
    return NextResponse.json(
      { message: "Missing saved card payment details." },
      { status: 400 },
    );
  }

  const siteTitle = body.siteTitle?.trim() || undefined;
  const siteSlug = body.siteSlug?.trim() || undefined;
  const { keyId, keySecret, useMock } = getRazorpayCredentials();

  if (useMock) {
    const mockPaymentId = `pay_mock_${Date.now()}`;
    return NextResponse.json({
      ok: true,
      mock: true,
      paymentId: mockPaymentId,
      orderId,
      signature: "mock_signature",
      planId: "core",
      cycle,
      siteId,
      siteTitle,
      siteSlug,
      message: switched
        ? "Mock payment verified. Switched to Core Yearly for this website."
        : "Mock payment verified. Core plan activated for this website.",
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
    await ensureRazorpayCustomer(keyId, keySecret, user, contact);

    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      headers: { Authorization: razorpayAuthHeader(keyId, keySecret) },
      cache: "no-store",
    });
    const orderData = (await orderRes.json().catch(() => ({}))) as {
      amount?: number;
      currency?: string;
      error?: { description?: string };
    };

    if (!orderRes.ok || !orderData.amount || !orderData.currency) {
      return NextResponse.json(
        {
          message: orderData.error?.description || "Unable to load payment order.",
        },
        { status: 502 },
      );
    }

    const payment = await createRazorpayTokenPayment({
      keyId,
      keySecret,
      orderId,
      customerId,
      tokenId,
      amount: orderData.amount,
      currency: orderData.currency,
      email: user.email,
      contact,
      cvv: body.cvv?.trim(),
      description: `Core ${cycle} plan payment`,
      ip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1",
      userAgent: request.headers.get("user-agent") || "CSS Founder Web",
    });

    if (payment.authUrl) {
      return NextResponse.json({
        ok: false,
        requiresAuth: true,
        authUrl: payment.authUrl,
        paymentId: payment.paymentId,
        message: "Complete OTP verification to finish payment.",
      });
    }

    if (!payment.paymentId) {
      return NextResponse.json(
        { message: "Saved card payment did not return a payment id." },
        { status: 502 },
      );
    }

    const paymentDetails = await fetchRazorpayPayment(
      keyId,
      keySecret,
      payment.paymentId,
    );
    const status = paymentDetails.status || payment.status;

    if (status !== "captured" && status !== "authorized") {
      return NextResponse.json(
        {
          message:
            status === "failed"
              ? "Saved card payment failed. Try another method."
              : "Payment is pending. Please try again in a moment.",
        },
        { status: 402 },
      );
    }

    if (paymentDetails.order_id && paymentDetails.order_id !== orderId) {
      return NextResponse.json(
        { message: "Payment order mismatch." },
        { status: 400 },
      );
    }

    const signature = createPaymentSignature(
      orderId,
      payment.paymentId,
      keySecret,
    );

    return NextResponse.json({
      ok: true,
      paymentId: payment.paymentId,
      orderId,
      signature,
      planId: "core",
      cycle,
      siteId,
      siteTitle,
      siteSlug,
      message: switched
        ? "Payment verified. Switched to Core Yearly for this website."
        : "Payment verified. Core plan activated for this website.",
    });
  } catch (error) {
    if (error instanceof RazorpayTokenChargeUnavailableError) {
      return NextResponse.json(
        {
          ok: false,
          fallbackToCheckout: true,
          message:
            "Saved card quick pay is not enabled on your Razorpay account. Use Razorpay checkout instead.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to charge saved card.",
      },
      { status: 502 },
    );
  }
}
