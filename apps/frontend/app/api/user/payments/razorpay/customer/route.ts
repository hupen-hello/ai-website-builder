import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  ensureRazorpayCustomer,
  fetchAuthUser,
  getRazorpayCredentials,
} from "@/lib/razorpayServer";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  const user = await fetchAuthUser(token);
  if (!user) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  const { keyId, keySecret, useMock } = getRazorpayCredentials();
  if (useMock) {
    return NextResponse.json({
      customerId: `cust_mock_${user.id.slice(0, 8)}`,
      mock: true,
      keyId: keyId || "rzp_test_mock",
    });
  }

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: "Razorpay credentials are not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const customerId = await ensureRazorpayCustomer(keyId, keySecret, user);
    return NextResponse.json({ customerId, keyId });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to prepare Razorpay customer.",
      },
      { status: 502 },
    );
  }
}
