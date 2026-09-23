import type { TextBlock as TextBlockData } from "../types/section";
import InlineRichText from "../../builder/InlineRichText";

type TextBlockProps = {
  block: TextBlockData;
  className?: string;
};

export default function TextBlock({ block, className }: TextBlockProps) {
  const formatKey = `block:${block.id}:content`;

  if (block.role === "heading") {
    return (
      <h1 className={className} data-editor-inline-format-key={formatKey}>
        <InlineRichText value={block.content} formatKey={formatKey} />
      </h1>
    );
  }

  if (block.role === "subheading" || block.role === "pretitle") {
    return (
      <p className={className} data-editor-inline-format-key={formatKey}>
        <InlineRichText value={block.content} formatKey={formatKey} />
      </p>
    );
  }

  return (
    <p className={className} data-editor-inline-format-key={formatKey}>
      <InlineRichText value={block.content} formatKey={formatKey} />
    </p>
  );
}
