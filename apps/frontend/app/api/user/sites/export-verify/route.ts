import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  EXPORT_MAX_DOWNLOADS,
  getExportPackage,
  isExportFormat,
  type ExportFormat,
} from "@/lib/exportPricing";
import { getRazorpayCredentials } from "@/lib/razorpayServer";

type VerifyPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  format?: string;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
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

  if (!isExportFormat(body.format)) {
    return NextResponse.json(
      { message: "Choose HTML or Next.js export." },
      { status: 400 },
    );
  }

  const format: ExportFormat = body.format;
  const siteId = body.siteId?.trim();
  if (!siteId) {
    return NextResponse.json(
      { message: "Website is required." },
      { status: 400 },
    );
  }

  const siteTitle = body.siteTitle?.trim() || undefined;
  const siteSlug = body.siteSlug?.trim() || undefined;
  const pricing = getExportPackage(format);
  const { keySecret, useMock } = getRazorpayCredentials();

  if (useMock) {
    return NextResponse.json({
      ok: true,
      mock: true,
      format,
      siteId,
      siteTitle,
      siteSlug,
      amountInr: pricing.priceInr,
      downloadsRemaining: EXPORT_MAX_DOWNLOADS,
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id || `pay_mock_${Date.now()}`,
      message: `Mock payment verified. You can download this ${format === "html" ? "HTML" : "Next.js"} export up to ${EXPORT_MAX_DOWNLOADS} times.`,
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
    format,
    siteId,
    siteTitle,
    siteSlug,
    amountInr: pricing.priceInr,
    downloadsRemaining: EXPORT_MAX_DOWNLOADS,
    orderId,
    paymentId,
    message: `Payment verified. You can download this ${format === "html" ? "HTML" : "Next.js"} export up to ${EXPORT_MAX_DOWNLOADS} times.`,
  });
}
