import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { USER_TOKEN_COOKIE } from "@/lib/backend";
import {
  getExportPackage,
  isExportFormat,
  type ExportFormat,
} from "@/lib/exportPricing";
import {
  ensureRazorpayCustomer,
  fetchAuthUser,
  getRazorpayCredentials,
  razorpayAuthHeader,
} from "@/lib/razorpayServer";

type OrderPayload = {
  format?: string;
  siteId?: string;
  siteTitle?: string;
  siteSlug?: string;
  contact?: string;
};

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(USER_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const user = await fetchAuthUser(token);
  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  let body: OrderPayload;
  try {
    body = (await request.json()) as OrderPayload;
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
      { message: "Website is required for export purchase." },
      { status: 400 },
    );
  }

  const siteTitle = body.siteTitle?.trim() || undefined;
  const siteSlug = body.siteSlug?.trim() || undefined;
  const pricing = getExportPackage(format);
  const { keyId, keySecret, useMock } = getRazorpayCredentials();

  if (useMock) {
    return NextResponse.json({
      mock: true,
      keyId: keyId || "rzp_test_mock",
      orderId: `order_export_mock_${Date.now()}`,
      customerId: `cust_mock_${user.id.slice(0, 8)}`,
      amount: pricing.chargeAmount,
      currency: pricing.chargeCurrency,
      format,
      siteId,
      siteTitle,
      siteSlug,
      priceInr: pricing.priceInr,
      displayPrice: `₹${pricing.priceInr.toLocaleString("en-IN")}`,
    });
  }

  if (!keyId || !keySecret) {
    return NextResponse.json(
      { message: "Razorpay credentials are not configured on the server." },
      { status: 500 },
    );
  }

  const receipt = `exp-${format.slice(0, 4)}-${Date.now()}`.slice(0, 40);

  try {
    const customerId = await ensureRazorpayCustomer(
      keyId,
      keySecret,
      user,
      body.contact?.trim(),
    );
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: razorpayAuthHeader(keyId, keySecret),
      },
      body: JSON.stringify({
        amount: pricing.chargeAmount,
        currency: pricing.chargeCurrency,
        receipt,
        notes: {
          purpose: "website_export",
          format,
          siteId,
          siteTitle: siteTitle || "",
          siteSlug: siteSlug || "",
          priceInr: String(pricing.priceInr),
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
      const description =
        data.error?.description || "Unable to create export payment order.";
      const message =
        description === "Authentication failed"
          ? "Razorpay authentication failed. Check RAZORPAY_KEY and RAZORPAY_SECRET, then restart the dev server."
          : description;
      return NextResponse.json({ message }, { status: 502 });
    }

    return NextResponse.json({
      keyId,
      customerId,
      orderId: data.id,
      amount: data.amount ?? pricing.chargeAmount,
      currency: data.currency ?? pricing.chargeCurrency,
      format,
      siteId,
      siteTitle,
      siteSlug,
      priceInr: pricing.priceInr,
      displayPrice: `₹${pricing.priceInr.toLocaleString("en-IN")}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to start export purchase.",
      },
      { status: 502 },
    );
  }
}
