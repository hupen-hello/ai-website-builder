"use client";

import {
  createContext,
  createElement,
  Fragment,
  ReactNode,
  useContext,
} from "react";
import type { CSSProperties } from "react";
import type { InlineTextFormat } from "../../lib/inlineTextFormatting";

export type InlineFormatRegistry = {
  formats: InlineTextFormat[];
};

const InlineFormattingContext = createContext<InlineFormatRegistry | null>(
  null,
);

export const createInlineFormatRegistry = (
  formats: InlineTextFormat[],
): InlineFormatRegistry => ({ formats });

export const getUnconsumedInlineTextFormats = (
  registry: InlineFormatRegistry,
) =>
  // Keyed formats are rendered by InlineRichText (React-owned). Only legacy
  // keyless formats still need the temporary DOM decoration pass.
  registry.formats.filter((format) => !format.key);

export function InlineTextFormattingProvider({
  children,
  registry,
}: {
  children: ReactNode;
  registry: InlineFormatRegistry;
}) {
  return (
    <InlineFormattingContext.Provider value={registry}>
      {children}
    </InlineFormattingContext.Provider>
  );
}

type ParsedInlineNode = {
  tag: string | null;
  children: ParsedInlineNode[];
  text?: string;
  href?: string;
  style?: CSSProperties;
};

const allowedTags = new Set([
  "a",
  "b",
  "br",
  "div",
  "em",
  "i",
  "li",
  "ol",
  "p",
  "s",
  "span",
  "strike",
  "strong",
  "u",
  "ul",
]);

const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: "\u00a0",
  quot: '"',
};

const decodeHtmlEntities = (value: string) =>
  value.replace(
    /&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi,
    (entity, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) {
        const point = Number.parseInt(code.slice(2), 16);
        return Number.isFinite(point) && point <= 0x10ffff
          ? String.fromCodePoint(point)
          : entity;
      }

      if (code.startsWith("#")) {
        const point = Number.parseInt(code.slice(1), 10);
        return Number.isFinite(point) && point <= 0x10ffff
          ? String.fromCodePoint(point)
          : entity;
      }

      return namedEntities[code.toLowerCase()] ?? entity;
    },
  );

const normalizeInlineText = (value: string) =>
  value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const readAttribute = (source: string, name: string) => {
  const match = source.match(
    new RegExp(
      `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
      "i",
    ),
  );

  return decodeHtmlEntities(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
};

const isSafeLink = (href: string) => {
  const normalizedHref = href.trim().replace(/\s+/g, "");
  const hasExplicitProtocol = /^[a-z][a-z\d+.-]*:/i.test(normalizedHref);

  return Boolean(
    normalizedHref &&
      (normalizedHref.startsWith("#") ||
        normalizedHref.startsWith("/") ||
        /^(https?:|mailto:|tel:)/i.test(normalizedHref) ||
        !hasExplicitProtocol),
  );
};

const parseSafeStyle = (source: string): CSSProperties | undefined => {
  const styleSource = readAttribute(source, "style");
  if (!styleSource) return undefined;

  const style: CSSProperties = {};

  styleSource.split(";").forEach((declaration) => {
    const separator = declaration.indexOf(":");
    if (separator === -1) return;

    const property = declaration.slice(0, separator).trim().toLowerCase();
    const value = declaration.slice(separator + 1).trim();
    if (!value || /[{}]|url\s*\(/i.test(value)) return;

    if (
      property === "color" &&
      /^(?:#[\da-f]{3,8}|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\)|[a-z]+)$/i.test(
        value,
      )
    ) {
      style.color = value;
    }

    if (
      property === "font-size" &&
      /^\d+(?:\.\d+)?(?:px|em|rem|%)$/i.test(value)
    ) {
      style.fontSize = value;
    }

    if (
      property === "font-style" &&
      /^(?:normal|italic|oblique)$/i.test(value)
    ) {
      style.fontStyle = value as CSSProperties["fontStyle"];
    }

    if (
      property === "font-weight" &&
      /^(?:normal|bold|bolder|lighter|[1-9]00)$/i.test(value)
    ) {
      style.fontWeight = value as CSSProperties["fontWeight"];
    }

    if (
      (property === "text-decoration" ||
        property === "text-decoration-line") &&
      /^(?:(?:none|underline|overline|line-through)\s*)+$/i.test(value)
    ) {
      if (property === "text-decoration") style.textDecoration = value;
      if (property === "text-decoration-line") {
        style.textDecorationLine =
          value as CSSProperties["textDecorationLine"];
      }
    }
  });

  return Object.keys(style).length ? style : undefined;
};

const parseInlineHtml = (html: string) => {
  const root: ParsedInlineNode = { tag: null, children: [] };
  const stack = [root];
  const tokenPattern = /<\s*(\/?)\s*([a-z][\w-]*)([^<>]*)>|([^<]+)/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;

  const appendText = (value: string) => {
    if (!value) return;
    stack.at(-1)?.children.push({
      tag: null,
      children: [],
      text: decodeHtmlEntities(value),
    });
  };

  while ((match = tokenPattern.exec(html))) {
    if (match.index > cursor) appendText(html.slice(cursor, match.index));
    cursor = tokenPattern.lastIndex;

    if (match[4]) {
      appendText(match[4]);
      continue;
    }

    const isClosing = Boolean(match[1]);
    const tag = match[2].toLowerCase();
    const attributes = match[3] ?? "";

    if (!allowedTags.has(tag)) continue;

    if (isClosing) {
      let matchingIndex = -1;
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].tag === tag) {
          matchingIndex = index;
          break;
        }
      }
      if (matchingIndex > 0) stack.length = matchingIndex;
      continue;
    }

    const href = tag === "a" ? readAttribute(attributes, "href") : "";
    const style = parseSafeStyle(attributes);
    const node: ParsedInlineNode = {
      tag,
      children: [],
      ...(href && isSafeLink(href) ? { href } : {}),
      ...(style ? { style } : {}),
    };
    stack.at(-1)?.children.push(node);

    if (tag !== "br" && !attributes.trim().endsWith("/")) stack.push(node);
  }

  if (cursor < html.length) appendText(html.slice(cursor));

  const collapseNestedSpans = (
    nodes: ParsedInlineNode[],
  ): ParsedInlineNode[] =>
    nodes.map((node) => {
      node.children = collapseNestedSpans(node.children);

      while (
        node.tag === "span" &&
        node.children.length === 1 &&
        node.children[0].tag === "span"
      ) {
        const child = node.children[0];
        node.style = { ...node.style, ...child.style };
        node.children = child.children;
      }

      return node;
    });

  return collapseNestedSpans(root.children);
};

const getParsedText = (nodes: ParsedInlineNode[]): string =>
  nodes
    .map((node) =>
      node.tag === null
        ? (node.text ?? "")
        : node.tag === "br"
          ? "\n"
          : getParsedText(node.children),
    )
    .join("");

const renderParsedNodes = (
  nodes: ParsedInlineNode[],
  path = "inline",
): ReactNode[] =>
  nodes.map((node, index) => {
    const key = `${path}-${index}`;
    if (node.tag === null) return node.text ?? "";

    // Rich text is placed inside headings, paragraphs, links and other inline
    // hosts. Rendering saved block tags there would let the browser repair the
    // HTML differently from React and cause hydration mismatches. Span-based
    // equivalents preserve line/list layout while keeping the markup valid.
    const isBlockLine = node.tag === "div" || node.tag === "p";
    const isList = node.tag === "ol" || node.tag === "ul";
    const isListItem = node.tag === "li";
    const renderedTag =
      isBlockLine || isList || isListItem ? "span" : node.tag;
    const structuralStyle: CSSProperties | undefined = isBlockLine
      ? { display: "block" }
      : isList
        ? {
            display: "block",
            listStyleType: node.tag === "ol" ? "decimal" : "disc",
            paddingInlineStart: "1.5em",
          }
        : isListItem
          ? { display: "list-item" }
          : undefined;

    return createElement(
      renderedTag,
      {
        key,
        ...(node.href ? { href: node.href } : {}),
        ...(structuralStyle || node.style
          ? { style: { ...structuralStyle, ...node.style } }
          : {}),
      },
      ...renderParsedNodes(node.children, key),
    );
  });

export default function InlineRichText({
  value,
  formatKey,
  legacyOccurrence = 0,
}: {
  value: string;
  formatKey: string;
  legacyOccurrence?: number;
}) {
  const registry = useContext(InlineFormattingContext);

  if (!registry) return value;

  const normalizedValue = normalizeInlineText(value);

  const keyedFormat = registry.formats.find(
    (format) => format.key === formatKey,
  );
  const legacyFormat = registry.formats.find(
    (format) =>
      !format.key &&
      format.occurrence === legacyOccurrence &&
      normalizeInlineText(format.text) === normalizedValue,
  );
  const format = keyedFormat ?? legacyFormat;

  if (!format) return value;

  const parsedNodes = parseInlineHtml(format.html);
  if (
    normalizeInlineText(getParsedText(parsedNodes)) !==
    normalizeInlineText(value)
  ) {
    return value;
  }

  return <Fragment>{renderParsedNodes(parsedNodes, formatKey)}</Fragment>;
}
