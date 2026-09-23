import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  fetchRazorpayPayment,
  getRazorpayCredentials,
  listRazorpayCustomerTokens,
  registerUserRazorpayToken,
} from "@/lib/razorpayServer";

type VerifyPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
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

  const { keyId, keySecret, useMock } = getRazorpayCredentials();
  if (useMock) {
    return NextResponse.json({
      ok: true,
      mock: true,
      message: "Card saved successfully.",
    });
  }

  if (!keyId || !keySecret) {
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

  try {
    const payment = await fetchRazorpayPayment(keyId, keySecret, paymentId);
    let tokenId = payment.token_id || "";
    const customerId = payment.customer_id || "";

    // Some save-card flows attach the token shortly after capture.
    if (!tokenId && customerId) {
      const tokens = await listRazorpayCustomerTokens(
        keyId,
        keySecret,
        customerId,
      );
      tokenId = tokens[tokens.length - 1]?.id || "";
    }

    if (tokenId) {
      await registerUserRazorpayToken(token, tokenId, customerId || null);
    }

    return NextResponse.json({
      ok: true,
      tokenId: tokenId || null,
      message: "Card saved successfully. It will appear in checkout next time.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Card verification failed.",
      },
      { status: 502 },
    );
  }
}
