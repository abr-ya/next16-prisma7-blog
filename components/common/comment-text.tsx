import { getCommentTextSegments } from "@/lib/comment-text-segments";

type CommentTextProps = {
  value: string;
  className?: string;
};

export const CommentText = ({ value, className }: CommentTextProps) => {
  const segments = getCommentTextSegments(value);

  return (
    <p className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "link") {
          return (
            <a
              key={`${segment.href}-${index}`}
              href={segment.href}
              target="_blank"
              rel="nofollow ugc noopener noreferrer"
              className="break-all font-medium text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {segment.text}
            </a>
          );
        }

        return <span key={`${segment.text}-${index}`}>{segment.text}</span>;
      })}
    </p>
  );
};
