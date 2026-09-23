import { getBackendUrl } from "@/lib/backend";

export type RazorpayCredentials = {
  keyId: string;
  keySecret: string;
  useMock: boolean;
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export function getRazorpayCredentials(): RazorpayCredentials {
  const keyId = (
    process.env.RAZORPAY_KEY || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
  )?.trim() || "";
  const keySecret = process.env.RAZORPAY_SECRET?.trim() || "";
  const useMock = process.env.RAZORPAY_USE_MOCK === "true";
  return { keyId, keySecret, useMock };
}

export function razorpayAuthHeader(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export class RazorpayTokenChargeUnavailableError extends Error {
  constructor(message = "Saved card charging is not enabled on this Razorpay account.") {
    super(message);
    this.name = "RazorpayTokenChargeUnavailableError";
  }
}

export function isRazorpayTokenChargeUnavailableMessage(message?: string | null) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("requested url was not found") ||
    normalized.includes("saved card charging is not enabled")
  );
}

export async function fetchAuthUser(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/auth/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as AuthUser;
    if (!data?.id || !data.email) return null;
    return data;
  } catch {
    return null;
  }
}

function normalizeContact(contact?: string | null) {
  const digits = contact?.replace(/\D/g, "") || "";
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.length >= 10 ? digits.slice(-10) : "";
}

async function updateRazorpayCustomer(
  keyId: string,
  keySecret: string,
  customerId: string,
  user: AuthUser,
  contact?: string,
) {
  const payload: Record<string, string> = {
    name: user.name?.trim() || user.email,
    email: user.email,
  };
  if (contact) payload.contact = contact;

  await fetch(`https://api.razorpay.com/v1/customers/${customerId}`, {
    method: "PUT",
    headers: {
      Authorization: razorpayAuthHeader(keyId, keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function ensureRazorpayCustomer(
  keyId: string,
  keySecret: string,
  user: AuthUser,
  contact?: string,
  preferredCustomerId?: string | null,
) {
  const normalizedContact = normalizeContact(contact);
  const headers = {
    Authorization: razorpayAuthHeader(keyId, keySecret),
    "Content-Type": "application/json",
  };

  if (preferredCustomerId?.trim()) {
    const existingRes = await fetch(
      `https://api.razorpay.com/v1/customers/${preferredCustomerId.trim()}`,
      { headers: { Authorization: headers.Authorization }, cache: "no-store" },
    );
    if (existingRes.ok) {
      if (normalizedContact) {
        await updateRazorpayCustomer(
          keyId,
          keySecret,
          preferredCustomerId.trim(),
          user,
          normalizedContact,
        );
      }
      return preferredCustomerId.trim();
    }
  }

  const listRes = await fetch(
    `https://api.razorpay.com/v1/customers?email=${encodeURIComponent(user.email)}&count=100`,
    { headers: { Authorization: headers.Authorization }, cache: "no-store" },
  );
  const listData = (await listRes.json().catch(() => ({}))) as {
    items?: Array<{ id: string; notes?: Record<string, string> }>;
  };

  const owned = (listData.items || []).find(
    (item) =>
      item.notes?.userId === user.id || item.notes?.appUserId === user.id,
  );
  if (owned?.id) {
    if (normalizedContact) {
      await updateRazorpayCustomer(
        keyId,
        keySecret,
        owned.id,
        user,
        normalizedContact,
      );
    }
    return owned.id;
  }

  // Unique customer email so another account with the same real email
  // cannot inherit this user's saved cards.
  const local = user.email.split("@")[0] || "user";
  const domain = user.email.split("@")[1] || "example.com";
  const uniqueEmail =
    `${local}+cf${user.id.slice(0, 10)}@${domain}`.toLowerCase();

  const createRes = await fetch("https://api.razorpay.com/v1/customers", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: user.name?.trim() || user.email,
      email: uniqueEmail,
      ...(normalizedContact ? { contact: normalizedContact } : {}),
      notes: { userId: user.id, appUserId: user.id, realEmail: user.email },
    }),
  });
  const createData = (await createRes.json().catch(() => ({}))) as {
    id?: string;
    error?: { description?: string };
  };

  if (!createRes.ok || !createData.id) {
    const fallbackRes = await fetch("https://api.razorpay.com/v1/customers", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: user.name?.trim() || user.email,
        email: user.email,
        ...(normalizedContact ? { contact: normalizedContact } : {}),
        notes: { userId: user.id, appUserId: user.id },
      }),
    });
    const fallbackData = (await fallbackRes.json().catch(() => ({}))) as {
      id?: string;
      error?: { description?: string };
    };
    if (!fallbackRes.ok || !fallbackData.id) {
      throw new Error(
        createData.error?.description ||
          fallbackData.error?.description ||
          "Unable to create Razorpay customer.",
      );
    }
    return fallbackData.id;
  }

  return createData.id;
}

export async function listRazorpayCustomerTokens(
  keyId: string,
  keySecret: string,
  customerId: string,
) {
  const res = await fetch(
    `https://api.razorpay.com/v1/customers/${customerId}/tokens`,
    {
      headers: { Authorization: razorpayAuthHeader(keyId, keySecret) },
      cache: "no-store",
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    items?: Array<{
      id: string;
      method?: string;
      card?: {
        last4?: string;
        network?: string;
        expiry_month?: number;
        expiry_year?: number;
      };
    }>;
    error?: { description?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.description || "Unable to load saved cards.");
  }

  return data.items || [];
}

type TokenPaymentInput = {
  keyId: string;
  keySecret: string;
  orderId: string;
  customerId: string;
  tokenId: string;
  amount: number;
  currency: string;
  email: string;
  contact?: string;
  cvv?: string;
  description?: string;
  ip?: string;
  userAgent?: string;
};

export async function createRazorpayTokenPayment(input: TokenPaymentInput) {
  const payload: Record<string, unknown> = {
    amount: input.amount,
    currency: input.currency,
    order_id: input.orderId,
    email: input.email,
    contact: input.contact || undefined,
    method: "card",
    token: input.tokenId,
    customer_id: input.customerId,
    card: {
      cvv: input.cvv || "",
    },
    description: input.description || "CSS Founder payment",
    ip: input.ip || "127.0.0.1",
    user_agent: input.userAgent || "CSS Founder Web",
  };

  const res = await fetch("https://api.razorpay.com/v1/payments/create/json", {
    method: "POST",
    headers: {
      Authorization: razorpayAuthHeader(input.keyId, input.keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => ({}))) as {
    razorpay_payment_id?: string;
    id?: string;
    status?: string;
    error?: { description?: string; reason?: string };
    next?: Array<{ action?: string; url?: string }>;
  };

  if (!res.ok) {
    const description = data.error?.description || data.error?.reason;
    if (isRazorpayTokenChargeUnavailableMessage(description)) {
      throw new RazorpayTokenChargeUnavailableError();
    }
    throw new Error(description || "Unable to charge saved card.");
  }

  const paymentId = data.razorpay_payment_id || data.id;
  const authUrl = data.next?.find((step) => step.action === "redirect")?.url;

  return {
    paymentId,
    status: data.status,
    authUrl,
  };
}

export async function fetchRazorpayPayment(
  keyId: string,
  keySecret: string,
  paymentId: string,
) {
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: razorpayAuthHeader(keyId, keySecret) },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    status?: string;
    order_id?: string;
    token_id?: string;
    customer_id?: string;
    error?: { description?: string };
  };

  if (!res.ok) {
    throw new Error(data.error?.description || "Unable to fetch payment status.");
  }

  return data;
}

export async function fetchUserRazorpayMeta(userToken: string) {
  const res = await fetch(`${getBackendUrl()}/user-state/razorpay`, {
    headers: { Authorization: `Bearer ${userToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    return { customerId: null as string | null, tokenIds: [] as string[] };
  }
  const data = (await res.json().catch(() => ({}))) as {
    customerId?: string | null;
    tokenIds?: string[];
  };
  return {
    customerId: data.customerId || null,
    tokenIds: Array.isArray(data.tokenIds)
      ? data.tokenIds.filter((id) => typeof id === "string" && id.trim())
      : [],
  };
}

export async function saveUserRazorpayCustomerId(
  userToken: string,
  customerId: string,
) {
  await fetch(`${getBackendUrl()}/user-state/razorpay/customer`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ customerId }),
  }).catch(() => undefined);
}

export async function registerUserRazorpayToken(
  userToken: string,
  tokenId: string,
  customerId?: string | null,
) {
  await fetch(`${getBackendUrl()}/user-state/razorpay/tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tokenId, customerId }),
  }).catch(() => undefined);
}

export async function unregisterUserRazorpayToken(
  userToken: string,
  tokenId: string,
) {
  await fetch(
    `${getBackendUrl()}/user-state/razorpay/tokens/${encodeURIComponent(tokenId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    },
  ).catch(() => undefined);
}
