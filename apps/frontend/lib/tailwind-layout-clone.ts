/**
 * Layout-only redesign helpers: Tailwind HTML from reference STRUCTURE,
 * filled ONLY with domain brand/copy/media (or free stock). Never ships
 * reference HTML/CSS/assets (legal-safe).
 */

import type {
  BuiltSiteSectionItem,
  BuiltSiteSectionPlan,
  BuiltSiteTheme,
} from "@/lib/built-site-theme";
import { buildPremiumAgencyHomepage } from "@/lib/premium-agency-homepage";
import { wireSinglePageSections } from "@/lib/redesign-single-page";

function hostnameOf(url: string) {
  try {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/** Drop any media URL that belongs to the reference host. */
export function filterDomainOnlyMedia(
  urls: string[],
  referenceUrl: string,
  domainUrl: string,
): string[] {
  const refHost = hostnameOf(referenceUrl);
  const domainHost = hostnameOf(domainUrl);
  return (urls || []).filter((url) => {
    if (!url || !/^https?:\/\//i.test(url)) return false;
    const host = hostnameOf(url);
    if (!host) return false;
    if (refHost && host === refHost) return false;
    if (refHost && host.endsWith(`.${refHost}`)) return false;
    // Keep domain CDN + stock (pixabay/pexels/unsplash/wix customer etc.)
    if (domainHost && host === domainHost) return true;
    if (
      /pixabay|pexels|unsplash|cloudinary|shopify|googleusercontent|fbcdn|twimg/i.test(
        host,
      )
    ) {
      return true;
    }
    // Allow other CDNs unless clearly the reference brand site
    return host !== refHost;
  });
}

/** Drop mega-menu concat, hours, emails, and other non-nav chrome from labels. */
export function cleanDomainNavLabels(labels: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const junkSolo =
    /^(overview|target aim|our future plan|gallery photos|photos|videos|enquire|career|join us|submit|read more)$/i;

  for (const raw of labels || []) {
    let t = String(raw || "").replace(/\s+/g, " ").trim();
    if (!t) continue;

    // Split glued WordPress mega labels once (never recurse — avoids stack overflow).
    if (
      t.split(/\s+/).length >= 2 &&
      /\b(OVERVIEW|TARGET AIM|OUR FUTURE PLAN|Gallery Photos|Our Services|Contact Us)\b/i.test(t)
    ) {
      const parts = t
        .split(
          /\s(?=(?:OVERVIEW|TARGET AIM|OUR FUTURE PLAN|Our Services|Gallery|Photos|Videos|Contact Us|About Us|Testimonials|Career|Join Us)\b)/i,
        )
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        for (const part of parts) {
          if (junkSolo.test(part) || part.length > 40) continue;
          if (part.length < 2) continue;
          if (/@|\+?\d[\d\s().-]{7,}\d/i.test(part)) continue;
          const key = part.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(part);
          if (out.length >= 12) break;
        }
        continue;
      }
    }

    if (junkSolo.test(t)) continue;
    if (t.length > 40) t = t.slice(0, 40).trim();
    if (t.length < 2 || t.length > 40) continue;
    if (/@|\+?\d[\d\s().-]{7,}\d|mailto:|tel:/i.test(t)) continue;
    if (
      /^(mon|tue|wed|thu|fri|sat|sun)\b|opening hours|write to us|copyright|designed by|css founder|vedanta|erp login/i.test(
        t,
      )
    ) {
      continue;
    }
    if (/^(home|logo|header|footer|banner|submit|read more|apply online)$/i.test(t)) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 12) break;
  }
  if (out.length >= 3) return out.slice(0, 10);
  return ["About Us", "Academics", "Facilities", "Gallery", "Admissions", "Contact"].slice(0, 6);
}

function isUsableContactAddress(text: string) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (t.length < 12 || t.length > 160) return false;
  if (/^about\s*us\b/i.test(t)) return false;
  if (/president|formed the|memorial society|helping hand|union minister/i.test(t)) {
    return false;
  }
  return /\d{6}\b|street|road|sector|nagar|colony|village|district|pin|plot|floor|building|\bindia\b/i.test(
    t,
  );
}

export function sanitizeThemeDomainOnly(theme: BuiltSiteTheme): BuiltSiteTheme {
  const images = filterDomainOnlyMedia(
    [
      ...(theme.contentImages || []),
      theme.heroImage || "",
      theme.logoImage || "",
    ].filter(Boolean),
    theme.referenceUrl || "",
    theme.domainUrl || "",
  );
  const logo = (theme.logoImage || "").trim();
  const logoOk =
    logo &&
    filterDomainOnlyMedia([logo], theme.referenceUrl || "", theme.domainUrl || "")
      .length > 0;

  const menuSource =
    (theme.referenceNavItems || []).length >= 4
      ? theme.referenceNavItems || []
      : theme.navItems || [];
  const navItems = cleanDomainNavLabels(menuSource);
  const categories = cleanDomainNavLabels(
    (theme.referenceNavItems || []).length >= 4
      ? theme.referenceNavItems || []
      : (theme.categories || []).length
        ? theme.categories || []
        : navItems,
  );
  const address = isUsableContactAddress(theme.contactAddress || "")
    ? (theme.contactAddress || "").replace(/\s+/g, " ").trim()
    : "";
  const bg = (theme.backgroundColor || "").trim();
  const bgOk = /^#([0-9a-f]{6})$/i.test(bg) && !/^#(ffffff|fff)$/i.test(bg);

  return {
    ...theme,
    logoImage: logoOk ? logo : "",
    heroImage: images[0] || "",
    contentImages: images.filter((u) => u !== logo).slice(0, 12),
    navItems,
    categories,
    contactAddress: address,
    backgroundColor: bgOk ? bg : "#ffffff",
  };
}

/** Remove reference phones/emails/whatsapp/hosts that leaked into HTML. */
export function stripReferenceLeaksFromHtml(
  html: string,
  theme: BuiltSiteTheme,
): string {
  const refHost = hostnameOf(theme.referenceUrl || "");
  const refName = (theme.referenceSiteName || "").trim();
  const brand = theme.brandName || "Brand";
  let out = html || "";

  const leakPhrases: string[] = [];
  const addLeak = (value: string) => {
    const t = String(value || "").replace(/\s+/g, " ").trim();
    if (t.length >= 3 && t.toLowerCase() !== brand.toLowerCase()) leakPhrases.push(t);
  };
  if (refName) {
    addLeak(refName);
    const stripped = refName
      .replace(
        /\b(public\s+school|school|foundation|society|trust|welfare|association|organisation|organization|ngo|inc|ltd|llc|pvt\.?|private|limited|company)\b/gi,
        "",
      )
      .replace(/\s+/g, " ")
      .trim();
    addLeak(stripped);
    const words = refName.split(/\s+/).filter(Boolean);
    if (words.length >= 3) addLeak(words.slice(0, 3).join(" "));
    if (words.length >= 2) addLeak(words.slice(0, 2).join(" "));
  }
  if (refHost) {
    addLeak(refHost);
    addLeak(`www.${refHost}`);
    const slug = refHost.split(".")[0] || "";
    if (slug.length >= 3) {
      addLeak(slug);
      const parts = slug.match(
        /^([a-z0-9]+?)(publicschool|public-school|school|academy|college|university|foundation|trust)$/i,
      );
      if (parts?.[1] && parts[1].length >= 4) {
        addLeak(parts[1]);
        addLeak(parts[2]);
      }
      if (/jamdagni/i.test(slug)) {
        addLeak("JPS");
        addLeak("@JPS");
        addLeak("Welcome to JPS");
        addLeak("Campus Life @JPS");
      }
    }
  }

  for (const leak of [...new Set(leakPhrases)].sort((a, b) => b.length - a.length)) {
    const re = new RegExp(leak.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    // Never rewrite inside absolute URLs (clone CSS/JS hosts must survive).
    const saved: string[] = [];
    out = out.replace(/https?:\/\/[^\s"'<>)\\]+/gi, (u) => {
      saved.push(u);
      return `%%LESTOWURL${saved.length - 1}%%`;
    });
    out = out.replace(re, brand);
    for (let i = saved.length - 1; i >= 0; i -= 1) {
      out = out.split(`%%LESTOWURL${i}%%`).join(saved[i]);
    }
  }

  // Neutralize reference PAGE links only — never touch CSS/JS/font asset URLs
  if (refHost) {
    const refRe = new RegExp(
      `https?:\\/\\/(?:www\\.)?${refHost.replace(/\./g, "\\.")}[^"'\\s<>]*`,
      "gi",
    );
    out = out.replace(/<a\b([^>]*)\bhref=(["'])([^"']+)\2/gi, (full, attrs, q, href) => {
      if (!refRe.test(href)) return full;
      refRe.lastIndex = 0;
      return `<a${attrs}href=${q}#${q}`;
    });
    out = out.replace(
      /<(?:iframe|form)\b([^>]*)\b(?:src|action)=(["'])([^"']+)\2/gi,
      (full, attrs, q, href) => {
        if (!refRe.test(href)) return full;
        refRe.lastIndex = 0;
        const attr = /\bsrc=/i.test(full) ? "src" : "action";
        return full.replace(
          new RegExp(`\\b${attr}=(["'])[^"']*\\1`, "i"),
          `${attr}=${q}#${q}`,
        );
      },
    );
  }

  // Generic registration / payment chrome that often leaks from NGO reference sites
  out = out.replace(/\bCIN:\s*[A-Z0-9]+\b/gi, "");
  out = out.replace(/\bNGO\s+Darpan:\s*[\w/]+\b/gi, "");
  out = out.replace(/\bCSR:\s*CSR\d+\b/gi, "");
  out = out.replace(/\bPAN:\s*[A-Z0-9]+\b/gi, "");

  // Kill WhatsApp / tel / mailto that aren't the domain contact
  const phone = (theme.contactPhone || "").replace(/\D/g, "");
  const email = (theme.contactEmail || "").toLowerCase();

  out = out.replace(/href=["']https?:\/\/(?:api\.)?whatsapp\.com\/[^"']+["']/gi, 'href="#"');
  out = out.replace(/href=["']https?:\/\/wa\.me\/[^"']+["']/gi, 'href="#"');

  out = out.replace(/href=["']tel:([^"']+)["']/gi, (_m, raw) => {
    const digits = String(raw).replace(/\D/g, "");
    if (phone && digits.includes(phone.slice(-8))) return `href="tel:${theme.contactPhone}"`;
    if (phone) return `href="tel:${theme.contactPhone}"`;
    return 'href="#"';
  });

  out = out.replace(/href=["']mailto:([^"']+)["']/gi, (_m, raw) => {
    const m = String(raw).toLowerCase();
    if (email && m.includes(email)) return `href="mailto:${theme.contactEmail}"`;
    if (email) return `href="mailto:${theme.contactEmail}"`;
    return 'href="#"';
  });

  return out;
}

/**
 * Fast legal-safe redesign: Tailwind sections inspired by reference plan order,
 * content 100% domain (+ stock images already resolved on theme).
 */
export function buildTailwindLayoutClone(
  theme: BuiltSiteTheme,
  vision = "",
  imageUrls: string[] = [],
): BuiltSiteSectionItem[] {
  const safe = sanitizeThemeDomainOnly({
    ...theme,
    contentImages: imageUrls.length ? imageUrls : theme.contentImages,
    heroImage: imageUrls[0] || theme.heroImage,
  });
  const urls = filterDomainOnlyMedia(
    imageUrls.length ? imageUrls : safe.contentImages || [],
    safe.referenceUrl || "",
    safe.domainUrl || "",
  );

  let items = buildPremiumAgencyHomepage(safe, vision, urls);
  items = items.map((item) => ({
    ...item,
    html: stripReferenceLeaksFromHtml(item.html, safe),
  }));

  const plan: BuiltSiteSectionPlan[] = (safe.sectionPlan || []).slice(0, 12);
  const categories = safe.categories?.length ? safe.categories : safe.navItems || [];

  return wireSinglePageSections(items, plan, categories, {
    brandName: safe.brandName,
    description: safe.description,
    logoImage: safe.logoImage,
    contentImages: urls,
    contactPhone: safe.contactPhone,
    contactEmail: safe.contactEmail,
    contactAddress: safe.contactAddress,
    referenceSiteName: safe.referenceSiteName,
    referenceUrl: safe.referenceUrl,
  }).map((item) => ({
    ...item,
    html: stripReferenceLeaksFromHtml(item.html, safe),
  }));
}

/**
 * Grok-style plan: KEEP reference section order + layout types (visual recreation),
 * but sanitize labels/ids and drop raw HTML blueprints (legal — our Tailwind only).
 */
export function transformReferencePlanForLegalSafety(
  plan: BuiltSiteSectionPlan[],
  seed = "",
): BuiltSiteSectionPlan[] {
  let hash = 0;
  const key = seed || plan.map((p) => p.id).join("|");
  for (let i = 0; i < key.length; i += 1) hash = (hash * 33 + key.charCodeAt(i)) >>> 0;

  const isFooter = (p: BuiltSiteSectionPlan) =>
    /footer/i.test(`${p.id} ${p.label}`) || /site-footer/i.test(p.layout || "");
  const isHeader = (p: BuiltSiteSectionPlan) =>
    /header|navbar|top-navigation/i.test(`${p.id} ${p.label} ${p.layout || ""}`) &&
    !/hero|banner|topfold/i.test(`${p.id} ${p.label}`);
  const isHero = (p: BuiltSiteSectionPlan) =>
    /hero|banner|topfold|top-fold|full-bleed-hero/i.test(
      `${p.id} ${p.label} ${p.layout || ""}`,
    );

  const humanLabel = (p: BuiltSiteSectionPlan, index: number) => {
    if (isHeader(p)) return "Header";
    if (isHero(p) && !isHeader(p)) return "Hero";
    if (isFooter(p)) return "Footer";
    let label = (p.label || "").replace(/\s+/g, " ").trim();
    // Drop slogan / reference marketing / other-city school pitches
    if (
      !label ||
      label.length > 36 ||
      /\.(com|org|in)\b/i.test(label) ||
      /donor|reason to smile|spread a smile|every rupee|let'?s dream/i.test(label) ||
      /\bbest\b.+\bschool\b|\bdear parents\b|\bin\s+(haridwar|dehradun|delhi|mumbai|kolkata|chennai)\b/i.test(
        label,
      ) ||
      /news.?ticker|marquee|announcement/i.test(`${p.id} ${label}`)
    ) {
      const layout = (p.layout || "").toLowerCase();
      if (/about|team/.test(layout) || /about/i.test(p.id)) return "About";
      if (/testimonial|review/.test(layout) || /testimonial|review|stor|parent/i.test(p.id)) {
        return "Stories";
      }
      if (/galler|logo|client|photo/.test(layout) || /galler|photo/i.test(p.id)) {
        return "Gallery";
      }
      if (/pricing|card|grid|feature|service|class/.test(layout) || /class|academ|facilit/i.test(p.id)) {
        return "Services";
      }
      if (/contact|form|cta/.test(layout)) return "Contact";
      if (/stat|impact|counter|highlight/.test(layout) || /impact|highlight|achiev/i.test(p.id)) {
        return "Impact";
      }
      if (/ticker|news|marquee/i.test(`${p.id} ${label}`)) return "Updates";
      return `Section ${index + 1}`;
    }
    if (/about/i.test(label)) return "About";
    if (/service|academ|facilit|program|classes/i.test(label)) return "Services";
    if (/galler|photo/i.test(label)) return "Gallery";
    if (/testimonial|review|voice|say|parent/i.test(label)) return "Stories";
    if (/contact|admission|enquire|enquir/i.test(label)) return "Contact";
    if (/impact|stat|result|achiev|highlight/i.test(label)) return "Impact";
    return label.slice(0, 28);
  };

  const cleanId = (p: BuiltSiteSectionPlan, label: string, index: number) => {
    if (isHeader(p)) return "header";
    if (isHero(p) && !isHeader(p)) return "hero";
    if (isFooter(p)) return "footer";
    const fromLabel = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    if (fromLabel && !/^section-\d+$/i.test(fromLabel)) return fromLabel;
    const raw = (p.id || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    if (raw && !/dfl|dreams|donor-banner/i.test(raw)) return raw;
    return `section-${index + 1}`;
  };

  const structuralHint = (p: BuiltSiteSectionPlan, label: string) => {
    const layout = p.layout || "content-section";
    const bits: string[] = [
      `Match reference ${layout} density`,
      "domain copy + imageUrls only",
    ];
    if (/header/i.test(label)) {
      bits.push("logo + nav (About/Services/Gallery/Contact) + CTA + one mobile burger");
    }
    if (/hero/i.test(label)) bits.push("full-bleed, dual CTAs, rich imagery");
    if (/footer/i.test(label)) bits.push("multi-column domain contact only");
    if (/galler/i.test(label)) bits.push("photo grid — not testimonials");
    return bits.join(" — ");
  };

  // Preserve reference order (normalize only chrome positions).
  const ordered = (() => {
    const headers = plan.filter((p) => isHeader(p) && !isFooter(p));
    const heroes = plan.filter((p) => isHero(p) && !isHeader(p) && !isFooter(p));
    const footers = plan.filter(isFooter);
    const rest = plan.filter(
      (p) => !isFooter(p) && !headers.includes(p) && !heroes.includes(p),
    );
    const out: BuiltSiteSectionPlan[] = [];
    if (headers[0]) out.push(headers[0]);
    if (heroes[0]) out.push(heroes[0]);
    // Prefer remaining heroes as mid only if not already used
    for (const h of heroes.slice(1)) {
      if (!rest.includes(h)) rest.unshift(h);
    }
    out.push(...rest);
    out.push(
      footers[footers.length - 1] || {
        id: "footer",
        label: "Footer",
        hint: "Footer links and copyright",
        layout: "site-footer",
        uiBlueprint: "",
      },
    );
    return out;
  })();

  let cleaned = ordered.slice(0, 14).map((p, index) => {
    const label = humanLabel(p, index);
    return {
      id: cleanId(p, label, index),
      label,
      layout: p.layout || "content-section",
      hint: structuralHint(p, label),
      uiBlueprint: "",
    } satisfies BuiltSiteSectionPlan;
  });

  // Dedupe consecutive duplicate labels (Hero/Hero, Services/Services)
  cleaned = cleaned.filter((p, i, arr) => {
    if (i === 0) return true;
    return arr[i - 1].label.toLowerCase() !== p.label.toLowerCase();
  });

  // Light differentiation — keep count close to reference (drop at most one mid band)
  if (cleaned.length >= 8) {
    const midIdxs = cleaned
      .map((p, i) => (/header|footer|hero|banner/i.test(`${p.id} ${p.label}`) ? -1 : i))
      .filter((i) => i >= 0);
    if (midIdxs.length >= 5) {
      const drop = midIdxs[1 + (hash % Math.max(1, midIdxs.length - 2))];
      cleaned = cleaned.filter((_, i) => i !== drop);
    }
  }
  cleaned = cleaned.map((p) => {
    if (/impact/i.test(`${p.id} ${p.label}`)) {
      return {
        ...p,
        id: "why-us",
        label: "Why families choose us",
        hint: "Domain benefits — not reference stats",
      };
    }
    return p;
  });

  // Dedupe ids
  const seen = new Set<string>();
  cleaned = cleaned.map((p, i) => {
    let id = p.id;
    if (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return { ...p, id };
  });

  return cleaned.slice(0, 12);
}
