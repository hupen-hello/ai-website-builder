"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Bold, ChevronDown, Italic, Pencil, Trash2, X } from "lucide-react";

function listFlatSectionRoots(root: HTMLElement): HTMLElement[] {
  const direct = [...root.children].filter(
    (node): node is HTMLElement => node instanceof HTMLElement && node.tagName !== "STYLE",
  );
  if (direct.length >= 2) return direct;
  const scoped = [
    ...root.querySelectorAll<HTMLElement>(
      ":scope > header, :scope > section, :scope > footer, :scope > main, :scope > nav, :scope > article, :scope > div",
    ),
  ];
  if (scoped.length >= 2) return scoped;
  return [...root.querySelectorAll<HTMLElement>("[data-section-id]")];
}

function getFlatSectionEl(root: HTMLElement | null, sectionId: string, sectionIndex = -1) {
  if (!root) return null;
  const escaped = sectionId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const byId =
    root.querySelector<HTMLElement>(`[data-section-id="${escaped}"]`) ||
    root.querySelector<HTMLElement>(`#${CSS.escape(sectionId)}`);
  if (byId) return byId;
  const nodes = listFlatSectionRoots(root);
  if (sectionIndex >= 0 && sectionIndex < nodes.length) return nodes[sectionIndex];
  return null;
}

type EditableSectionProps = {
  children?: React.ReactNode;
  id: string;
  label: string;
  defaultSelected?: boolean;
  sectionIndex?: number;
  isHovered?: boolean;
  /** Bumps when flat site innerHTML is rewritten so click handlers rebind to live nodes. */
  flatDomEpoch?: number;
  /** Flat site canvas — section HTML already lives in this root; only overlay chrome renders. */
  flatRootRef?: RefObject<HTMLElement | null>;
};

let nextClientId = 0;
const createClientId = (prefix = "") => {
  nextClientId += 1;
  return `${prefix}${nextClientId.toString(36)}`;
};

const TripleChevrons = ({ direction }: { direction: "left" | "right" }) => (
  <svg
    width="18"
    height="12"
    viewBox="0 0 36 24"
    fill="currentColor"
    aria-hidden="true"
    className={direction === "left" ? "-scale-x-100" : undefined}
  >
    <path d="M0 3.2 12.4 12 0 20.8v-4.2L6.4 12 0 7.4z" />
    <path d="M11.2 3.2 23.6 12 11.2 20.8v-4.2L17.6 12 11.2 7.4z" />
    <path d="M22.4 3.2 34.8 12 22.4 20.8v-4.2L28.8 12 22.4 7.4z" />
  </svg>
);

const MoveTriangle = ({ direction }: { direction: "up" | "down" }) => (
  <svg
    width="12"
    height="10"
    viewBox="0 0 12 10"
    fill="none"
    aria-hidden="true"
  >
    {direction === "up" ? (
      <path d="M6 1.6 10.6 8.4H1.4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    ) : (
      <path d="M6 8.4 10.6 1.6H1.4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    )}
  </svg>
);

const LOCKED_SECTION_IDS = new Set(["header", "topbar", "footer"]);

type SectionMessage = {
  type:
  | "redesign-section-selected"
  | "redesign-section-deleted"
  | "redesign-section-update"
  | "redesign-code-panel-open"
  | "redesign-element-selected"
  | "redesign-element-update"
  | "redesign-element-cleared"
  | "redesign-clear-element-selection"
  | "redesign-request-primary-element";
  sectionId: string;
  label?: string;
  html?: string;
  elementId?: string;
  kind?: "text" | "image";
  tagName?: string;
  text?: string;
  src?: string;
  alt?: string;
  fontFamily?: string;
  fontSize?: string;
  color?: string;
  textTransform?: "none" | "uppercase" | "lowercase";
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  historyGroupId?: string;
  changes?: {
    text?: string;
    src?: string;
    alt?: string;
    fontFamily?: string;
    fontSize?: string;
    color?: string;
    textTransform?: "none" | "uppercase" | "lowercase";
    marginTop?: string;
    marginRight?: string;
    marginBottom?: string;
    marginLeft?: string;
    paddingTop?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingLeft?: string;
  };
};

const toHexColor = (color: string) => {
  if (color.startsWith("#")) return color.slice(0, 7);
  const values = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!values || values.length < 3) return "#000000";
  return `#${values.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
};

const toSpacing = (value: string) => {
  const numeric = parseFloat(value);
  return `${Number.isFinite(numeric) ? Math.round(numeric) : 0}px`;
};

const TEXT_BLOCK_SELECTOR = "h1, h2, h3, h4, h5, h6, p, li";
const SMALL_COMPONENT_SELECTOR = "a, button, h1, h2, h3, h4, h5, h6, p, img, li";
const TEXT_TOOLBAR_FONTS = [
  '"Instrument Serif", serif',
  "Arial, sans-serif",
  "Georgia, serif",
  "Inter, sans-serif",
  "Poppins, sans-serif",
  "Montserrat, sans-serif",
  '"Playfair Display", serif',
  "Times New Roman, serif",
];
const TEXT_TOOLBAR_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72, 76, 80, 96];
const fontLabel = (font: string) => font.split(",")[0].replace(/['"]/g, "").trim();
const matchingToolbarFont = (computed: string) =>
  TEXT_TOOLBAR_FONTS.find((font) => fontLabel(font).toLowerCase() === fontLabel(computed).toLowerCase()) ?? computed;
const SPACING_STYLES = [
  ["marginTop", "margin-top"],
  ["marginRight", "margin-right"],
  ["marginBottom", "margin-bottom"],
  ["marginLeft", "margin-left"],
  ["paddingTop", "padding-top"],
  ["paddingRight", "padding-right"],
  ["paddingBottom", "padding-bottom"],
  ["paddingLeft", "padding-left"],
] as const;

const getEditableText = (element: HTMLElement) => {
  // Prefer visible text (includes nested spans inside headings).
  const raw = (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim();
  return raw;
};

const isMeaningfulEditableText = (element: HTMLElement) => {
  const text = getEditableText(element);
  if (text.length < 2) return false;
  // Ignore icon glyphs / punctuation-only crumbs inside headings.
  if (text.length <= 3 && !/[a-zA-Z0-9\u0900-\u097F]/.test(text)) return false;
  return true;
};

/** Nearest element the Content panel should edit (prefer h1–p over nested empty spans). */
const resolveContentTarget = (clicked: HTMLElement, sectionRoot: HTMLElement): HTMLElement | null => {
  if (!sectionRoot.contains(clicked)) return null;

  const image = clicked.closest<HTMLImageElement>("img");
  if (image && sectionRoot.contains(image)) return image;

  const textBlock = clicked.closest<HTMLElement>(
    `${TEXT_BLOCK_SELECTOR}, blockquote, figcaption, td, th`,
  );
  if (textBlock && sectionRoot.contains(textBlock) && isMeaningfulEditableText(textBlock)) {
    return textBlock;
  }

  const editableSelector =
    "a, button, label, span, strong, em, figcaption, td, th, blockquote, p, h1, h2, h3, h4, h5, h6, li";
  let target = clicked.closest<HTMLElement>(editableSelector);
  while (target && sectionRoot.contains(target) && !isMeaningfulEditableText(target)) {
    target = target.parentElement?.closest<HTMLElement>(editableSelector) ?? null;
  }
  if (target && sectionRoot.contains(target)) return target;
  return textBlock && sectionRoot.contains(textBlock) ? textBlock : null;
};

const getTextBlock = (element: HTMLElement, root: HTMLElement) => {
  const block = element.closest<HTMLElement>(TEXT_BLOCK_SELECTOR);
  if (!block || block === root || !root.contains(block)) return null;
  return block;
};

const getLayoutBlock = (element: HTMLElement, root: HTMLElement) => {
  let node: HTMLElement | null = element;

  while (node && node !== root && root.contains(node)) {
    const parentElement: HTMLElement | null = node.parentElement;

    if (
      !parentElement ||
      parentElement === root ||
      !root.contains(parentElement)
    ) {
      break;
    }

    const display = window.getComputedStyle(parentElement).display;

    const isLayout =
      display.includes("flex") || display.includes("grid");

    if (isLayout && parentElement.childElementCount > 1) {
      return node;
    }

    node = parentElement;
  }

  return null;
};
const getSmallComponent = (element: HTMLElement, root: HTMLElement) => {
  const image = element.closest<HTMLElement>("img");
  if (image && image !== root && root.contains(image)) return image;

  const small = element.closest<HTMLElement>(SMALL_COMPONENT_SELECTOR);
  if (!small || small === root || !root.contains(small)) return null;
  return small;
};

const getDraggableBlock = (element: HTMLElement, root: HTMLElement) => {
  const small = getSmallComponent(element, root);
  if (small) return small;

  const layoutBlock = getLayoutBlock(element, root);
  if (layoutBlock) {
    const nestedSmall = layoutBlock.closest<HTMLElement>(SMALL_COMPONENT_SELECTOR);
    if (nestedSmall && nestedSmall !== root && root.contains(nestedSmall)) return nestedSmall;
    return layoutBlock;
  }

  return getTextBlock(element, root);
};

const createDropPlaceholder = (block: HTMLElement) => {
  const placeholder = block.cloneNode(true) as HTMLElement;
  placeholder.removeAttribute("data-redesign-element-id");
  placeholder.removeAttribute("data-redesign-dragging");
  placeholder.setAttribute("data-redesign-drop-placeholder", "true");
  placeholder.style.visibility = "hidden";
  placeholder.style.pointerEvents = "none";
  placeholder.style.opacity = "0";
  return placeholder;
};

const getInsertBeforeSibling = (
  siblings: Element[],
  x: number,
  y: number,
  axis: "x" | "xy",
) => {
  if (axis === "x") {
    return siblings.find((sibling) => {
      const rect = sibling.getBoundingClientRect();
      return x < rect.left + rect.width / 2;
    }) ?? null;
  }

  const inReadingOrder = [...siblings].sort((a, b) => {
    const aRect = a.getBoundingClientRect();
    const bRect = b.getBoundingClientRect();
    if (Math.abs(aRect.top - bRect.top) > 12) return aRect.top - bRect.top;
    return aRect.left - bRect.left;
  });

  return inReadingOrder.find((sibling) => {
    const rect = sibling.getBoundingClientRect();
    const onSameRow = y >= rect.top - 8 && y <= rect.bottom + 8;
    if (onSameRow) return x < rect.left + rect.width / 2;
    return y < rect.top + rect.height / 2;
  }) ?? null;
};

const applySpacingChanges = (target: HTMLElement, changes: NonNullable<SectionMessage["changes"]>) => {
  let applied = false;
  for (const [key, cssName] of SPACING_STYLES) {
    const value = changes[key];
    if (typeof value !== "string") continue;
    target.style.setProperty(cssName, value, "important");
    applied = true;
  }
  if (!applied) return;
  const display = window.getComputedStyle(target).display;
  if (display === "inline") target.style.setProperty("display", "inline-block", "important");
};

export default function EditableSection({
  children,
  id,
  label,
  defaultSelected = false,
  sectionIndex = -1,
  isHovered = false,
  flatDomEpoch = 0,
  flatRootRef,
}: EditableSectionProps) {
  const isFlatMode = Boolean(flatRootRef);
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isSectionHovered, setIsSectionHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [customHtml, setCustomHtml] = useState<string | null>(null);
  const [sectionMinHeight, setSectionMinHeight] = useState<number | null>(null);
  const [imageEditor, setImageEditor] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const imageTargetRef = useRef<HTMLImageElement | null>(null);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(0);
  const didDragTextRef = useRef(false);
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [toolbarAlign, setToolbarAlign] = useState<"left" | "center" | "right">("center");
  const [canMoveUp, setCanMoveUp] = useState(false);
  const [canMoveDown, setCanMoveDown] = useState(false);
  const [textToolbar, setTextToolbar] = useState<{
    left: number;
    top: number;
    runId: string;
    fontFamily: string;
    fontSize: string;
    color: string;
    backgroundColor: string;
    bold: boolean;
    italic: boolean;
    textTransform: "none" | "uppercase" | "lowercase";
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
  } | null>(null);
  const textToolbarRef = useRef<HTMLDivElement>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const skipElementSelectRef = useRef<"keep" | "dismiss" | null>(null);
  const [openTextMenu, setOpenTextMenu] = useState<"font" | "size" | null>(null);

  if (!textToolbar && openTextMenu) {
    setOpenTextMenu(null);
  }

  useEffect(() => {
    if (!openTextMenu) return;
    const close = (event: MouseEvent) => {
      if (textToolbarRef.current?.contains(event.target as Node)) return;
      setOpenTextMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openTextMenu]);

  useEffect(() => {
    if (!textToolbar) return;
    const hideIfOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (textToolbarRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setTextToolbar(null);
      activeRunIdRef.current = null;
    };
    document.addEventListener("mousedown", hideIfOutside);
    return () => document.removeEventListener("mousedown", hideIfOutside);
  }, [textToolbar]);

  const restoreActiveTextSelection = () => {
    const runId = activeRunIdRef.current;
    if (!runId) return;
    const active = document.activeElement;
    if (
      active &&
      textToolbarRef.current?.contains(active) &&
      (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")
    ) {
      return;
    }
    const target = sectionRef.current?.querySelector<HTMLElement>(
      `[data-redesign-text-run="${CSS.escape(runId)}"]`,
    );
    if (!target) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(target);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const repositionTextToolbar = () => {
    const toolbar = textToolbarRef.current;
    const section = sectionRef.current;
    const runId = activeRunIdRef.current;
    if (!toolbar || !section || !runId) return;

    const run = section.querySelector<HTMLElement>(
      `[data-redesign-text-run="${CSS.escape(runId)}"]`,
    );
    if (!run) return;

    const edge = 8;
    const gap = 8;
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = document.documentElement.clientHeight || window.innerHeight;
    toolbar.style.maxWidth = `${Math.max(160, vw - edge * 2)}px`;

    const runRect = run.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const width = toolbar.offsetWidth;
    const height = toolbar.offsetHeight;
    const minLeft = edge - sectionRect.left;
    const maxLeft = vw - edge - width - sectionRect.left;
    const centered = runRect.left + runRect.width / 2 - sectionRect.left - width / 2;
    const left = Math.min(Math.max(centered, minLeft), Math.max(minLeft, maxLeft));

    const header = document.querySelector<HTMLElement>("[data-editable-section='header']");
    const headerBottom = header && !header.contains(run) ? header.getBoundingClientRect().bottom : 0;
    const topLimit = Math.max(edge, headerBottom + gap);
    const spaceAbove = runRect.top - topLimit;
    const spaceBelow = vh - edge - runRect.bottom;
    const placeBelow = spaceAbove < height + gap && (spaceBelow >= height + gap || spaceBelow >= spaceAbove);
    const top = placeBelow
      ? runRect.bottom - sectionRect.top + gap
      : runRect.top - sectionRect.top - height - gap;

    toolbar.style.left = `${left}px`;
    toolbar.style.top = `${top}px`;
  };

  useLayoutEffect(() => {
    if (!textToolbar) return;
    restoreActiveTextSelection();
    repositionTextToolbar();
    const onResize = () => repositionTextToolbar();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [customHtml, textToolbar, openTextMenu]);

  const canReorderSection = !LOCKED_SECTION_IDS.has(id);

  const getAdjacentMovableSection = (direction: "up" | "down") => {
    const node = sectionRef.current;
    if (!node) return null;
    let sibling = direction === "up" ? node.previousElementSibling : node.nextElementSibling;
    while (sibling) {
      if (sibling instanceof HTMLElement && sibling.matches("[data-editable-section]")) {
        const sectionId = sibling.getAttribute("data-editable-section") ?? "";
        if (!LOCKED_SECTION_IDS.has(sectionId)) return sibling;
      }
      sibling = direction === "up" ? sibling.previousElementSibling : sibling.nextElementSibling;
    }
    return null;
  };

  const refreshMoveAvailability = () => {
    setCanMoveUp(Boolean(getAdjacentMovableSection("up")));
    setCanMoveDown(Boolean(getAdjacentMovableSection("down")));
  };

  const moveSection = (direction: "up" | "down") => {
    const node = sectionRef.current;
    const target = getAdjacentMovableSection(direction);
    if (!node || !target) return;
    if (direction === "down") target.after(node);
    else target.before(node);
    refreshMoveAvailability();
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const snapshotTextRunStyles = (element: HTMLElement) => {
    const styles = window.getComputedStyle(element);
    const backgroundColor =
      styles.backgroundColor === "rgba(0, 0, 0, 0)" || styles.backgroundColor === "transparent"
        ? "#ffffff"
        : toHexColor(styles.backgroundColor);
    return {
      fontFamily: matchingToolbarFont(styles.fontFamily),
      fontSize: styles.fontSize,
      color: toHexColor(styles.color),
      backgroundColor,
      bold: Number.parseInt(styles.fontWeight, 10) >= 700,
      italic: styles.fontStyle === "italic",
      textTransform: (styles.textTransform === "uppercase" || styles.textTransform === "lowercase"
        ? styles.textTransform
        : "none") as "none" | "uppercase" | "lowercase",
      paddingTop: toSpacing(styles.paddingTop),
      paddingRight: toSpacing(styles.paddingRight),
      paddingBottom: toSpacing(styles.paddingBottom),
      paddingLeft: toSpacing(styles.paddingLeft),
    };
  };

  const applyTextRunStyle = (styles: Record<string, string>, toolbarPatch?: Partial<NonNullable<typeof textToolbar>>) => {
    const runId = activeRunIdRef.current;
    if (!runId) return;
    const target = sectionRef.current?.querySelector<HTMLElement>(
      `[data-redesign-text-run="${CSS.escape(runId)}"]`,
    );
    if (!target) return;
    for (const [prop, value] of Object.entries(styles)) {
      target.style.setProperty(prop, value);
    }
    if (
      styles["padding-top"] ||
      styles["padding-right"] ||
      styles["padding-bottom"] ||
      styles["padding-left"]
    ) {
      const display = window.getComputedStyle(target).display;
      if (display === "inline") target.style.setProperty("display", "inline-block");
    }
    setCustomHtml(getSectionHtml(true));
    selectSection(`text-style:${id}`);
    if (toolbarPatch) {
      setTextToolbar((current) => (current ? { ...current, ...toolbarPatch } : current));
    }
  };

  const captureTextSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    if (document.documentElement.hasAttribute("data-redesign-view-mode")) return;
    if (isDragEnabled) return;
    if ((event.target as HTMLElement).closest("[data-redesign-ui]")) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (activeRunIdRef.current) skipElementSelectRef.current = "dismiss";
      setTextToolbar(null);
      activeRunIdRef.current = null;
      return;
    }

    const range = selection.getRangeAt(0);
    const root = contentRef.current;
    if (!root || !root.contains(range.commonAncestorContainer) || !selection.toString().trim()) {
      if (activeRunIdRef.current) skipElementSelectRef.current = "dismiss";
      setTextToolbar(null);
      activeRunIdRef.current = null;
      return;
    }

    const ancestor = range.commonAncestorContainer;
    const ancestorEl = ancestor instanceof HTMLElement ? ancestor : ancestor.parentElement;
    const existingRun = ancestorEl?.closest<HTMLElement>("[data-redesign-text-run]");
    const reuseRun =
      existingRun &&
      root.contains(existingRun) &&
      selection.toString().trim() === (existingRun.textContent ?? "").trim();

    let runEl = existingRun;
    let runId = existingRun?.getAttribute("data-redesign-text-run");

    if (!reuseRun) {
      runId = createClientId("run-");
      const wrapper = document.createElement("span");
      wrapper.setAttribute("data-redesign-text-run", runId);
      try {
        range.surroundContents(wrapper);
      } catch {
        const contents = range.extractContents();
        wrapper.appendChild(contents);
        range.insertNode(wrapper);
      }
      runEl = wrapper;
      setCustomHtml(getSectionHtml(true));
      selectSection(`text-style:${id}`);
    }

    if (!runEl || !runId) return;
    skipElementSelectRef.current = "keep";
    sectionRef.current?.querySelectorAll("[data-redesign-element-id]").forEach((element) => {
      element.removeAttribute("data-redesign-element-id");
    });
    sendMessage({ type: "redesign-element-cleared", sectionId: id, label });
    activeRunIdRef.current = runId;
    const rect = runEl.getBoundingClientRect();
    setTextToolbar({
      left: rect.left + rect.width / 2,
      top: Math.max(12, rect.top - 10),
      runId,
      ...snapshotTextRunStyles(runEl),
    });
  };

  const getSectionHtml = (preserveElementIds = false) => {
    const element = isFlatMode
      ? getFlatSectionEl(flatRootRef?.current ?? null, id, sectionIndex)
      : sectionRef.current?.querySelector("[data-editable-section-content]")?.firstElementChild;
    if (!(element instanceof HTMLElement)) return customHtml || "";

    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("[data-inline-editing]").forEach((node) => {
      node.removeAttribute("contenteditable");
      node.removeAttribute("data-inline-editing");
      node.removeAttribute("spellcheck");
    });

    if (clone.hasAttribute("data-inline-editing")) {
      clone.removeAttribute("contenteditable");
      clone.removeAttribute("data-inline-editing");
      clone.removeAttribute("spellcheck");
    }

    if (!preserveElementIds) {
      clone.removeAttribute("data-redesign-element-id");
      clone.querySelectorAll("[data-redesign-element-id]").forEach((node) => {
        node.removeAttribute("data-redesign-element-id");
      });
    }

    return clone.outerHTML;
  };

  const sendMessage = (message: SectionMessage) => {
    window.parent.postMessage(message, window.location.origin);
  };

  const selectSection = (historyGroupId?: string) => {
    sendMessage({ type: "redesign-section-selected", sectionId: id, label, html: getSectionHtml(), historyGroupId });
  };

  const announceEditableElement = (target: HTMLElement) => {
    const scope =
      (isFlatMode ? contentRef.current : null) ||
      sectionRef.current ||
      target.ownerDocument?.body;
    scope?.querySelectorAll("[data-redesign-element-id]").forEach((element) => {
      if (element !== target) element.removeAttribute("data-redesign-element-id");
    });

    const elementId = target.dataset.redesignElementId || createClientId(`${id}-`);
    target.dataset.redesignElementId = elementId;
    const styles = window.getComputedStyle(target);
    const image = target instanceof HTMLImageElement ? target : null;

    sendMessage({
      type: "redesign-element-selected",
      sectionId: id,
      label,
      html: getSectionHtml(),
      elementId,
      kind: image ? "image" : "text",
      tagName: target.tagName.toLowerCase(),
      text: image ? undefined : getEditableText(target),
      src: image?.getAttribute("src") ?? undefined,
      alt: image?.alt,
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      color: toHexColor(styles.color),
      textTransform: styles.textTransform === "uppercase" || styles.textTransform === "lowercase"
        ? styles.textTransform
        : "none",
      marginTop: toSpacing(styles.marginTop),
      marginRight: toSpacing(styles.marginRight),
      marginBottom: toSpacing(styles.marginBottom),
      marginLeft: toSpacing(styles.marginLeft),
      paddingTop: toSpacing(styles.paddingTop),
      paddingRight: toSpacing(styles.paddingRight),
      paddingBottom: toSpacing(styles.paddingBottom),
      paddingLeft: toSpacing(styles.paddingLeft),
    });
  };

  const selectEditableElement = (event: React.MouseEvent<HTMLDivElement> | Event) => {
    const mouseEvent = event as React.MouseEvent<HTMLDivElement>;
    if (document.documentElement.hasAttribute("data-redesign-view-mode")) {
      // Clicking content should leave view mode and open the right Content panel.
      window.parent.postMessage(
        { type: "redesign-exit-view-mode" },
        window.location.origin,
      );
      document.documentElement.removeAttribute("data-redesign-view-mode");
    }
    if (didDragTextRef.current) {
      didDragTextRef.current = false;
      mouseEvent.preventDefault?.();
      mouseEvent.stopPropagation?.();
      return;
    }

    if (skipElementSelectRef.current) {
      const mode = skipElementSelectRef.current;
      skipElementSelectRef.current = null;
      mouseEvent.preventDefault?.();
      mouseEvent.stopPropagation?.();
      if (mode === "keep") restoreActiveTextSelection();
      return;
    }

    const clicked = (event.target as HTMLElement) || null;
    if (!clicked || clicked.closest("[data-redesign-ui]")) return;
    // Let runtime handle mobile menu / slider controls — don't steal the click.
    if (
      clicked.closest(
        "[data-mobile-menu-toggle], [data-mobile-menu], [data-mobile-submenu-trigger], [data-hero-prev], [data-hero-next], [data-hero-dot], [data-tab-trigger], [data-carousel-prev], [data-carousel-next]",
      )
    ) {
      return;
    }
    // Untagged hamburger (AI CSS bars / svg icon) — still leave for runtime.
    const maybeToggle = clicked.closest<HTMLElement>("button, a, [role='button']");
    if (
      maybeToggle?.closest("header") &&
      !maybeToggle.closest("[data-mobile-menu]") &&
      (() => {
        const label = (maybeToggle.getAttribute("aria-label") || maybeToggle.getAttribute("title") || "").toLowerCase();
        if (/menu|nav|toggle|hamburger|drawer|bars/.test(label)) return true;
        const text = (maybeToggle.textContent || "").replace(/\s+/g, "").trim();
        if (/☰|≡/.test(text) || (maybeToggle.querySelector("svg") && text.length <= 2)) return true;
        const bars = [...maybeToggle.querySelectorAll(":scope > span, :scope > i, :scope > div")].filter(
          (el) => el instanceof HTMLElement && el.children.length === 0,
        );
        return bars.length >= 2 && bars.length <= 4 && text.length <= 4;
      })()
    ) {
      return;
    }

    // Flat HTML can be rewritten; always resolve the live section node before contains().
    if (isFlatMode && flatRootRef?.current) {
      const live = getFlatSectionEl(flatRootRef.current, id, sectionIndex);
      if (live) contentRef.current = live as HTMLDivElement;
    }

    const sectionRoot =
      (isFlatMode ? contentRef.current : null) ||
      (mouseEvent.currentTarget as HTMLElement | null) ||
      (event.currentTarget as HTMLElement | null);

    if (!sectionRoot) return;

    const target = resolveContentTarget(clicked, sectionRoot);

    if (!target || !sectionRoot.contains(target)) {
      sectionRoot.querySelectorAll("[data-redesign-element-id]").forEach((element) => {
        element.removeAttribute("data-redesign-element-id");
      });
      if (customHtml !== null) setCustomHtml(getSectionHtml(true));
      sendMessage({ type: "redesign-element-cleared", sectionId: id, label });
      return;
    }

    mouseEvent.preventDefault?.();
    mouseEvent.stopPropagation?.();
    announceEditableElement(target);
  };

  const applySectionHeight = (height: number) => {
    const content = contentRef.current;
    if (!content) return;
    content.style.minHeight = `${height}px`;
    const inner = content.firstElementChild as HTMLElement | null;
    if (inner) inner.style.minHeight = `${height}px`;
    setSectionMinHeight(height);
  };

  const commitSectionChange = (historyGroupId?: string, preserveElementIds = false) => {
    const nextHtml = getSectionHtml(preserveElementIds);
    setCustomHtml(nextHtml);
    selectSection(historyGroupId);
  };

  const startTextBlockDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (document.documentElement.hasAttribute("data-redesign-view-mode")) return;
    if (!isDragEnabled || event.button !== 0) return;
    const isHeaderChrome = id === "header" || id === "topbar";
    if (isHeaderChrome && window.matchMedia("(max-width: 639px)").matches) return;

    const root = event.currentTarget;
    const target = event.target as HTMLElement;
    if (target.closest("[data-inline-editing]")) return;
    if (target.closest("[data-redesign-ui]")) return;
    if (target.closest("[data-redesign-drop-placeholder]")) return;
    if (
      target.closest(
        "[data-mobile-menu-toggle], [data-mobile-menu], [data-hero-prev], [data-hero-next], [data-hero-dot]",
      )
    ) {
      return;
    }

    const block = getDraggableBlock(target, root);
    if (!block) return;

    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const originalNext = block.nextSibling;
    const originalStyle = block.getAttribute("style");
    const axis: "x" | "xy" = isHeaderChrome ? "x" : "xy";
    const section = sectionRef.current;
    let started = false;
    let placeholder: HTMLElement | null = null;
    let offsetX = 0;
    let offsetY = 0;
    let lockedTop = 0;
    let frame = 0;
    let lastX = startX;
    let lastY = startY;

    const hideToolbar = (hidden: boolean) => {
      if (!section) return;
      if (hidden) section.setAttribute("data-redesign-dragging-active", "true");
      else section.removeAttribute("data-redesign-dragging-active");
    };

    const placePlaceholder = (clientX: number, clientY: number) => {
      if (!placeholder) return;
      const parent = placeholder.parentElement;
      if (!parent) return;

      const siblings = Array.from(parent.children).filter(
        (child) => child !== block && child !== placeholder,
      );
      const insertBefore = getInsertBeforeSibling(
        siblings,
        clientX,
        axis === "x" ? startY : clientY,
        axis,
      );

      if (insertBefore) {
        if (placeholder.nextElementSibling !== insertBefore) parent.insertBefore(placeholder, insertBefore);
        return;
      }

      if (parent.lastElementChild !== placeholder) parent.appendChild(placeholder);
    };

    const applyLiftedPosition = (clientX: number, clientY: number) => {
      const x = clientX - offsetX;
      const y = axis === "x" ? lockedTop : clientY - offsetY;
      block.style.transform = `translate3d(${x}px, ${y}px, 0) scale(1.03)`;
      placePlaceholder(clientX, clientY);
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      lastX = moveEvent.clientX;
      lastY = moveEvent.clientY;

      if (!started) {
        const deltaX = lastX - startX;
        const deltaY = lastY - startY;
        const distance = axis === "x" ? Math.abs(deltaX) : Math.hypot(deltaX, deltaY);
        if (distance < 6) return;
        started = true;
        didDragTextRef.current = true;
        setTextToolbar(null);

        const rect = block.getBoundingClientRect();
        offsetX = lastX - rect.left;
        offsetY = lastY - rect.top;
        lockedTop = rect.top;

        placeholder = createDropPlaceholder(block);
        block.insertAdjacentElement("beforebegin", placeholder);

        hideToolbar(true);
        block.setAttribute("data-redesign-dragging", "true");
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
        try {
          root.setPointerCapture(pointerId);
        } catch {
          /* pointer capture is best-effort inside the preview iframe */
        }

        block.style.position = "fixed";
        block.style.left = "0";
        block.style.top = "0";
        block.style.width = `${rect.width}px`;
        block.style.height = `${rect.height}px`;
        block.style.margin = "0";
        block.style.zIndex = "1000";
        block.style.pointerEvents = "none";
        block.style.willChange = "transform";
        block.style.transition = "box-shadow 120ms ease, opacity 120ms ease";
        block.style.transformOrigin = "top left";
        applyLiftedPosition(lastX, lastY);
        announceEditableElement(block);
      }

      moveEvent.preventDefault();
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        applyLiftedPosition(lastX, lastY);
      });
    };

    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("pointercancel", onUp);
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
      if (root.hasPointerCapture?.(pointerId)) {
        try {
          root.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }

      if (!started) return;

      if (placeholder?.parentElement) {
        placeholder.parentElement.insertBefore(block, placeholder);
        placeholder.remove();
      }

      if (originalStyle == null) block.removeAttribute("style");
      else block.setAttribute("style", originalStyle);

      block.removeAttribute("data-redesign-dragging");
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      hideToolbar(false);

      if (block.nextSibling !== originalNext) {
        commitSectionChange(`reorder-text:${id}`, true);
      }
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("pointercancel", onUp);
  };

  const startSectionResize = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const content = contentRef.current;
    if (!content) return;

    resizeStartYRef.current = event.clientY;
    resizeStartHeightRef.current = content.offsetHeight;

    const handleMove = (moveEvent: MouseEvent) => {
      const nextHeight = Math.max(
        120,
        resizeStartHeightRef.current + (moveEvent.clientY - resizeStartYRef.current),
      );
      applySectionHeight(nextHeight);
    };

    const handleUp = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      commitSectionChange(`section-height:${id}`);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const openCodePanel = () => {
    sendMessage({
      type: "redesign-code-panel-open",
      sectionId: id,
      label,
      html: getSectionHtml(),
    });
    window.requestAnimationFrame(() => selectSection());
  };

  useEffect(() => {
    if (!defaultSelected) return;
    const frame = window.requestAnimationFrame(() => selectSection());
    return () => window.cancelAnimationFrame(frame);
    // The first section announces itself once when the preview mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSelected]);

  useLayoutEffect(() => {
    if (!isFlatMode || !flatRootRef?.current || !sectionRef.current) return;
    const target = getFlatSectionEl(flatRootRef.current, id, sectionIndex);
    if (!target) return;
    const overlay = sectionRef.current;
    const host = flatRootRef.current.parentElement;
    if (!host) return;

    const sync = () => {
      const targetRect = target.getBoundingClientRect();
      const hostRect = host.getBoundingClientRect();
      overlay.style.top = `${targetRect.top - hostRect.top + host.scrollTop}px`;
      overlay.style.left = `${targetRect.left - hostRect.left + host.scrollLeft}px`;
      overlay.style.width = `${targetRect.width}px`;
      overlay.style.height = `${Math.max(targetRect.height, target.offsetHeight)}px`;
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(target);
    host.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      host.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [flatRootRef, id, isFlatMode, sectionIndex, isHovered, flatDomEpoch]);

  useEffect(() => {
    if (!isFlatMode || !flatRootRef?.current) return;
    const target = getFlatSectionEl(flatRootRef.current, id, sectionIndex);
    if (!target) return;
    contentRef.current = target as HTMLDivElement;

    const onEnter = () => setIsSectionHovered(true);
    const onLeave = (event: Event) => {
      const next = (event as MouseEvent).relatedTarget as Node | null;
      if (next && sectionRef.current?.contains(next)) return;
      setIsSectionHovered(false);
    };

    const opts: AddEventListenerOptions = { capture: true };
    const onClick = (event: Event) =>
      selectEditableElement(event as unknown as React.MouseEvent<HTMLDivElement>);
    const onPointerDown = (event: Event) =>
      startTextBlockDrag(event as unknown as React.PointerEvent<HTMLDivElement>);
    const onMouseUp = (event: Event) =>
      captureTextSelection(event as unknown as React.MouseEvent<HTMLDivElement>);
    const onDoubleClick = (event: Event) =>
      startInlineEditing(event as unknown as React.MouseEvent<HTMLDivElement>);
    const onInput = (event: Event) =>
      handleSectionInput(event as unknown as React.FormEvent<HTMLDivElement>);
    const onBlur = (event: Event) =>
      finishInlineEditing(event as unknown as React.FocusEvent<HTMLDivElement>);

    target.addEventListener("mouseenter", onEnter, opts);
    target.addEventListener("mouseleave", onLeave, opts);
    target.addEventListener("click", onClick, opts);
    target.addEventListener("pointerdown", onPointerDown, opts);
    target.addEventListener("mouseup", onMouseUp, opts);
    target.addEventListener("dblclick", onDoubleClick, opts);
    target.addEventListener("input", onInput, opts);
    target.addEventListener("blur", onBlur, opts);

    return () => {
      target.removeEventListener("mouseenter", onEnter, opts);
      target.removeEventListener("mouseleave", onLeave, opts);
      target.removeEventListener("click", onClick, opts);
      target.removeEventListener("pointerdown", onPointerDown, opts);
      target.removeEventListener("mouseup", onMouseUp, opts);
      target.removeEventListener("dblclick", onDoubleClick, opts);
      target.removeEventListener("input", onInput, opts);
      target.removeEventListener("blur", onBlur, opts);
    };
    // Flat canvas binds to live section nodes after the shared HTML blob mounts / refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatRootRef, id, isFlatMode, sectionIndex, customHtml, flatDomEpoch]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<SectionMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "redesign-request-primary-element") {
        const requested = (event.data as { sectionId?: string }).sectionId;
        if (requested && requested !== "all" && requested !== id) return;
        // "all" → only the default/first section answers (avoid last-section race).
        if ((!requested || requested === "all") && !defaultSelected && sectionIndex !== 0) return;
        const sectionRoot = isFlatMode
          ? getFlatSectionEl(flatRootRef?.current ?? null, id, sectionIndex)
          : sectionRef.current;
        if (!sectionRoot) return;
        const primaryElement =
          sectionRoot.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6") ??
          sectionRoot.querySelector<HTMLElement>("p, span, a, button, li, img");
        if (primaryElement && sectionRoot.contains(primaryElement)) {
          announceEditableElement(primaryElement);
        }
        return;
      }

      if (event.data?.type === "redesign-clear-element-selection") {
        const scope = isFlatMode
          ? getFlatSectionEl(flatRootRef?.current ?? null, id, sectionIndex)
          : sectionRef.current;
        scope?.querySelectorAll("[data-redesign-element-id]").forEach((element) => {
          element.removeAttribute("data-redesign-element-id");
        });
        setCustomHtml((current) => (current === null ? null : getSectionHtml(true)));
        return;
      }

      if (event.data?.type === "redesign-section-update") {
        if (event.data.sectionId !== id || typeof event.data.html !== "string") return;
        if (isFlatMode && flatRootRef?.current) {
          const current = getFlatSectionEl(flatRootRef.current, id, sectionIndex);
          if (current) {
            const wrap = document.createElement("div");
            wrap.innerHTML = event.data.html.trim();
            const next = wrap.firstElementChild;
            if (next instanceof HTMLElement) current.replaceWith(next);
          }
        }
        setCustomHtml(event.data.html);
        return;
      }

      if (event.data?.type !== "redesign-element-update" || event.data.sectionId !== id) return;
      const { elementId, changes } = event.data;
      if (!elementId || !changes) return;

      const scope = isFlatMode
        ? getFlatSectionEl(flatRootRef?.current ?? null, id, sectionIndex)
        : sectionRef.current;
      const target = scope?.querySelector<HTMLElement>(
        `[data-redesign-element-id="${CSS.escape(elementId)}"]`,
      );
      if (!target) return;

      if (typeof changes.text === "string") {
        // Replace full visible copy (headings often nest spans; don't write into a whitespace text node).
        target.textContent = changes.text;
        target.style.whiteSpace = "pre-wrap";
        target.style.overflowWrap = "anywhere";
        target.style.wordBreak = "break-word";
        target.style.maxWidth = "100%";
      }
      if (typeof changes.fontFamily === "string") target.style.fontFamily = changes.fontFamily;
      if (typeof changes.fontSize === "string") target.style.fontSize = changes.fontSize;
      if (typeof changes.color === "string") target.style.color = changes.color;
      if (changes.textTransform) target.style.textTransform = changes.textTransform;
      applySpacingChanges(target, changes);

      if (target instanceof HTMLImageElement) {
        if (typeof changes.src === "string") target.src = changes.src;
        if (typeof changes.alt === "string") target.alt = changes.alt;
      }

      setCustomHtml(getSectionHtml(true));
      selectSection(elementId);
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // Section identity is stable; DOM helpers intentionally read the live section ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startInlineEditing = (event: React.MouseEvent<HTMLDivElement>) => {
    if (document.documentElement.hasAttribute("data-redesign-view-mode")) return;
    const clicked = event.target as HTMLElement;
    const image = clicked.closest<HTMLImageElement>("img");

    if (image && event.currentTarget.contains(image)) {
      event.preventDefault();
      event.stopPropagation();
      imageTargetRef.current = image;
      setImageEditor({ src: image.getAttribute("src") ?? "", alt: image.alt });
      return;
    }

    const editable = clicked.closest<HTMLElement>(
      "h1, h2, h3, h4, h5, h6, p, span, a, button, li",
    );

    if (!editable || !event.currentTarget.contains(editable)) return;

    event.preventDefault();
    event.stopPropagation();
    editable.setAttribute("contenteditable", "true");
    editable.setAttribute("data-inline-editing", "true");
    editable.setAttribute("spellcheck", "true");
    editable.focus();

    const selection = window.getSelection();
    const pointRange = document.caretRangeFromPoint?.(event.clientX, event.clientY);

    if (pointRange && editable.contains(pointRange.startContainer)) {
      selection?.removeAllRanges();
      selection?.addRange(pointRange);
    } else {
      const range = document.createRange();
      range.selectNodeContents(editable);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };

  const finishInlineEditing = (event: React.FocusEvent<HTMLDivElement>) => {
    const edited = event.target as HTMLElement;
    if (!edited.hasAttribute("data-inline-editing")) return;

    edited.removeAttribute("contenteditable");
    edited.removeAttribute("data-inline-editing");
    edited.removeAttribute("spellcheck");
    setCustomHtml(isFlatMode ? null : getSectionHtml());
    selectSection(edited.dataset.redesignElementId);
  };

  const handleSectionInput = (event: React.FormEvent<HTMLDivElement>) => {
    const edited = event.target as HTMLElement;
    selectSection(edited.dataset.redesignElementId);
  };

  if (isDeleted) return null;

  const showSectionChrome = isFlatMode
    ? isHovered || isSectionHovered || Boolean(textToolbar)
    : false;

  return (
    <div
      ref={sectionRef}
      data-editable-section={id}
      data-redesign-drag-enabled={isDragEnabled ? "true" : undefined}
      onMouseEnter={canReorderSection ? refreshMoveAvailability : undefined}
      className={`group/editable overflow-visible ${
        isFlatMode
          ? `pointer-events-none absolute ${showSectionChrome ? "z-[120]" : "z-[1]"}`
          : "relative"
      } ${
        isFlatMode
          ? textToolbar
            ? "z-[200]"
            : ""
          : textToolbar
            ? "z-[200]"
            : (id === "header" || id === "topbar")
              ? "z-[110] hover:z-[110] focus-within:z-[110]"
              : "z-0 hover:z-[90] focus-within:z-[90]"
      }`}
    >
      <style>{`
        [data-inline-editing="true"] {
          cursor: text !important;
          outline: 2px dotted #2563eb !important;
          outline-offset: 3px;
          border-radius: 2px;
        }
        [data-redesign-element-id] {
          outline: 2px dotted #2563eb !important;
          outline-offset: 3px;
          border-radius: 3px;
        }
        [data-redesign-drag-enabled] [data-editable-section-content] {
          cursor: grab;
          touch-action: none;
        }
        [data-redesign-drag-enabled] img {
          -webkit-user-drag: none;
        }
        [data-redesign-dragging] {
          cursor: grabbing !important;
          opacity: 0.92;
          outline: 2px solid #2563eb !important;
          outline-offset: 3px;
          box-shadow: 0 18px 40px rgba(37, 99, 235, 0.22);
          border-radius: 8px;
        }
        [data-redesign-dragging-active] [data-section-toolbar] {
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden;
        }
        [data-redesign-dragging-active] [data-section-move-controls] {
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden;
        }
        [data-redesign-dragging-active] > [aria-hidden="true"] {
          border-color: transparent !important;
        }
        @media (max-width: 639px) {
          [data-section-toolbar] {
            left: 50% !important;
            right: auto !important;
            width: max-content !important;
            max-width: calc(100% - 16px) !important;
            transform: translateX(-50%) !important;
          }
          [data-section-toolbar] > div {
            width: max-content;
            max-width: 100%;
            flex-wrap: nowrap;
            justify-content: center;
          }
        }
      `}</style>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[70] border-2 border-dotted transition ${
          isFlatMode
            ? showSectionChrome
              ? "border-blue-500"
              : "border-transparent"
            : "border-transparent group-hover/editable:border-blue-500 group-focus-within/editable:border-blue-500"
        }`}
      />

      {customHtml === null && !isFlatMode ? (
        <div
          ref={contentRef}
          data-editable-section-content
          style={sectionMinHeight ? { minHeight: `${sectionMinHeight}px` } : undefined}
          onClickCapture={selectEditableElement}
          onPointerDownCapture={startTextBlockDrag}
          onMouseUpCapture={captureTextSelection}
          onDoubleClickCapture={startInlineEditing}
          onInputCapture={handleSectionInput}
          onBlurCapture={finishInlineEditing}
        >
          {children}
        </div>
      ) : !isFlatMode ? (
        <div
          ref={contentRef}
          data-editable-section-content
          style={sectionMinHeight ? { minHeight: `${sectionMinHeight}px` } : undefined}
          onClickCapture={selectEditableElement}
          onPointerDownCapture={startTextBlockDrag}
          onMouseUpCapture={captureTextSelection}
          onDoubleClickCapture={startInlineEditing}
          onInputCapture={handleSectionInput}
          onBlurCapture={finishInlineEditing}
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      ) : null}

      {textToolbar && (
        <div
          ref={textToolbarRef}
          data-redesign-ui="true"
          data-text-format-toolbar
          className="absolute z-[200] box-border flex w-max max-w-[calc(100vw-16px)] flex-col gap-1.5 overflow-visible rounded-xl bg-[#1b1d21] p-1.5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.35)]"
          style={{ left: 8, top: 8 }}
          onMouseDown={(event) => {
            const target = event.target as HTMLElement;
            if (target.closest("select, input, textarea")) return;
            event.preventDefault();
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <div className="flex w-full flex-wrap items-center gap-1">
          <div className="relative">
            <button
              type="button"
              aria-label="Font family"
              aria-expanded={openTextMenu === "font"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setOpenTextMenu((current) => (current === "font" ? null : "font"))}
              className="flex h-8 max-w-[6.5rem] items-center gap-1 rounded-md border border-white/10 bg-[#111317] px-1.5 text-[11px] outline-none sm:max-w-[8.5rem]"
            >
              <span className="truncate" style={{ fontFamily: textToolbar.fontFamily }}>
                {fontLabel(textToolbar.fontFamily) || "Font"}
              </span>
              <ChevronDown size={12} className="shrink-0 opacity-70" />
            </button>
            {openTextMenu === "font" && (
              <div className="absolute left-0 top-[calc(100%+4px)] z-[210] max-h-48 min-w-[10.5rem] max-w-[calc(100vw-24px)] overflow-auto rounded-lg border border-white/10 bg-[#111317] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                {!TEXT_TOOLBAR_FONTS.includes(textToolbar.fontFamily) && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setOpenTextMenu(null)}
                    className="block w-full bg-blue-500 px-3 py-1.5 text-left text-[11px]"
                    style={{ fontFamily: textToolbar.fontFamily }}
                  >
                    {fontLabel(textToolbar.fontFamily)}
                  </button>
                )}
                {TEXT_TOOLBAR_FONTS.map((font) => (
                  <button
                    key={font}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      applyTextRunStyle({ "font-family": font }, { fontFamily: font });
                      setOpenTextMenu(null);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-[11px] hover:bg-white/10 ${
                      textToolbar.fontFamily === font ? "bg-blue-500 hover:bg-blue-500" : ""
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {fontLabel(font)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              aria-label="Font size"
              aria-expanded={openTextMenu === "size"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setOpenTextMenu((current) => (current === "size" ? null : "size"))}
              className="flex h-8 items-center gap-1 rounded-md border border-white/10 bg-[#111317] px-1.5 text-[11px] outline-none"
            >
              {Math.round(parseFloat(textToolbar.fontSize)) || 16}
              <ChevronDown size={12} className="shrink-0 opacity-70" />
            </button>
            {openTextMenu === "size" && (
              <div className="absolute left-0 top-[calc(100%+4px)] z-[210] max-h-56 min-w-[4.5rem] overflow-auto rounded-lg border border-white/10 bg-[#111317] py-1 shadow-[0_12px_32px_rgba(0,0,0,0.45)]">
                {!TEXT_TOOLBAR_SIZES.includes(Math.round(parseFloat(textToolbar.fontSize))) && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setOpenTextMenu(null)}
                    className="block w-full bg-blue-500 px-3 py-1.5 text-left text-[11px]"
                  >
                    {Math.round(parseFloat(textToolbar.fontSize))}
                  </button>
                )}
                {TEXT_TOOLBAR_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      applyTextRunStyle({ "font-size": `${size}px` }, { fontSize: `${size}px` });
                      setOpenTextMenu(null);
                    }}
                    className={`block w-full px-3 py-1.5 text-left text-[11px] hover:bg-white/10 ${
                      Math.round(parseFloat(textToolbar.fontSize)) === size ? "bg-blue-500 hover:bg-blue-500" : ""
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-[#111317]" title="Text color">
            <input
              type="color"
              value={textToolbar.color}
              onChange={(event) => applyTextRunStyle({ color: event.target.value }, { color: event.target.value })}
              className="h-5 w-5 cursor-pointer rounded-sm border-0 bg-transparent p-0"
            />
          </label>
          <label className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-[#111317]" title="Background color">
            <input
              type="color"
              value={textToolbar.backgroundColor}
              onChange={(event) => applyTextRunStyle({ "background-color": event.target.value }, { backgroundColor: event.target.value })}
              className="h-5 w-5 cursor-pointer rounded-sm border-0 bg-transparent p-0"
            />
          </label>
          <button
            type="button"
            aria-label="Bold"
            onClick={() => applyTextRunStyle({ "font-weight": textToolbar.bold ? "400" : "700" }, { bold: !textToolbar.bold })}
            className={`grid h-8 w-8 place-items-center rounded-md ${textToolbar.bold ? "bg-blue-500" : "bg-[#111317] hover:bg-white/10"}`}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            aria-label="Italic"
            onClick={() => applyTextRunStyle({ "font-style": textToolbar.italic ? "normal" : "italic" }, { italic: !textToolbar.italic })}
            className={`grid h-8 w-8 place-items-center rounded-md ${textToolbar.italic ? "bg-blue-500" : "bg-[#111317] hover:bg-white/10"}`}
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            aria-label="Uppercase"
            onClick={() => applyTextRunStyle({ "text-transform": "uppercase" }, { textTransform: "uppercase" })}
            className={`h-8 rounded-md px-2 text-[11px] font-bold ${textToolbar.textTransform === "uppercase" ? "bg-blue-500" : "bg-[#111317] hover:bg-white/10"}`}
          >
            AA
          </button>
          <button
            type="button"
            aria-label="Lowercase"
            onClick={() => applyTextRunStyle({ "text-transform": "lowercase" }, { textTransform: "lowercase" })}
            className={`h-8 rounded-md px-2 text-[11px] font-bold ${textToolbar.textTransform === "lowercase" ? "bg-blue-500" : "bg-[#111317] hover:bg-white/10"}`}
          >
            aa
          </button>
          </div>
          <div className="flex w-full flex-wrap items-center gap-1 border-t border-white/10 pt-1.5">
            {([
              ["padding-top", "paddingTop", "T"],
              ["padding-right", "paddingRight", "R"],
              ["padding-bottom", "paddingBottom", "B"],
              ["padding-left", "paddingLeft", "L"],
            ] as const).map(([cssName, stateKey, label]) => (
              <label key={cssName} className="flex items-center gap-1 text-[10px] font-semibold text-slate-300">
                {label}
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-label={`Padding ${label}`}
                  value={parseFloat(textToolbar[stateKey]) || 0}
                  onMouseDown={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    const next = `${event.target.value === "" ? 0 : Number(event.target.value)}px`;
                    applyTextRunStyle({ [cssName]: next }, { [stateKey]: next });
                  }}
                  className="h-7 w-11 rounded-md border border-white/10 bg-[#111317] px-1 text-center text-[11px] text-white outline-none"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div
        data-section-toolbar
        style={
          toolbarAlign === "left"
            ? { left: "12px", transform: "translateX(0)" }
            : toolbarAlign === "right"
              ? { left: "calc(100% - 12px)", transform: "translateX(-100%)" }
              : { left: "50%", transform: "translateX(-50%)" }
        }
        className={`pointer-events-none absolute top-0 z-[80] w-max max-w-[calc(100%-16px)] transition-[left,transform,opacity] duration-300 ease-in-out ${
          isFlatMode
            ? showSectionChrome
              ? "pointer-events-auto opacity-100"
              : "opacity-0"
            : "opacity-0 group-hover/editable:pointer-events-auto group-hover/editable:opacity-100"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div
          className={`pointer-events-none flex w-max max-w-full flex-nowrap items-center justify-center gap-1 whitespace-nowrap rounded-b-2xl border border-t-0 border-dotted border-blue-500 bg-white p-1 pl-3 pr-2 text-[11px] text-slate-900 sm:gap-1 sm:text-sm ${
            isFlatMode ? (showSectionChrome ? "pointer-events-auto" : "") : "group-hover/editable:pointer-events-auto"
          }`}
        >
          <button
            type="button"
            aria-label="Move toolbar to the left"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setToolbarAlign((current) => (current === "right" ? "center" : "left"));
            }}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 sm:flex"
            disabled={toolbarAlign === "left"}
          >
            <TripleChevrons direction="left" />
          </button>
          <span className="mr-0.5 whitespace-nowrap font-bold sm:mr-1">{label} :</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              openCodePanel();
            }}
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold transition hover:bg-slate-100 sm:gap-1.5 sm:px-4 sm:py-1.5"
          >
            <Pencil size={14} /> Code
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-1 rounded-full border border-red-200 bg-white px-2.5 py-1 font-semibold text-red-600 transition hover:bg-red-50 sm:gap-1.5 sm:px-4 sm:py-1.5"
          >
            <Trash2 size={14} /> Delete
          </button>
          <div className={`ml-0.5 h-7 items-center gap-1 sm:ml-1 sm:h-8 sm:gap-1.5 ${id === "header" || id === "topbar" ? "hidden sm:flex" : "flex"}`}>
            <span className="hidden font-semibold text-slate-700 min-[360px]:inline">Drag</span>
            <button
              type="button"
              role="switch"
              aria-checked={isDragEnabled}
              aria-label={isDragEnabled ? "Turn drag off" : "Turn drag on"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDragEnabled((current) => !current);
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${isDragEnabled ? "bg-blue-600" : "bg-slate-300"
                }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${isDragEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
              />
            </button>
          </div>
          <button
            type="button"
            aria-label="Move toolbar to the right"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setToolbarAlign((current) => (current === "left" ? "center" : "right"));
            }}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 disabled:opacity-40 sm:flex"
            disabled={toolbarAlign === "right"}
          >
            <TripleChevrons direction="right" />
          </button>
        </div>
      </div>

      {canReorderSection && (
        <div
          data-redesign-ui="true"
          data-section-move-controls
          className={`pointer-events-none absolute bottom-0 left-1/2 z-[85] flex -translate-x-1/2 translate-y-1/2 items-center gap-1.5 rounded-full bg-slate-100 p-1 shadow-[0_6px_18px_rgba(15,23,42,0.12)] transition ${
            isFlatMode
              ? showSectionChrome
                ? "pointer-events-auto opacity-100"
                : "opacity-0"
              : "opacity-0 group-hover/editable:pointer-events-auto group-hover/editable:opacity-100"
          }`}
          onMouseDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Move ${label} section up`}
            disabled={!canMoveUp}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              moveSection("up");
            }}
            className="flex h-9 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
          >
            <MoveTriangle direction="up" />
          </button>
          <button
            type="button"
            aria-label={`Move ${label} section down`}
            disabled={!canMoveDown}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              moveSection("down");
            }}
            className="flex h-9 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
          >
            <MoveTriangle direction="down" />
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[75] h-0 opacity-0 transition group-hover/editable:opacity-100">
        <div
          role="separator"
          aria-label={`Resize ${label} section`}
          onMouseDown={startSectionResize}
          className="pointer-events-auto absolute inset-x-0 top-0 z-0 h-3 -translate-y-1/2 cursor-ns-resize"
        />
      </div>

      {showDeleteDialog && (
        <div role="dialog" aria-modal="true" aria-labelledby={`delete-${id}-title`} className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-sm" onClick={() => setShowDeleteDialog(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={`delete-${id}-title`} className="text-xl font-bold">Delete {label} section?</h2>
                <p className="mt-2 leading-6 text-slate-600">Are you sure you want to delete this section? It will be removed from the website preview.</p>
              </div>
              <button type="button" aria-label="Close confirmation" onClick={() => setShowDeleteDialog(false)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDeleteDialog(false)} className="rounded-lg border border-slate-300 px-4 py-2 font-semibold transition hover:bg-slate-50">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  sendMessage({ type: "redesign-section-deleted", sectionId: id, label });
                  setShowDeleteDialog(false);
                  setIsDeleted(true);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
              >
                Delete section
              </button>
            </div>
          </div>
        </div>
      )}

      {imageEditor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`image-${id}-title`}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/55 p-5 backdrop-blur-sm"
          onClick={() => setImageEditor(null)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 text-slate-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4">
              <h2 id={`image-${id}-title`} className="text-xl font-bold">Update image</h2>
              <button type="button" aria-label="Close image editor" onClick={() => setImageEditor(null)} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageEditor.src} alt={imageEditor.alt || "Image preview"} className="h-48 w-full object-contain" />
            </div>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:bg-slate-100">
              <span className="text-sm font-semibold text-slate-800">Upload image</span>
              <span className="mt-1 text-xs text-slate-500">PNG, JPG, or WEBP</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setImageEditor((current) => current ? { ...current, src: String(reader.result) } : current);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Alt text
              <input
                value={imageEditor.alt}
                onChange={(event) => setImageEditor((current) => current ? { ...current, alt: event.target.value } : current)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none focus:border-blue-500"
                placeholder="Describe this image"
              />
            </label>

            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setImageEditor(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50">Cancel</button>
              <button
                type="button"
                disabled={!imageEditor.src.trim()}
                onClick={() => {
                  const image = imageTargetRef.current;
                  if (!image) return;
                  image.src = imageEditor.src;
                  image.alt = imageEditor.alt;
                  commitSectionChange(image.dataset.redesignElementId);
                  setImageEditor(null);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Update image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
