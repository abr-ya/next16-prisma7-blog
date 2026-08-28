import { CalendarDays, Download, FileText, Route, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicTrackBySlug } from "@/app/_data/tracks";
import { Badge, Button } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import { formatFileSize } from "@/lib/file-upload-limits";
import { buildPageMetadata, getTextMetadataDescription } from "@/lib/site-metadata";

type TrackPageProps = {
  params: Promise<{ slug: string }>;
};

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const generateMetadata = async ({ params }: TrackPageProps): Promise<Metadata> => {
  const { slug } = await params;
  const track = await getPublicTrackBySlug(slug);

  if (!track) {
    return buildPageMetadata({
      title: "Tracks",
      description: "Published GPX tracks and outdoor route files.",
      path: `/tracks/${slug}`,
    });
  }

  return buildPageMetadata({
    title: track.title,
    description: getTextMetadataDescription(track.description) || "Published GPX track and outdoor route file.",
    path: `/tracks/${track.slug}`,
    type: "article",
  });
};

const TrackPage = async ({ params }: TrackPageProps) => {
  const { slug } = await params;
  const track = await getPublicTrackBySlug(slug);

  if (!track) notFound();

  return (
    <PageLayout title={track.title} className="pt-6" showBackLink={false}>
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Route className="size-3.5" />
            GPX track
          </Badge>
          <Badge variant="outline">
            <CalendarDays className="size-3.5" />
            Updated {formatDate(track.updatedAt)}
          </Badge>
        </div>

        {track.description ? (
          <div className="whitespace-pre-wrap text-base leading-7 text-foreground">{track.description}</div>
        ) : (
          <p className="text-sm text-muted-foreground">No description yet.</p>
        )}

        <section className="grid gap-4 rounded-md border p-4">
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-medium">{track.file.name}</span>
            <Badge variant="outline">{formatFileSize(track.file.sizeBytes)}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Upload className="size-3.5" />
              Uploaded {formatDate(track.file.uploadedAt)}
            </span>
            <span>File updated {formatDate(track.file.updatedAt)}</span>
          </div>
          <div>
            {track.file.downloadUrl ? (
              <Button asChild>
                <Link href={track.file.downloadUrl}>
                  <Download />
                  Download GPX
                </Link>
              </Button>
            ) : (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                GPX download is unavailable for this track.
              </div>
            )}
          </div>
        </section>
      </article>
    </PageLayout>
  );
};

export default TrackPage;
