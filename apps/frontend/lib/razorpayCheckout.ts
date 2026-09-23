"use client";

export type RazorpayCheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type SavedPaymentMethod = {
  id: string;
  brand: string;
  ending: string;
  expires: string;
  role: "Default" | "Backup";
};

const SKIP_SAVED_CARD_PICKER_KEY = "css_razorpay_skip_saved_card_picker";

export function shouldSkipSavedCardPicker() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(SKIP_SAVED_CARD_PICKER_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSavedCardPickerUnavailable() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SKIP_SAVED_CARD_PICKER_KEY, "1");
  } catch {
    // Ignore storage errors in private browsing.
  }
}

type OpenRazorpayCheckoutInput = {
  keyId: string;
  orderId: string;
  amount: number;
  currency?: string;
  customerId?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  rememberCustomer?: boolean;
  method?: string;
  token?: string;
  /** When true, open card section for saved cards (needs customerId + contact). */
  preferSavedCards?: boolean;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export function waitForRazorpayScript(timeoutMs = 8000) {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.Razorpay) {
        window.clearInterval(timer);
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        window.clearInterval(timer);
        reject(new Error("Razorpay checkout is still loading. Please try again."));
      }
    }, 100);
  });
}

export async function fetchSavedPaymentMethods() {
  try {
    const res = await fetch("/api/user/payments/razorpay/tokens", {
      credentials: "include",
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as {
      methods?: SavedPaymentMethod[];
    };
    if (!res.ok) return [];
    return Array.isArray(data.methods) ? data.methods : [];
  } catch {
    return [];
  }
}

export async function fetchSavedCardCount() {
  const methods = await fetchSavedPaymentMethods();
  return methods.length;
}

function resolveCheckoutMethod(input: OpenRazorpayCheckoutInput) {
  if (input.method) return input.method;
  const canUseSavedCards =
    Boolean(input.customerId) &&
    Boolean(input.prefill?.email) &&
    Boolean(input.prefill?.contact);
  if (input.preferSavedCards !== false && canUseSavedCards) {
    return "card";
  }
  return undefined;
}

export function buildRazorpayCheckoutOptions(input: OpenRazorpayCheckoutInput) {
  const method = input.token ? "card" : resolveCheckoutMethod(input);
  return {
    key: input.keyId,
    amount: input.amount,
    currency: input.currency || "INR",
    name: input.name || "CSS Founder",
    description: input.description,
    order_id: input.orderId,
    customer_id: input.customerId,
    remember_customer: input.rememberCustomer ?? Boolean(input.customerId),
    method,
    token: input.token,
    notes: input.notes,
    prefill: input.prefill,
    readonly: input.prefill?.email
      ? { email: true, contact: Boolean(input.prefill.contact), name: false }
      : undefined,
    theme: { color: "#315ff4" },
  };
}

export async function openRazorpayCheckout(
  input: OpenRazorpayCheckoutInput,
): Promise<RazorpayCheckoutResponse> {
  await waitForRazorpayScript();

  const savedCount =
    input.preferSavedCards === false ? 0 : await fetchSavedCardCount();
  const options = buildRazorpayCheckoutOptions({
    ...input,
    preferSavedCards: savedCount > 0 || input.preferSavedCards,
  });

  return new Promise((resolve, reject) => {
    const razorpay = new window.Razorpay!({
      ...options,
      handler: (response: RazorpayCheckoutResponse) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });

    razorpay.on("payment.failed", () => {
      reject(new Error("Payment failed. Please try again."));
    });

    razorpay.open();
  });
}

export async function ensureRazorpayCustomerId() {
  const res = await fetch("/api/user/payments/razorpay/customer", {
    method: "POST",
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as {
    customerId?: string;
    message?: string;
  };
  if (!res.ok || !data.customerId) {
    throw new Error(data.message || "Unable to prepare Razorpay customer.");
  }
  return data.customerId;
}
