/**
 * Create-with-AI chat credits: 10 free, then buy packs.
 * Wallet is account-scoped in localStorage (synced key per user / guest).
 */

export const CREATE_AI_FREE_CHAT_CREDITS = 10;

export type CreateAiChatCreditPackId = "pack-20" | "pack-50" | "pack-100";

export type CreateAiChatCreditPack = {
  id: CreateAiChatCreditPackId;
  credits: number;
  priceInr: number;
  /** Razorpay paise */
  chargeAmount: number;
  label: string;
};

export const CREATE_AI_CHAT_CREDIT_PACKS: CreateAiChatCreditPack[] = [
  {
    id: "pack-20",
    credits: 20,
    priceInr: 99,
    chargeAmount: 9900,
    label: "20 chat credits",
  },
  {
    id: "pack-50",
    credits: 50,
    priceInr: 199,
    chargeAmount: 19900,
    label: "50 chat credits",
  },
  {
    id: "pack-100",
    credits: 100,
    priceInr: 399,
    chargeAmount: 39900,
    label: "100 chat credits",
  },
];

export type CreateAiChatCreditWallet = {
  freeUsed: number;
  purchasedRemaining: number;
  /** Credits spent from purchased packs */
  purchasedUsed: number;
  updatedAt: string;
};

export function getCreateAiChatCreditPack(
  id: string,
): CreateAiChatCreditPack | null {
  return CREATE_AI_CHAT_CREDIT_PACKS.find((p) => p.id === id) || null;
}

function storageKey(userKey: string) {
  const safe = (userKey || "guest").trim() || "guest";
  return `lestow-create-ai-chat-credits:v1:${safe}`;
}

function emptyWallet(): CreateAiChatCreditWallet {
  return {
    freeUsed: 0,
    purchasedRemaining: 0,
    purchasedUsed: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function readCreateAiChatCreditWallet(
  userKey: string,
): CreateAiChatCreditWallet {
  if (typeof window === "undefined") return emptyWallet();
  try {
    const raw = window.localStorage.getItem(storageKey(userKey));
    if (!raw) return emptyWallet();
    const parsed = JSON.parse(raw) as Partial<CreateAiChatCreditWallet>;
    const freeUsed = Math.max(0, Math.floor(Number(parsed.freeUsed) || 0));
    const purchasedRemaining = Math.max(
      0,
      Math.floor(Number(parsed.purchasedRemaining) || 0),
    );
    const purchasedUsed = Math.max(
      0,
      Math.floor(Number(parsed.purchasedUsed) || 0),
    );
    return {
      freeUsed,
      purchasedRemaining,
      purchasedUsed,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return emptyWallet();
  }
}

export function writeCreateAiChatCreditWallet(
  userKey: string,
  wallet: CreateAiChatCreditWallet,
) {
  if (typeof window === "undefined") return;
  const next: CreateAiChatCreditWallet = {
    freeUsed: Math.max(0, Math.floor(wallet.freeUsed || 0)),
    purchasedRemaining: Math.max(0, Math.floor(wallet.purchasedRemaining || 0)),
    purchasedUsed: Math.max(0, Math.floor(wallet.purchasedUsed || 0)),
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(storageKey(userKey), JSON.stringify(next));
  window.dispatchEvent(new Event("storage"));
}

export function getCreateAiChatCreditBalance(userKey: string) {
  const w = readCreateAiChatCreditWallet(userKey);
  const freeLeft = Math.max(0, CREATE_AI_FREE_CHAT_CREDITS - w.freeUsed);
  const used = w.freeUsed + w.purchasedUsed;
  return {
    freeLeft,
    purchasedRemaining: w.purchasedRemaining,
    total: freeLeft + w.purchasedRemaining,
    used,
    freeUsed: w.freeUsed,
    purchasedUsed: w.purchasedUsed,
    freeCap: CREATE_AI_FREE_CHAT_CREDITS,
  };
}

/** Spend 1 credit: free first, then purchased. Returns which pool was used. */
export function consumeCreateAiChatCredit(
  userKey: string,
): "free" | "purchased" | false {
  const w = readCreateAiChatCreditWallet(userKey);
  if (w.freeUsed < CREATE_AI_FREE_CHAT_CREDITS) {
    writeCreateAiChatCreditWallet(userKey, {
      ...w,
      freeUsed: w.freeUsed + 1,
    });
    return "free";
  }
  if (w.purchasedRemaining > 0) {
    writeCreateAiChatCreditWallet(userKey, {
      ...w,
      purchasedRemaining: w.purchasedRemaining - 1,
      purchasedUsed: w.purchasedUsed + 1,
    });
    return "purchased";
  }
  return false;
}

/** Undo / failed apply — put 1 credit back. */
export function refundCreateAiChatCredit(
  userKey: string,
  source: "free" | "purchased" = "free",
): boolean {
  const w = readCreateAiChatCreditWallet(userKey);
  if (source === "purchased" && w.purchasedUsed > 0) {
    writeCreateAiChatCreditWallet(userKey, {
      ...w,
      purchasedUsed: w.purchasedUsed - 1,
      purchasedRemaining: w.purchasedRemaining + 1,
    });
    return true;
  }
  if (w.freeUsed > 0) {
    writeCreateAiChatCreditWallet(userKey, {
      ...w,
      freeUsed: w.freeUsed - 1,
    });
    return true;
  }
  if (w.purchasedUsed > 0) {
    writeCreateAiChatCreditWallet(userKey, {
      ...w,
      purchasedUsed: w.purchasedUsed - 1,
      purchasedRemaining: w.purchasedRemaining + 1,
    });
    return true;
  }
  return false;
}

export function addPurchasedCreateAiChatCredits(
  userKey: string,
  credits: number,
) {
  const n = Math.max(0, Math.floor(credits || 0));
  if (!n) return;
  const w = readCreateAiChatCreditWallet(userKey);
  writeCreateAiChatCreditWallet(userKey, {
    ...w,
    purchasedRemaining: w.purchasedRemaining + n,
  });
}

export type CreateAiChatCreditPurchase = {
  id: string;
  packId: CreateAiChatCreditPackId;
  credits: number;
  amountInr: number;
  paymentId: string;
  orderId: string;
  purchasedAt: string;
};

function purchasesStorageKey(userKey: string) {
  const safe = (userKey || "guest").trim() || "guest";
  return `lestow-create-ai-chat-credit-purchases:v1:${safe}`;
}

export function listCreateAiChatCreditPurchases(
  userKey: string,
): CreateAiChatCreditPurchase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(purchasesStorageKey(userKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const packId = String(row.packId || "");
        const pack = getCreateAiChatCreditPack(packId);
        if (!pack) return null;
        const credits = Math.max(0, Math.floor(Number(row.credits) || pack.credits));
        const amountInr = Math.max(
          0,
          Math.floor(Number(row.amountInr) || pack.priceInr),
        );
        const paymentId = String(row.paymentId || "").trim();
        const orderId = String(row.orderId || "").trim();
        const purchasedAt =
          typeof row.purchasedAt === "string"
            ? row.purchasedAt
            : new Date().toISOString();
        const id =
          typeof row.id === "string" && row.id.trim()
            ? row.id.trim()
            : `CAI-${(orderId || paymentId || purchasedAt).slice(0, 12)}`;
        return {
          id,
          packId: pack.id,
          credits,
          amountInr,
          paymentId,
          orderId,
          purchasedAt,
        } satisfies CreateAiChatCreditPurchase;
      })
      .filter((item): item is CreateAiChatCreditPurchase => Boolean(item))
      .sort(
        (a, b) =>
          new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
      );
  } catch {
    return [];
  }
}

/** Persist purchase for Billing invoices + add credits to wallet. */
export function recordCreateAiChatCreditPurchase(
  userKey: string,
  input: {
    packId: CreateAiChatCreditPackId | string;
    credits: number;
    amountInr: number;
    paymentId: string;
    orderId: string;
  },
) {
  const pack = getCreateAiChatCreditPack(String(input.packId || ""));
  if (!pack) return;
  const credits = Math.max(0, Math.floor(input.credits || pack.credits));
  addPurchasedCreateAiChatCredits(userKey, credits);

  const purchase: CreateAiChatCreditPurchase = {
    id: `CAI-${(input.orderId || input.paymentId || Date.now().toString()).slice(0, 14)}`,
    packId: pack.id,
    credits,
    amountInr: Math.max(0, Math.floor(input.amountInr || pack.priceInr)),
    paymentId: String(input.paymentId || "").trim(),
    orderId: String(input.orderId || "").trim(),
    purchasedAt: new Date().toISOString(),
  };

  if (typeof window === "undefined") return;
  const withoutDup = listCreateAiChatCreditPurchases(userKey).filter((item) => {
    if (purchase.orderId && item.orderId === purchase.orderId) return false;
    if (purchase.paymentId && item.paymentId === purchase.paymentId) return false;
    return true;
  });
  const next = [purchase, ...withoutDup].slice(0, 100);
  window.localStorage.setItem(
    purchasesStorageKey(userKey),
    JSON.stringify(next),
  );
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("css-ai-plan-updated"));
}
