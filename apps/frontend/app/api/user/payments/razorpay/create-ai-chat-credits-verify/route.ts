import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  getCreateAiChatCreditPack,
} from "@/lib/create-ai-chat-credits";
import { getRazorpayCredentials } from "@/lib/razorpayServer";

type VerifyPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  packId?: string;
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

  const pack = getCreateAiChatCreditPack(String(body.packId || ""));
  if (!pack) {
    return NextResponse.json(
      { message: "Invalid credit pack." },
      { status: 400 },
    );
  }

  const orderId = String(body.razorpay_order_id || "").trim();
  const paymentId = String(body.razorpay_payment_id || "").trim();
  const signature = String(body.razorpay_signature || "").trim();
  if (!orderId || !paymentId) {
    return NextResponse.json(
      { message: "Payment details missing." },
      { status: 400 },
    );
  }

  const { keySecret, useMock } = getRazorpayCredentials();

  if (useMock || orderId.includes("_mock_")) {
    return NextResponse.json({
      ok: true,
      packId: pack.id,
      credits: pack.credits,
      paymentId,
      orderId,
    });
  }

  if (!keySecret || !signature) {
    return NextResponse.json(
      { message: "Unable to verify payment." },
      { status: 400 },
    );
  }

  if (!verifySignature(orderId, paymentId, signature, keySecret)) {
    return NextResponse.json(
      { message: "Payment signature invalid." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    packId: pack.id,
    credits: pack.credits,
    paymentId,
    orderId,
  });
}
