/**
 * Create-with-AI HTML → Next.js React components (export-only).
 * Does not change studio/chat HTML generation.
 */

export type SplitPart = {
  /** PascalCase component name */
  name: string;
  /** Original section/block id if any */
  id: string;
  html: string;
};

export type SplitHtmlResult = {
  css: string;
  fontLinks: string[];
  scripts: string[];
  title: string;
  parts: SplitPart[];
};

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const ID_TO_NAME: Record<string, string> = {
  home: "Hero",
  hero: "Hero",
  about: "About",
  services: "Services",
  gallery: "Gallery",
  testimonials: "Testimonials",
  contact: "Contact",
  process: "Process",
  pricing: "Pricing",
  faq: "Faq",
  team: "Team",
  footer: "Footer",
  header: "Header",
};

function pascalCase(raw: string) {
  const base = (raw || "Section")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  if (!base) return "Section";
  if (/^[0-9]/.test(base)) return `Section${base}`;
  return base;
}

function uniqueName(preferred: string, used: Set<string>) {
  let name = preferred;
  let i = 2;
  while (used.has(name)) {
    name = `${preferred}${i}`;
    i += 1;
  }
  used.add(name);
  return name;
}

function nameForBlock(tag: string, id: string, used: Set<string>) {
  const key = (id || "").toLowerCase();
  if (tag === "header") return uniqueName("Header", used);
  if (tag === "footer") return uniqueName("Footer", used);
  if (ID_TO_NAME[key]) return uniqueName(ID_TO_NAME[key], used);
  if (key) return uniqueName(pascalCase(key), used);
  return uniqueName(pascalCase(tag), used);
}

function cssPropToCamel(prop: string) {
  const p = prop.trim();
  if (p.startsWith("--")) return p;
  return p.replace(/-([a-z])/gi, (_, c: string) => c.toUpperCase());
}

function styleStringToJsxObject(style: string) {
  const entries: string[] = [];
  for (const chunk of style.split(";")) {
    const part = chunk.trim();
    if (!part) continue;
    const colon = part.indexOf(":");
    if (colon < 0) continue;
    const prop = part.slice(0, colon).trim();
    const val = part.slice(colon + 1).trim();
    if (!prop || !val) continue;
    const key = cssPropToCamel(prop);
    const keyCode = key.startsWith("--") ? JSON.stringify(key) : key;
    entries.push(`${keyCode}: ${JSON.stringify(val)}`);
  }
  return `{{ ${entries.join(", ")} }}`;
}

function attrNameToJsx(name: string) {
  const n = name.trim();
  if (n === "class") return "className";
  if (n === "for") return "htmlFor";
  if (n === "tabindex") return "tabIndex";
  if (n === "readonly") return "readOnly";
  if (n === "maxlength") return "maxLength";
  if (n === "minlength") return "minLength";
  if (n === "cellpadding") return "cellPadding";
  if (n === "cellspacing") return "cellSpacing";
  if (n === "colspan") return "colSpan";
  if (n === "rowspan") return "rowSpan";
  if (n === "usemap") return "useMap";
  if (n === "frameborder") return "frameBorder";
  if (n === "allowfullscreen") return "allowFullScreen";
  if (n.startsWith("data-") || n.startsWith("aria-")) return n;
  if (n.includes("-")) {
    return n.replace(/-([a-z])/gi, (_, c: string) => c.toUpperCase());
  }
  return n;
}

function convertOpenTag(tagHtml: string) {
  const match = tagHtml.match(/^<\/?([a-zA-Z0-9:-]+)([^>]*)\/?>$/);
  if (!match) return tagHtml;
  if (tagHtml.startsWith("</")) return tagHtml;
  const tag = match[1].toLowerCase();
  let attrs = match[2] || "";
  const selfClosing = tagHtml.endsWith("/>") || VOID_TAGS.has(tag);

  attrs = attrs.replace(
    /([^\s=/>]+)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"'=]+)))?/gi,
    (
      _full,
      rawName: string,
      eq?: string,
      dq?: string,
      sq?: string,
      bare?: string,
    ) => {
      const name = String(rawName);
      if (!eq) {
        return ` ${attrNameToJsx(name)}`;
      }
      const value = dq ?? sq ?? bare ?? "";
      const jsxName = attrNameToJsx(name);
      if (jsxName === "style") {
        return ` style=${styleStringToJsxObject(value)}`;
      }
      return ` ${jsxName}=${JSON.stringify(value)}`;
    },
  );
  attrs = attrs.replace(/^\s+/, " ").replace(/\s{2,}/g, " ");

  if (selfClosing) return `<${tag}${attrs} />`;
  return `<${tag}${attrs}>`;
}

/** Convert an HTML fragment into JSX markup string (no component wrapper). */
export function htmlFragmentToJsx(html: string): string {
  if (!html) return "";
  const input = html.replace(/<!--[\s\S]*?-->/g, "");
  const tokens = input.split(/(<[^>]+>)/g).filter((t) => t.length > 0);
  const out: string[] = [];
  for (const token of tokens) {
    if (token.startsWith("<")) {
      if (token.startsWith("</")) {
        const m = token.match(/^<\/\s*([a-zA-Z0-9:-]+)\s*>/);
        out.push(m ? `</${m[1].toLowerCase()}>` : token);
      } else if (token.startsWith("<!")) {
        continue;
      } else {
        out.push(convertOpenTag(token));
      }
    } else {
      out.push(
        token.replace(/\{/g, "{'{'}" ).replace(/\}/g, "{'}'}"),
      );
    }
  }
  return out.join("");
}

/**
 * Split a full Create-AI HTML document into CSS + ordered React-ready parts.
 */
export function splitCreateAiHtmlDocument(fullHtml: string): SplitHtmlResult {
  let html = fullHtml || "";
  const title =
    html
      .match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
      ?.replace(/<[^>]+>/g, "")
      .trim() || "";

  const fontLinks: string[] = [];
  html = html.replace(
    /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi,
    (tag) => {
      const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1] || "";
      if (
        /fonts\.googleapis|fonts\.gstatic|font/i.test(href) ||
        /fonts\.googleapis|fonts\.gstatic|font/i.test(tag)
      ) {
        fontLinks.push(tag);
      }
      return "";
    },
  );

  const cssParts: string[] = [];
  html = html.replace(
    /<style\b[^>]*>([\s\S]*?)<\/style>/gi,
    (_m, css: string) => {
      cssParts.push(css.trim());
      return "";
    },
  );

  const scripts: string[] = [];
  html = html.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (_m, attrs: string, body: string) => {
      if (/\bsrc\s*=/i.test(attrs)) return "";
      const code = String(body || "").trim();
      if (code) scripts.push(code);
      return "";
    },
  );

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  let body = bodyMatch ? bodyMatch[1] : html;
  body = body.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");

  const used = new Set<string>();
  const parts: SplitPart[] = [];

  const pushPart = (tag: string, id: string, block: string) => {
    const trimmed = block.trim();
    if (!trimmed) return;
    // Ignore whitespace-only / tiny separators between sections
    if (tag === "div" && trimmed.replace(/[\s\n\r\t]+/g, "").length < 40) {
      return;
    }
    parts.push({
      name: nameForBlock(tag, id, used),
      id: id || tag,
      html: trimmed,
    });
  };

  let remaining = body.trim();
  const blockRe =
    /<(header|footer|section|main|aside)(\s[^>]*)?>[\s\S]*?<\/\1>/i;

  while (remaining) {
    remaining = remaining.trim();
    if (!remaining) break;

    const m = remaining.match(blockRe);
    if (!m || m.index === undefined) {
      const leftover = remaining.trim();
      if (leftover) pushPart("div", "extras", leftover);
      break;
    }

    if (m.index > 0) {
      const before = remaining.slice(0, m.index).trim();
      if (before) pushPart("div", "extras", before);
    }

    const block = m[0];
    const tag = m[1].toLowerCase();
    const openAttrs = m[2] || "";
    const id = openAttrs.match(/\bid=["']([^"']+)["']/i)?.[1] || "";

    if (tag === "main") {
      const inner = block
        .replace(/^<main\b[^>]*>/i, "")
        .replace(/<\/main>$/i, "");
      remaining = inner + remaining.slice(m.index + block.length);
      continue;
    }

    pushPart(tag, id, block);
    remaining = remaining.slice(m.index + block.length);
  }

  const merged: SplitPart[] = [];
  for (const part of parts) {
    const prev = merged[merged.length - 1];
    if (prev && /^Extras/i.test(prev.name) && /^Extras/i.test(part.name)) {
      prev.html += "\n" + part.html;
    } else {
      merged.push(part);
    }
  }

  return {
    css: cssParts.filter(Boolean).join("\n\n"),
    fontLinks,
    scripts,
    title,
    parts: merged,
  };
}

export function buildComponentTsx(name: string, html: string) {
  const jsx = htmlFragmentToJsx(html);
  return `export default function ${name}() {
  return (
    <>
${jsx
  .split("\n")
  .map((l) => (l ? `      ${l}` : ""))
  .join("\n")}
    </>
  );
}
`;
}

export function buildSiteScriptsTsx(scripts: string[]) {
  if (!scripts.length) {
    return `"use client";

export default function SiteScripts() {
  return null;
}
`;
  }
  const payload = JSON.stringify(scripts);
  return `"use client";

import { useEffect } from "react";

const SCRIPTS: string[] = ${payload};

export default function SiteScripts() {
  useEffect(() => {
    const nodes: HTMLScriptElement[] = [];
    for (const code of SCRIPTS) {
      const el = document.createElement("script");
      el.type = "text/javascript";
      el.text = code;
      document.body.appendChild(el);
      nodes.push(el);
    }
    return () => {
      for (const el of nodes) el.remove();
    };
  }, []);
  return null;
}
`;
}

export function buildPageTsx(opts: {
  componentNames: string[];
  includeScripts: boolean;
}) {
  const imports = opts.componentNames
    .map((n) => `import ${n} from "@/components/${n}";`)
    .join("\n");
  const scriptImport = opts.includeScripts
    ? `import SiteScripts from "@/components/SiteScripts";\n`
    : "";
  const body = [
    ...opts.componentNames.map((n) => `      <${n} />`),
    ...(opts.includeScripts ? [`      <SiteScripts />`] : []),
  ].join("\n");

  return `${imports}
${scriptImport}
export default function Page() {
  return (
    <>
${body}
    </>
  );
}
`;
}
