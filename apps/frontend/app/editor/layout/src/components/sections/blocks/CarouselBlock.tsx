"use client";

import { useState } from "react";
import type { CarouselBlock as CarouselBlockData } from "../types/section";
import BlockRenderer from "./BlockRenderer";

type CarouselBlockProps = {
  block: CarouselBlockData;
};

export default function CarouselBlock({ block }: CarouselBlockProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBlock = block.items[activeIndex];

  if (!activeBlock) return null;

  return (
    <div>
      <BlockRenderer block={activeBlock} />
      <div className="mt-4 flex gap-2">
        {block.items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`h-2 w-6 rounded-full ${
              index === activeIndex ? "theme-dot-active" : "bg-gray-300"
            }`}
            aria-label={`Show item ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
