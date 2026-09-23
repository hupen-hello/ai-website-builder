import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  ensureRazorpayCustomer,
  fetchAuthUser,
  fetchUserRazorpayMeta,
  getRazorpayCredentials,
  listRazorpayCustomerTokens,
  saveUserRazorpayCustomerId,
} from "@/lib/razorpayServer";

export async function GET() {
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
    return NextResponse.json({ methods: [], customerId: null, mock: true });
  }

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: "Razorpay credentials are not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const meta = await fetchUserRazorpayMeta(token);
    // Only cards this app-user explicitly saved. Shared Razorpay email
    // customers must not leak another account's tokens.
    if (meta.tokenIds.length === 0) {
      return NextResponse.json({
        methods: [],
        customerId: meta.customerId,
      });
    }

    const customerId = await ensureRazorpayCustomer(
      keyId,
      keySecret,
      user,
      undefined,
      meta.customerId,
    );
    if (customerId !== meta.customerId) {
      await saveUserRazorpayCustomerId(token, customerId);
    }

    const allowed = new Set(meta.tokenIds);
    const tokens = await listRazorpayCustomerTokens(
      keyId,
      keySecret,
      customerId,
    );

    const methods = tokens
      .filter(
        (item) =>
          item.method === "card" &&
          item.card?.last4 &&
          allowed.has(item.id),
      )
      .map((item, index) => ({
        id: item.id,
        brand: item.card?.network || "Card",
        mark: (item.card?.network || "Card").slice(0, 5),
        ending: item.card?.last4 || "0000",
        role: index === 0 ? ("Default" as const) : ("Backup" as const),
        expires: item.card?.expiry_month
          ? `${String(item.card.expiry_month).padStart(2, "0")}/${String(item.card.expiry_year || "").slice(-2)}`
          : "—",
        holder: user.name?.trim() || user.email,
        source: "razorpay" as const,
      }));

    return NextResponse.json({ methods, customerId });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load saved payment methods.",
      },
      { status: 502 },
    );
  }
}
