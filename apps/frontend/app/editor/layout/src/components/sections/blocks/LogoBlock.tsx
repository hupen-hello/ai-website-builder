import Link from "next/link";
import type { LogoBlock as LogoBlockData } from "../types/section";
import InlineRichText from "../../builder/InlineRichText";

type LogoBlockProps = {
  block: LogoBlockData;
  className?: string;
};

export default function LogoBlock({ block, className }: LogoBlockProps) {
  const formatKey = `block:${block.id}:text`;

  return (
    <Link
      href={block.href}
      className={className}
      data-editor-inline-format-key={formatKey}
    >
      <InlineRichText value={block.text} formatKey={formatKey} />
    </Link>
  );
}
