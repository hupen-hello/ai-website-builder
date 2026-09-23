import type { SectionData } from "../types/section";

export const INLINE_TEXT_FORMATS_KEY = "__inlineTextFormats";
export const INLINE_PLAIN_TEXT_ATTRIBUTE = "data-editor-inline-plain-text";
export const EDITOR_EMPTY_TEXT_VALUE = "\u200B";
export const INLINE_EDITABLE_SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,span,a,button,li";

export type InlineTextFormat = {
  text: string;
  occurrence: number;
  html: string;
  key?: string;
};

const INLINE_FORMATTED_ATTRIBUTE = "data-editor-inline-formatted";
const INLINE_ORIGINAL_HTML_ATTRIBUTE = "data-editor-inline-original-html";
const INLINE_ORIGINAL_TEXT_ATTRIBUTE = "data-editor-inline-original-text";

const allowedTags = new Set([
  "A",
  "B",
  "BR",
  "DIV",
  "EM",
  "I",
  "LI",
  "OL",
  "P",
  "S",
  "SPAN",
  "STRIKE",
  "STRONG",
  "U",
  "UL",
]);

const allowedStyleProperties = [
  "color",
  "font-size",
  "font-style",
  "font-weight",
  "text-decoration",
  "text-decoration-line",
] as const;

const normalizeInlineText = (value: string) =>
  value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

/**
 * Prefer textContent over innerText for persistence. CSS like `uppercase`
 * changes innerText in Chromium, so saves fail to match stored fields and
 * remounts wipe the typed text (common on About headings).
 */
export const getInlinePersistableText = (element: HTMLElement) => {
  const clone = element.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("br")
    .forEach((node) => node.replaceWith(document.createTextNode("\n")));
  return normalizeInlineText(
    (clone.textContent ?? "").replaceAll(EDITOR_EMPTY_TEXT_VALUE, ""),
  );
};

const isSafeLink = (href: string) => {
  const normalizedHref = href.trim().replace(/\s+/g, "");
  const hasExplicitProtocol = /^[a-z][a-z\d+.-]*:/i.test(normalizedHref);

  return (
    normalizedHref.startsWith("#") ||
    normalizedHref.startsWith("/") ||
    /^(https?:|mailto:|tel:)/i.test(normalizedHref) ||
    !hasExplicitProtocol
  );
};

const sanitizeElement = (element: Element) => {
  Array.from(element.children).forEach(sanitizeElement);

  if (!allowedTags.has(element.tagName)) {
    element.replaceWith(...Array.from(element.childNodes));
    return;
  }

  const href = element.tagName === "A" ? element.getAttribute("href") : null;
  const safeHref = href && isSafeLink(href) ? href.trim() : null;
  const safeStyles = allowedStyleProperties.flatMap((property) => {
    const value = (element as HTMLElement).style
      .getPropertyValue(property)
      .trim();

    return value && !/url\s*\(/i.test(value) ? [[property, value] as const] : [];
  });

  Array.from(element.attributes).forEach((attribute) => {
    element.removeAttribute(attribute.name);
  });

  safeStyles.forEach(([property, value]) => {
    (element as HTMLElement).style.setProperty(property, value);
  });

  if (safeHref) {
    element.setAttribute("href", safeHref);
  }
};

const collapseRedundantInlineSpans = (root: DocumentFragment) => {
  let changed = true;

  while (changed) {
    changed = false;

    Array.from(root.querySelectorAll<HTMLSpanElement>("span"))
      .reverse()
      .forEach((span) => {
        if (!span.textContent && !span.children.length) {
          span.remove();
          changed = true;
          return;
        }

        const onlyChild =
          span.childNodes.length === 1 &&
          span.firstElementChild instanceof HTMLSpanElement
            ? span.firstElementChild
            : null;

        if (onlyChild) {
          allowedStyleProperties.forEach((property) => {
            const childValue = onlyChild.style.getPropertyValue(property);
            if (childValue) span.style.setProperty(property, childValue);
          });
          onlyChild.replaceWith(...Array.from(onlyChild.childNodes));
          changed = true;
        }

        if (!span.getAttribute("style")?.trim()) {
          span.replaceWith(...Array.from(span.childNodes));
          changed = true;
        }
      });
  }
};

export const sanitizeInlineHtml = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;

  Array.from(template.content.children).forEach(sanitizeElement);
  Array.from(template.content.childNodes).forEach((node) => {
    if (node.nodeType === Node.COMMENT_NODE) node.remove();
  });
  collapseRedundantInlineSpans(template.content);

  return template.innerHTML.trim();
};

export const hasMeaningfulInlineFormatting = (html: string) => {
  const template = document.createElement("template");
  template.innerHTML = html;

  return Boolean(
    template.content.querySelector(
      "a,b,br,div,em,i,li,ol,p,s,strike,strong,u,ul,[style]",
    ),
  );
};

export const readInlineTextFormats = (
  data: SectionData | undefined,
): InlineTextFormat[] => {
  const value = data?.[INLINE_TEXT_FORMATS_KEY];

  if (!Array.isArray(value)) return [];

  return value.filter(
    (item): item is InlineTextFormat =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as InlineTextFormat).text === "string" &&
      typeof (item as InlineTextFormat).html === "string" &&
      ((item as InlineTextFormat).key === undefined ||
        typeof (item as InlineTextFormat).key === "string") &&
      Number.isInteger((item as InlineTextFormat).occurrence) &&
      (item as InlineTextFormat).occurrence >= 0,
  );
};

export const getInlineEditableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(INLINE_EDITABLE_SELECTOR),
  ).filter(
    (element) => {
      if (element.closest("[data-lestow-copyright]")) {
        return false;
      }

      if (element.parentElement?.closest(`[${INLINE_FORMATTED_ATTRIBUTE}]`)) {
        return false;
      }

      const editableAncestor = element.parentElement?.closest<HTMLElement>(
        INLINE_EDITABLE_SELECTOR,
      );

      return !editableAncestor || !container.contains(editableAncestor);
    },
  );

export const getInlineTextOccurrence = (
  container: HTMLElement,
  target: HTMLElement,
  text: string,
) => {
  const normalized = normalizeInlineText(text);
  const matches = getInlineEditableElements(container).filter(
    (element) => getInlinePersistableText(element) === normalized,
  );
  const occurrence = matches.indexOf(target);

  return occurrence >= 0 ? occurrence : 0;
};

const clearAppliedInlineTextFormats = (
  container: HTMLElement,
  forceRestore = false,
) => {
  container
    .querySelectorAll<HTMLElement>(`[${INLINE_FORMATTED_ATTRIBUTE}]`)
    .forEach((element) => {
      const originalHtml = element.getAttribute(
        INLINE_ORIGINAL_HTML_ATTRIBUTE,
      );
      const originalText = element.getAttribute(
        INLINE_ORIGINAL_TEXT_ATTRIBUTE,
      );

      if (
        originalHtml !== null &&
        (forceRestore ||
          (originalText !== null &&
            getInlinePersistableText(element) ===
              normalizeInlineText(originalText)))
      ) {
        element.innerHTML = originalHtml;
      }

      element.removeAttribute(INLINE_FORMATTED_ATTRIBUTE);
      element.removeAttribute(INLINE_ORIGINAL_HTML_ATTRIBUTE);
      element.removeAttribute(INLINE_ORIGINAL_TEXT_ATTRIBUTE);
    });
};

/**
 * Inline formatting is rendered by temporarily decorating React-owned DOM.
 * Restore the original markup before React unmounts or replaces that tree so
 * React never attempts to remove nodes that have since been re-parented.
 */
export const restoreAppliedInlineTextFormats = (container: HTMLElement) => {
  clearAppliedInlineTextFormats(container, true);
};

/** Finish inline edits and restore React-owned markup before bulk unmount. */
export const prepareEditorSurfaceForReplace = () => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent("ai-builder-prepare-surface-replace"));

  const editorSurface = document.querySelector<HTMLElement>(
    "[data-editor-live-surface]",
  );
  if (!editorSurface) return;

  editorSurface
    .querySelectorAll<HTMLElement>("[contenteditable='true']")
    .forEach((element) => {
      element.removeAttribute("contenteditable");
      element.removeAttribute("spellcheck");
      element.blur();
    });

  restoreAppliedInlineTextFormats(editorSurface);
};

export const releaseAppliedInlineTextFormat = (element: HTMLElement) => {
  element.removeAttribute(INLINE_FORMATTED_ATTRIBUTE);
  element.removeAttribute(INLINE_ORIGINAL_HTML_ATTRIBUTE);
  element.removeAttribute(INLINE_ORIGINAL_TEXT_ATTRIBUTE);
};

export const applyInlineTextFormats = (
  container: HTMLElement,
  formats: InlineTextFormat[],
) => {
  clearAppliedInlineTextFormats(container);

  if (!formats.length) return;

  const editableElements = getInlineEditableElements(container);
  const claimedElements = new Set<HTMLElement>();

  formats.forEach((format) => {
    // Keyed formats belong to InlineRichText — mutating them with innerHTML
    // detaches React fibers and causes removeChild crashes on later updates.
    if (format.key) return;

    const matches = editableElements.filter(
      (element) =>
        getInlinePersistableText(element) ===
        normalizeInlineText(format.text),
    );
    const target = matches[format.occurrence];

    if (!target || claimedElements.has(target)) return;

    const safeHtml = sanitizeInlineHtml(format.html);
    if (!safeHtml) return;

    const testElement = document.createElement("div");
    testElement.innerHTML = safeHtml;

    if (
      normalizeInlineText(testElement.textContent ?? "") !==
      normalizeInlineText(format.text)
    ) {
      return;
    }

    target.setAttribute(INLINE_ORIGINAL_HTML_ATTRIBUTE, target.innerHTML);
    target.setAttribute(
      INLINE_ORIGINAL_TEXT_ATTRIBUTE,
      getInlinePersistableText(target),
    );
    target.setAttribute(INLINE_FORMATTED_ATTRIBUTE, "true");
    target.innerHTML = safeHtml;
    claimedElements.add(target);
  });
};

export const resolveInlineEditableElement = (
  container: HTMLElement,
  target: HTMLElement,
) => {
  if (target.closest("[data-lestow-copyright]")) return null;

  const keyedAncestor = target.closest<HTMLElement>(
    "[data-editor-inline-format-key]",
  );

  if (keyedAncestor && container.contains(keyedAncestor)) {
    if (keyedAncestor.closest("[data-lestow-copyright]")) return null;
    return keyedAncestor;
  }

  // Clicks on padding/icons of a parent link should still hit the keyed label.
  const host = target.closest<HTMLElement>(INLINE_EDITABLE_SELECTOR);
  if (host && container.contains(host)) {
    if (host.closest("[data-lestow-copyright]")) return null;

    const keyedChild = host.querySelector<HTMLElement>(
      "[data-editor-inline-format-key]:not([data-lestow-copyright] *)",
    );
    if (keyedChild) return keyedChild;

    // Wrapper that also contains locked Lestow credit is not itself editable.
    if (host.querySelector("[data-lestow-copyright]")) return null;
  }

  const formattedRoot = target.closest<HTMLElement>(
    `[${INLINE_FORMATTED_ATTRIBUTE}]`,
  );

  if (formattedRoot && container.contains(formattedRoot)) return formattedRoot;

  return host && container.contains(host) ? host : null;
};

export const isPlainTextInlineElement = (element: HTMLElement | null) => {
  if (!element) return false;
  return (
    element.hasAttribute(INLINE_PLAIN_TEXT_ATTRIBUTE) ||
    Boolean(element.closest(`[${INLINE_PLAIN_TEXT_ATTRIBUTE}]`)) ||
    Boolean(element.querySelector(`[${INLINE_PLAIN_TEXT_ATTRIBUTE}]`))
  );
};
