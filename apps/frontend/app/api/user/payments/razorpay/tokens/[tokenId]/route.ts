import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  ensureRazorpayCustomer,
  fetchAuthUser,
  fetchUserRazorpayMeta,
  getRazorpayCredentials,
  razorpayAuthHeader,
  unregisterUserRazorpayToken,
} from "@/lib/razorpayServer";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> },
) {
  const { tokenId } = await params;
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
    return NextResponse.json({ ok: true, mock: true });
  }

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: "Razorpay credentials are not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const meta = await fetchUserRazorpayMeta(token);
    if (!meta.tokenIds.includes(tokenId)) {
      return NextResponse.json(
        { message: "Saved card not found for this account." },
        { status: 404 },
      );
    }

    const customerId = await ensureRazorpayCustomer(
      keyId,
      keySecret,
      user,
      undefined,
      meta.customerId,
    );
    const response = await fetch(
      `https://api.razorpay.com/v1/customers/${customerId}/tokens/${tokenId}`,
      {
        method: "DELETE",
        headers: { Authorization: razorpayAuthHeader(keyId, keySecret) },
      },
    );

    // Always drop from this user's allowlist even if Razorpay already removed it.
    await unregisterUserRazorpayToken(token, tokenId);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: { description?: string };
      };
      // Still OK for UI if token was already gone on Razorpay.
      if (response.status !== 404) {
        return NextResponse.json(
          { message: data.error?.description || "Unable to remove saved card." },
          { status: response.status },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { message: "Unable to remove saved card." },
      { status: 500 },
    );
  }
}
