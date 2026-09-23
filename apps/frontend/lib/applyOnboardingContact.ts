import { readEditorScopedOnboardingDraft } from "@/lib/onboardingDraft";

type SectionLike = {
  type: string;
  variant: string;
  data: Record<string, Record<string, unknown>>;
};

type ContactFields = {
  email?: string;
  phone?: string;
  address?: string;
};

const CONTACT_SECTION_TYPES = new Set([
  "Topbar",
  "Footer",
  "Contact",
  "FormDetail",
]);

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function toCallLink(phone: string) {
  const digits = digitsOnly(phone);
  return digits ? `tel:${digits}` : "";
}

function toWhatsAppLink(phone: string) {
  let digits = digitsOnly(phone);
  if (!digits) return "";
  if (digits.length === 10) digits = `91${digits}`;
  return `https://api.whatsapp.com/send?phone=${digits}`;
}

function shouldWriteString(
  current: unknown,
  overwrite: boolean,
): boolean {
  if (overwrite) return true;
  return typeof current !== "string" || !current.trim();
}

function patchVariantContact(
  current: Record<string, unknown>,
  contact: ContactFields,
  overwrite: boolean,
): Record<string, unknown> {
  const email = contact.email?.trim() || "";
  const phone = contact.phone?.trim() || "";
  const address = contact.address?.trim() || "";
  if (!email && !phone && !address) return current;

  const next: Record<string, unknown> = { ...current };

  if (email && shouldWriteString(current.email, overwrite)) {
    next.email = email;
  }
  if (phone && shouldWriteString(current.phone, overwrite)) {
    next.phone = phone;
  }
  if (address) {
    if (shouldWriteString(current.location, overwrite)) {
      next.location = address;
    }
    if (shouldWriteString(current.address, overwrite)) {
      next.address = address;
    }
  }

  const existingContact =
    current.footerContact &&
    typeof current.footerContact === "object" &&
    !Array.isArray(current.footerContact)
      ? (current.footerContact as Record<string, unknown>)
      : {};
  const nextFooterContact = { ...existingContact };
  let footerTouched = false;

  if (email && shouldWriteString(existingContact.email, overwrite)) {
    nextFooterContact.email = email;
    footerTouched = true;
  }
  if (phone && shouldWriteString(existingContact.phone, overwrite)) {
    nextFooterContact.phone = phone;
    footerTouched = true;
  }
  if (address && shouldWriteString(existingContact.location, overwrite)) {
    nextFooterContact.location = address;
    footerTouched = true;
  }
  if (footerTouched) {
    next.footerContact = nextFooterContact;
  }

  if (phone) {
    const callLink = toCallLink(phone);
    const whatsappLink = toWhatsAppLink(phone);
    if (callLink && shouldWriteString(current.callLink, overwrite)) {
      next.callLink = callLink;
    }
    if (whatsappLink && shouldWriteString(current.whatsappLink, overwrite)) {
      next.whatsappLink = whatsappLink;
    }
  }

  return next;
}

/**
 * Stamp onboarding email / mobile / address onto Topbar, Footer, Contact,
 * and FormDetail variants (plus floating call/WhatsApp links on Footer).
 */
export function applyBrandContactToSections<T extends SectionLike>(
  sections: T[],
  options?: ContactFields & { overwrite?: boolean },
): T[] {
  const email = options?.email?.trim() || "";
  // Keep the user-entered number for display; links normalize digits separately.
  const phone = options?.phone?.trim() || "";
  const address = options?.address?.trim() || "";
  if (!email && !phone && !address) return sections;

  const overwrite = options?.overwrite !== false;
  const contact = { email, phone, address };

  return sections.map((section) => {
    if (!CONTACT_SECTION_TYPES.has(section.type)) return section;

    const nextData = Object.fromEntries(
      Object.entries(section.data || {}).map(([variant, variantData]) => [
        variant,
        patchVariantContact(
          (variantData || {}) as Record<string, unknown>,
          contact,
          overwrite,
        ),
      ]),
    );

    return {
      ...section,
      data: nextData,
    };
  });
}

/** Read onboarding draft contact fields and stamp them onto sections. */
export function applyOnboardingContactToSections<T extends SectionLike>(
  sections: T[],
  options?: { overwrite?: boolean },
): T[] {
  const draft = readEditorScopedOnboardingDraft();
  const info = draft?.businessInfo;
  if (!info) return sections;

  const email = typeof info.email === "string" ? info.email.trim() : "";
  const phone = typeof info.mobile === "string" ? info.mobile.trim() : "";
  const address = typeof info.address === "string" ? info.address.trim() : "";
  if (!email && !phone && !address) return sections;

  return applyBrandContactToSections(sections, {
    email,
    phone,
    address,
    overwrite: options?.overwrite,
  });
}
