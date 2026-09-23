"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Ellipsis,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Table2,
  Underline,
  Undo2,
  Unlink,
  X,
} from "lucide-react";

type CustomSectionRichTextEditorProps = {
  open: boolean;
  initialValue: string;
  placeholder?: string;
  onClose: () => void;
  onSave: (html: string) => void;
  overlayClassName?: string;
};

const BLOCK_FORMATS = [
  { label: "Paragraph", value: "p" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
  { label: "Heading 5", value: "h5" },
  { label: "Heading 6", value: "h6" },
  { label: "Preformatted", value: "pre" },
];

const FONT_FAMILIES = [
  "Inter, Helvetica, Arial, sans-serif",
  "Georgia, serif",
  "Times New Roman, Times, serif",
  "Courier New, Courier, monospace",
];

const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "36px",
  "40px",
  "48px",
  "60px",
  "72px",
];

const BLOCK_DEFAULT_FONT_SIZE: Record<string, string> = {
  p: "16px",
  h1: "48px",
  h2: "40px",
  h3: "32px",
  h4: "28px",
  h5: "24px",
  h6: "20px",
  pre: "14px",
};

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const stripHtml = (value: string) =>
  value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const countWords = (value: string) => {
  const text = looksLikeHtml(value) ? stripHtml(value) : value.trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

const toolbarButtonClass =
  "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-slate-600 transition hover:bg-slate-100";

const selectClass =
  "h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none";

export default function CustomSectionRichTextEditor({
  open,
  initialValue,
  placeholder = "Type first layout section details...",
  onClose,
  onSave,
  overlayClassName = "z-[10040]",
}: CustomSectionRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [blockFormat, setBlockFormat] = useState("p");
  const [fontSizeValue, setFontSizeValue] = useState("14px");

  useEffect(() => {
    if (!open || !editorRef.current) return;
    const node = editorRef.current;
    if (looksLikeHtml(initialValue)) {
      node.innerHTML = initialValue;
    } else {
      node.textContent = initialValue || "";
    }
    setWordCount(countWords(node.innerHTML));
    setShowMoreTools(false);
    setBlockFormat("p");
    setFontSizeValue("14px");
    window.requestAnimationFrame(() => {
      node.focus();
      document.execCommand("selectAll", false);
      document.getSelection()?.collapseToEnd();
    });
  }, [initialValue, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  useEffect(() => {
    if (!showMoreTools) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setShowMoreTools(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreTools]);

  const syncWordCount = () => {
    if (!editorRef.current) return;
    setWordCount(countWords(editorRef.current.innerHTML));
  };

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncWordCount();
  };

  const clearInlineFontSizes = (root: HTMLElement) => {
    root.style.removeProperty("font-size");
    root.querySelectorAll<HTMLElement>("*").forEach((el) => {
      el.style.removeProperty("font-size");
      if (el.tagName === "FONT") el.removeAttribute("size");
    });
  };

  const findFormatBlock = (): HTMLElement | null => {
    const selection = window.getSelection();
    if (!selection?.anchorNode || !editorRef.current) return null;
    let node: Node | null = selection.anchorNode;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement) {
        const tag = node.tagName.toLowerCase();
        if (
          tag === "h1" ||
          tag === "h2" ||
          tag === "h3" ||
          tag === "h4" ||
          tag === "h5" ||
          tag === "h6" ||
          tag === "p" ||
          tag === "pre" ||
          tag === "blockquote" ||
          tag === "div"
        ) {
          return node;
        }
      }
      node = node.parentNode;
    }
    return null;
  };

  const applyBlockFormat = (tag: string) => {
    const normalized = tag.toLowerCase();
    editorRef.current?.focus();
    // Browsers are more reliable with angle brackets.
    document.execCommand("formatBlock", false, `<${normalized}>`);
    const block = findFormatBlock();
    if (block) {
      clearInlineFontSizes(block);
      const size = BLOCK_DEFAULT_FONT_SIZE[normalized];
      if (size) {
        block.style.fontSize = size;
        if (normalized.startsWith("h")) {
          block.style.fontWeight = "700";
          block.style.lineHeight = "1.2";
        } else {
          block.style.removeProperty("font-weight");
          block.style.removeProperty("line-height");
        }
        setFontSizeValue(size);
      } else {
        block.style.removeProperty("font-size");
        block.style.removeProperty("font-weight");
        block.style.removeProperty("line-height");
      }
    }
    setBlockFormat(normalized);
    syncWordCount();
  };

  const applyFontFamily = (fontFamily: string) => {
    runCommand("fontName", fontFamily);
  };

  const applyFontSize = (fontSize: string) => {
    runCommand("fontSize", "7");
    editorRef.current
      ?.querySelectorAll("font[size='7']")
      .forEach((node) => {
        (node as HTMLElement).removeAttribute("size");
        (node as HTMLElement).style.fontSize = fontSize;
      });
    setFontSizeValue(fontSize);
    syncWordCount();
  };

  const insertLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url?.trim()) return;
    runCommand("createLink", url.trim());
  };

  const insertImage = () => {
    const url = window.prompt("Enter image URL");
    if (!url?.trim()) return;
    runCommand("insertImage", url.trim());
  };

  const insertTable = () => {
    runCommand(
      "insertHTML",
      "<table><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table>",
    );
  };

  const handleSave = () => {
    const html = editorRef.current?.innerHTML.trim() ?? "";
    const plain = stripHtml(html);
    onSave(plain ? html : "");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-[2px] ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-label="Text editor"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        data-editor-toolbar
        className="flex max-h-[min(88vh,720px)] w-[min(96vw,920px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Text Block
            </p>
            <h3 className="mt-1 text-xl font-bold text-slate-900">Edit text</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close text editor"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative border-b border-slate-200 bg-white px-3 py-2">
          <div className="flex flex-wrap items-center gap-1">
            <button type="button" className={toolbarButtonClass} title="Undo" onClick={() => runCommand("undo")}>
              <Undo2 size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Redo" onClick={() => runCommand("redo")}>
              <Redo2 size={16} />
            </button>

            <span className="mx-1 h-6 w-px bg-slate-200" />

            <select
              value={blockFormat}
              onChange={(event) => applyBlockFormat(event.target.value)}
              className={`${selectClass} min-w-[8.5rem]`}
              aria-label="Text style"
            >
              {BLOCK_FORMATS.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>

            <select
              defaultValue={FONT_FAMILIES[0]}
              onChange={(event) => applyFontFamily(event.target.value)}
              className={`${selectClass} min-w-[8rem]`}
              aria-label="Font family"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font.split(",")[0]}
                </option>
              ))}
            </select>

            <select
              value={fontSizeValue}
              onChange={(event) => applyFontSize(event.target.value)}
              className={`${selectClass} min-w-[5rem]`}
              aria-label="Font size"
            >
              {!FONT_SIZES.includes(fontSizeValue) ? (
                <option value={fontSizeValue}>{fontSizeValue}</option>
              ) : null}
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <span className="mx-1 h-6 w-px bg-slate-200" />

            <button type="button" className={toolbarButtonClass} title="Bold" onClick={() => runCommand("bold")}>
              <Bold size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Italic" onClick={() => runCommand("italic")}>
              <Italic size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Underline" onClick={() => runCommand("underline")}>
              <Underline size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Strikethrough" onClick={() => runCommand("strikeThrough")}>
              <Strikethrough size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Subscript" onClick={() => runCommand("subscript")}>
              <Subscript size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Superscript" onClick={() => runCommand("superscript")}>
              <Superscript size={16} />
            </button>

            <label className={`${toolbarButtonClass} relative cursor-pointer`} title="Text color">
              <span className="text-sm font-bold">A</span>
              <input
                type="color"
                defaultValue="#0f172a"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(event) => runCommand("foreColor", event.target.value)}
              />
            </label>

            <label className={`${toolbarButtonClass} relative cursor-pointer`} title="Highlight color">
              <span className="text-sm font-bold underline decoration-yellow-400 decoration-4 underline-offset-2">
                A
              </span>
              <input
                type="color"
                defaultValue="#fef08a"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(event) => runCommand("hiliteColor", event.target.value)}
              />
            </label>

            <span className="mx-1 h-6 w-px bg-slate-200" />

            <button type="button" className={toolbarButtonClass} title="Align left" onClick={() => runCommand("justifyLeft")}>
              <AlignLeft size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Align center" onClick={() => runCommand("justifyCenter")}>
              <AlignCenter size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Align right" onClick={() => runCommand("justifyRight")}>
              <AlignRight size={16} />
            </button>
            <button type="button" className={toolbarButtonClass} title="Justify" onClick={() => runCommand("justifyFull")}>
              <AlignJustify size={16} />
            </button>

            <span className="mx-1 h-6 w-px bg-slate-200" />

            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                className={`${toolbarButtonClass} ${showMoreTools ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : ""}`}
                title="More insert options"
                aria-label="More insert options"
                aria-expanded={showMoreTools}
                onClick={() => setShowMoreTools((current) => !current)}
              >
                <Ellipsis size={18} />
              </button>

              {showMoreTools && (
                <div className="absolute right-0 top-full z-20 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <div className="flex flex-wrap items-center gap-1">
                    <button type="button" className={toolbarButtonClass} title="Bullet list" onClick={() => runCommand("insertUnorderedList")}>
                      <List size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Numbered list" onClick={() => runCommand("insertOrderedList")}>
                      <ListOrdered size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Decrease indent" onClick={() => runCommand("outdent")}>
                      <IndentDecrease size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Increase indent" onClick={() => runCommand("indent")}>
                      <IndentIncrease size={16} />
                    </button>

                    <span className="mx-1 h-6 w-px bg-slate-200" />

                    <button type="button" className={toolbarButtonClass} title="Insert link" onClick={insertLink}>
                      <Link2 size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Remove link" onClick={() => runCommand("unlink")}>
                      <Unlink size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Insert image" onClick={insertImage}>
                      <ImageIcon size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Insert table" onClick={insertTable}>
                      <Table2 size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Blockquote" onClick={() => runCommand("formatBlock", "blockquote")}>
                      <Quote size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Horizontal line" onClick={() => runCommand("insertHorizontalRule")}>
                      <Minus size={16} />
                    </button>
                    <button type="button" className={toolbarButtonClass} title="Clear formatting" onClick={() => runCommand("removeFormat")}>
                      <RemoveFormatting size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white p-4">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={syncWordCount}
            data-placeholder={placeholder}
            className="custom-section-rich-text min-h-[280px] rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-[#f8fafc] px-4 py-2 text-xs text-slate-500">
          <span>Press Alt+0 for help</span>
          <span>{wordCount} words</span>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Save text
          </button>
        </div>
      </div>

      <style>{`
        .custom-section-rich-text {
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .custom-section-rich-text:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .custom-section-rich-text h1 {
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1.25;
          margin: 1.25em 0 0.5em;
        }
        .custom-section-rich-text h2 {
          font-size: 1.4rem;
          font-weight: 700;
          line-height: 1.3;
          margin: 1.4em 0 0.5em;
        }
        .custom-section-rich-text h3 {
          font-size: 1.2rem;
          font-weight: 700;
          line-height: 1.35;
          margin: 1.25em 0 0.45em;
        }
        .custom-section-rich-text h4 {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.4;
          margin: 1.1em 0 0.4em;
        }
        .custom-section-rich-text h5 {
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.4;
          margin: 1em 0 0.35em;
        }
        .custom-section-rich-text h6 {
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.4;
          margin: 1em 0 0.35em;
        }
        .custom-section-rich-text p {
          font-size: 16px;
          margin: 0.4em 0;
        }
        .custom-section-rich-text ul {
          list-style: disc;
          padding-left: 1.25rem;
        }
        .custom-section-rich-text ol {
          list-style: decimal;
          padding-left: 1.25rem;
        }
        .custom-section-rich-text blockquote {
          border-left: 3px solid #cbd5e1;
          margin: 0.75rem 0;
          padding-left: 0.875rem;
          color: #475569;
        }
        .custom-section-rich-text pre {
          background: #f8fafc;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
        .custom-section-rich-text table {
          border-collapse: collapse;
          width: 100%;
        }
        .custom-section-rich-text td,
        .custom-section-rich-text th {
          border: 1px solid #cbd5e1;
          padding: 0.5rem;
        }
      `}</style>
    </div>
  );
}
