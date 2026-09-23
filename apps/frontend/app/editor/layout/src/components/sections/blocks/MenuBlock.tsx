import Link from "next/link";
import type { MenuBlock as MenuBlockData } from "../types/section";

type MenuBlockProps = {
  block: MenuBlockData;
  className?: string;
  linkClassName?: string;
};

export default function MenuBlock({
  block,
  className,
  linkClassName,
}: MenuBlockProps) {
  return (
    <nav className={className}>
      {block.items.map((item, index) => {
        const formatKey = `block:${block.id}:item:${index}:label`;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={linkClassName}
            data-editor-inline-format-key={formatKey}
            data-editor-inline-plain-text="true"
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
