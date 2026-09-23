import type { SliderBlock as SliderBlockData } from "../types/section";
import BlockRenderer from "./BlockRenderer";

type SliderBlockProps = {
  block: SliderBlockData;
};

export default function SliderBlock({ block }: SliderBlockProps) {
  return (
    <div>
      {block.items.map((item) => (
        <BlockRenderer key={item.id} block={item} />
      ))}
    </div>
  );
}
