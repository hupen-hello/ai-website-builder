import type { ListBlock as ListBlockData } from "../types/section";
import InlineRichText from "../../builder/InlineRichText";

type ListBlockProps = {
  block: ListBlockData;
  className?: string;
};

export default function ListBlock({ block, className }: ListBlockProps) {
  const formatKey = (field: string) => `block:${block.id}:${field}`;

  return (
    <div className={className}>
      {block.title && (
        <h3 data-editor-inline-format-key={formatKey("title")}>
          <InlineRichText
            value={block.title}
            formatKey={formatKey("title")}
          />
        </h3>
      )}
      <ul>
        {block.items.map((item, index) => {
          const value = typeof item === "string" ? item : item.label;
          const itemFormatKey = formatKey(`item:${index}`);

          return (
            <li
              key={index}
              data-editor-inline-format-key={itemFormatKey}
            >
              <InlineRichText value={value} formatKey={itemFormatKey} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
