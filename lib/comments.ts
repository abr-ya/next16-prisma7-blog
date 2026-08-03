export type CommentTargetType = "video" | "post" | "md-doc";

export type CommentListItem = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    displayName: string | null;
    image: string | null;
  };
  target: {
    type: CommentTargetType;
    title: string;
    href: string;
    previewImageUrl: string | null;
  };
};
