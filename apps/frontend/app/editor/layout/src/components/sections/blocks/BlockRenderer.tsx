import type { Block } from "../types/section";
import TextBlock from "./TextBlock";
import ImageBlock from "./ImageBlock";
import VideoBlock from "./VideoBlock";
import ButtonBlock from "./ButtonBlock";
import SliderBlock from "./SliderBlock";
import CarouselBlock from "./CarouselBlock";
import CardBlock from "./CardBlock";
import ListBlock from "./ListBlock";
import MenuBlock from "./MenuBlock";
import LogoBlock from "./LogoBlock";

type BlockRendererProps = {
  block?: Block;
  className?: string;
  linkClassName?: string;
};

export default function BlockRenderer({
  block,
  className,
  linkClassName,
}: BlockRendererProps) {
  if (!block) return null;

  switch (block.type) {
    case "text":
      return <TextBlock block={block} className={className} />;
    case "image":
      return <ImageBlock block={block} className={className} />;
    case "video":
      return <VideoBlock block={block} className={className} />;
    case "button":
      return <ButtonBlock block={block} className={className} />;
    case "slider":
      return <SliderBlock block={block} />;
    case "carousel":
      return <CarouselBlock block={block} />;
    case "card":
      return <CardBlock block={block} className={className} />;
    case "list":
      return <ListBlock block={block} className={className} />;
    case "menu":
      return (
        <MenuBlock
          block={block}
          className={className}
          linkClassName={linkClassName}
        />
      );
    case "logo":
      return <LogoBlock block={block} className={className} />;
    default:
      return null;
  }
}
