import { BlogPost } from "@/generated/prisma/client";

interface IPostArticleProps {
  data: BlogPost;
}

export const PostArticle = ({ data: { createdAt, content } }: IPostArticleProps) => (
  <article className="max-w-3xl mx-auto">
    <p className="text-muted-foreground mb-2">{new Date(createdAt).toLocaleDateString()}</p>

    <div className="prose prose-neutral dark:prose-invert max-w-none">todo: render post content here</div>
    <div>{content}</div>
  </article>
);
