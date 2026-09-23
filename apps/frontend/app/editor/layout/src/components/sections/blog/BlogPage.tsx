import type { SectionProps } from "../../../types/section";
import BlogDetailArticle from "./BlogDetailArticle";

export default function BlogPage({ data }: SectionProps) {
  const safeData = data ?? {};
  const title =
    typeof safeData.title === "string" ? safeData.title : "New blog post";
  const excerpt =
    typeof safeData.excerpt === "string"
      ? safeData.excerpt
      : "Add a short introduction for this article.";
  const content =
    typeof safeData.content === "string"
      ? safeData.content
      : "Write the full blog content here. You can edit this text from the section editor.";
  const image =
    typeof safeData.image === "string" ? safeData.image : "/bg1.jpg";
  const author =
    typeof safeData.author === "string" ? safeData.author.trim() : "";
  const category =
    typeof safeData.category === "string" ? safeData.category.trim() : "";
  const layout =
    typeof safeData.layout === "string" ? safeData.layout : "BlogPage-1";

  return (
    <BlogDetailArticle
      post={{
        title,
        author,
        category,
        excerpt,
        content,
        image,
        layout,
      }}
    />
  );
}
