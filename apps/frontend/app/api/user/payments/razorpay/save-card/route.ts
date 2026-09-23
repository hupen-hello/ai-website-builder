import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  ensureRazorpayCustomer,
  fetchAuthUser,
  fetchUserRazorpayMeta,
  getRazorpayCredentials,
  razorpayAuthHeader,
  saveUserRazorpayCustomerId,
} from "@/lib/razorpayServer";

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

  let contact: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as {
      contact?: string;
    };
    contact = body.contact?.trim();
  } catch {
    contact = undefined;
  }

  const { keyId, keySecret, useMock } = getRazorpayCredentials();
  if (useMock) {
    return NextResponse.json({
      mock: true,
      keyId: keyId || "rzp_test_mock",
      orderId: `order_save_mock_${Date.now()}`,
      customerId: `cust_mock_${user.id.slice(0, 8)}`,
      amount: 100,
      currency: "INR",
    });
  }

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: "Razorpay credentials are not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const meta = await fetchUserRazorpayMeta(token);
    const customerId = await ensureRazorpayCustomer(
      keyId,
      keySecret,
      user,
      contact,
      meta.customerId,
    );
    if (customerId !== meta.customerId) {
      await saveUserRazorpayCustomerId(token, customerId);
    }
    const receipt = `save-card-${Date.now()}`.slice(0, 40);

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: razorpayAuthHeader(keyId, keySecret),
      },
      body: JSON.stringify({
        amount: 100,
        currency: "INR",
        receipt,
        notes: {
          purpose: "save_card",
          userId: user.id,
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
          message:
            data.error?.description || "Unable to start card save checkout.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      keyId,
      orderId: data.id,
      customerId,
      amount: data.amount ?? 100,
      currency: data.currency ?? "INR",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to start card save checkout.",
      },
      { status: 502 },
    );
  }
}
