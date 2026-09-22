import type { Prisma } from "@/generated/prisma/client";
import type { CommentListItem } from "@/lib/comments";

export const FEED_PAGE_SIZE = 20;

export type CommentListView = "all" | "mine";

export type CommentListQuery = {
  videoId?: string;
  photoId?: string;
  page?: number;
  pageSize?: number;
  viewerId?: string | null;
  view?: CommentListView;
  order?: "asc" | "desc";
};

export type CommentListResult = {
  items: CommentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const commentIncludeForListItem = {
  user: { select: { id: true, name: true, image: true } },
  video: { select: { id: true, title: true, thumbnailUrl: true } },
  photo: {
    select: {
      id: true,
      title: true,
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { fileAsset: { select: { url: true } } },
      },
      hikes: {
        orderBy: [{ assignedAt: "desc" }, { hikeId: "desc" }],
        take: 1,
        select: { hike: { select: { slug: true } } },
      },
    },
  },
} satisfies Prisma.CommentInclude;

type CommentWithRelations = Prisma.CommentGetPayload<{
  include: typeof commentIncludeForListItem;
}>;

const toCommentListItem = (comment: CommentWithRelations): CommentListItem | null => {
  if (comment.videoId && comment.video) {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.user.id,
        displayName: comment.user.name,
        image: comment.user.image,
      },
      target: {
        type: "video",
        title: comment.video.title,
        href: `/videos/${comment.video.id}`,
        previewImageUrl: comment.video.thumbnailUrl,
      },
    };
  }

  if (comment.photoId && comment.photo) {
    const slug = comment.photo.hikes[0]?.hike.slug;

    if (!slug) return null;

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      author: {
        id: comment.user.id,
        displayName: comment.user.name,
        image: comment.user.image,
      },
      target: {
        type: "photo",
        title: comment.photo.title,
        href: `/trips/${slug}`,
        previewImageUrl: comment.photo.images[0]?.fileAsset.url ?? null,
      },
    };
  }

  return null;
};

export const getCommentListItems = async (query: CommentListQuery = {}): Promise<CommentListResult> => {
  const { default: prisma } = await import("@/lib/prisma");

  const order = query.order ?? "asc";

  const targetFilter: Prisma.CommentWhereInput = query.videoId
    ? { videoId: query.videoId }
    : query.photoId
      ? { photoId: query.photoId }
      : { OR: [{ videoId: { not: null } }, { photoId: { not: null } }] };

  const where: Prisma.CommentWhereInput = {
    ...targetFilter,
    ...(query.viewerId && query.view === "mine" ? { userId: query.viewerId } : {}),
  };

  const comments = await prisma.comment.findMany({
    where,
    include: commentIncludeForListItem,
    orderBy: { createdAt: order },
  });

  const items: CommentListItem[] = [];

  for (const comment of comments) {
    const item = toCommentListItem(comment);

    if (item) items.push(item);
  }

  const total = items.length;
  const page = Math.max(1, query.page ?? 1);
  const requestedPageSize = query.pageSize ?? (query.page !== undefined ? FEED_PAGE_SIZE : Math.max(total, 1));
  const pageSize = Math.max(1, requestedPageSize);
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  return { items: pageItems, total, page, pageSize, totalPages };
};
