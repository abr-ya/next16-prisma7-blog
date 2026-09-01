import { CalendarDays, Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPublicHikeBySlug } from "@/app/_data/hikes";
import { Badge, Button } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import { formatHikeDateRange, formatHikeType } from "@/lib/hikes";
import { buildPageMetadata, getTextMetadataDescription } from "@/lib/site-metadata";

type HikePageProps = {
  params: Promise<{ slug: string }>;
};

export const generateMetadata = async ({ params }: HikePageProps): Promise<Metadata> => {
  const { slug } = await params;
  const hike = await getPublicHikeBySlug(slug);

  if (!hike) {
    return buildPageMetadata({
      title: "Hikes",
      description: "Published hikes and outdoor trip notes.",
      path: `/hikes/${slug}`,
    });
  }

  return buildPageMetadata({
    title: hike.title,
    description: getTextMetadataDescription(hike.description) || "Published hike and outdoor trip notes.",
    path: `/hikes/${hike.slug}`,
    type: "article",
  });
};

const HikePage = async ({ params }: HikePageProps) => {
  const { slug } = await params;
  const hike = await getPublicHikeBySlug(slug);

  if (!hike) notFound();

  return (
    <PageLayout title={hike.title} className="pt-6" showBackLink={false}>
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-10">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{formatHikeType(hike.type)}</Badge>
          <Badge variant="outline">
            <CalendarDays className="size-3.5" />
            {formatHikeDateRange(hike)}
          </Badge>
        </div>
        {hike.description ? (
          <div className="whitespace-pre-wrap text-base leading-7 text-foreground">{hike.description}</div>
        ) : (
          <p className="text-sm text-muted-foreground">No description yet.</p>
        )}
        {hike.tracks.length > 0 ? (
          <section className="grid gap-3">
            <h2 className="text-base font-semibold">Linked tracks</h2>
            <div className="grid gap-3">
              {hike.tracks.map(({ track }) => (
                <div key={track.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="grid gap-1">
                      <div className="font-medium">{track.title}</div>
                      {track.description ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{track.description}</p>
                      ) : null}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/tracks/${track.slug}`}>
                        <Route />
                        Open track
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </PageLayout>
  );
};

export default HikePage;
