import type { Metadata } from "next";

const LOCAL_SITE_URL = "http://localhost:3000";

export const SITE_NAME = "Blog | Next 16";
export const DEFAULT_SITE_DESCRIPTION = "Blog with different themes with Next.js 16 and Prisma 7";
export const DEFAULT_SHARE_IMAGE_PATH = "/share-preview.svg";

type BuildPageMetadataInput = {
  title?: string | null;
  description?: string | null;
  path?: string;
  image?: string | null;
  type?: "article" | "website";
};

const getConfiguredSiteUrl = () => {
  const rawUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.BETTER_AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : LOCAL_SITE_URL);

  try {
    return new URL(rawUrl);
  } catch {
    return new URL(LOCAL_SITE_URL);
  }
};

export const siteUrl = getConfiguredSiteUrl();

export const toAbsoluteUrl = (value: string) => {
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value.startsWith("/") ? value : `/${value}`, siteUrl).toString();
  }
};

const getMetadataTitle = (title?: string | null) => {
  const trimmedTitle = title?.trim();

  return trimmedTitle ? `${trimmedTitle} | ${SITE_NAME}` : SITE_NAME;
};

const getMetadataDescription = (description?: string | null) => {
  const trimmedDescription = description?.trim();

  return trimmedDescription || DEFAULT_SITE_DESCRIPTION;
};

const getPreviewImageUrl = (image?: string | null) => {
  const trimmedImage = image?.trim();

  return toAbsoluteUrl(trimmedImage || DEFAULT_SHARE_IMAGE_PATH);
};

export const buildPageMetadata = ({
  title,
  description,
  path = "/",
  image,
  type = "website",
}: BuildPageMetadataInput = {}): Metadata => {
  const metadataTitle = getMetadataTitle(title);
  const metadataDescription = getMetadataDescription(description);
  const canonicalUrl = toAbsoluteUrl(path);
  const previewImageUrl = getPreviewImageUrl(image);

  return {
    title: metadataTitle,
    description: metadataDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metadataTitle,
      description: metadataDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: previewImageUrl,
          width: 1200,
          height: 630,
          alt: metadataTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadataTitle,
      description: metadataDescription,
      images: [previewImageUrl],
    },
  };
};
