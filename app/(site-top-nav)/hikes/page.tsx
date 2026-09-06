import { CalendarDays, Map } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getPublicHikes } from "@/app/_data/hikes";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/index";
import { PageLayout } from "@/components/layout/page-layout";
import { buildPageMetadata, getTextMetadataDescription } from "@/lib/site-metadata";
import { formatHikeDateRange, formatHikeType } from "@/lib/hikes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Hikes",
  description: "Published hikes and outdoor trip notes.",
  path: "/hikes",
});

const HikesPage = async () => {
  const hikes = await getPublicHikes();

  return (
    <PageLayout title="Hikes" className="pt-6" showBackLink={false} contentWidth="wide">
      <div className="flex w-full flex-col gap-6 pb-10">
        {hikes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {hikes.map((hike) => (
              <Card key={hike.id} className="h-full gap-3">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{formatHikeType(hike.type)}</Badge>
                    <Badge variant="outline">
                      <CalendarDays className="size-3.5" />
                      {formatHikeDateRange(hike)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl leading-tight">
                    <Link href={`/hikes/${hike.slug}`} className="hover:underline">
                      {hike.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {hike.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {getTextMetadataDescription(hike.description, 220)}
                    </p>
                  ) : null}
                  <div className="mt-auto">
                    <Button asChild size="sm">
                      <Link href={`/hikes/${hike.slug}`}>
                        <Map />
                        Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">No published hikes yet.</div>
        )}
      </div>
    </PageLayout>
  );
};

export default HikesPage;
