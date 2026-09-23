import { normalizeIndianPhone } from "@/lib/userProfileExtras";

type PrefillUser = {
  id?: string;
  name?: string | null;
  email?: string;
  phone?: string | null;
};

export function buildRazorpayPrefill(user: PrefillUser) {
  const contact = normalizeIndianPhone(user.phone || "");
  return {
    name: user.name?.trim() || "Customer",
    email: user.email || "",
    ...(contact ? { contact: contact.length === 10 ? `+91${contact}` : contact } : {}),
  };
}
