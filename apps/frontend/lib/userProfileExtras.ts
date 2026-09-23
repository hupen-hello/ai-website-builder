const EXTRA_STORAGE_KEY = "css-user-profile-extras";

type ProfileExtras = {
  phone?: string;
};

export function normalizeIndianPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits.length >= 10 ? digits.slice(-10) : "";
}

export function getStoredProfilePhone(userId?: string) {
  if (!userId || typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(`${EXTRA_STORAGE_KEY}:${userId}`);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as ProfileExtras;
    return normalizeIndianPhone(parsed.phone || "");
  } catch {
    return "";
  }
}

export function saveStoredProfilePhone(userId: string, phone: string) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const key = `${EXTRA_STORAGE_KEY}:${userId}`;
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...parsed, phone: normalizeIndianPhone(phone) || phone }),
    );
  } catch {
    // ignore
  }
}
