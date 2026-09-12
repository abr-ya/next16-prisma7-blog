"use client";

import { ChevronLeft, ChevronRight, FileSearch, ImageIcon, MapPin, Route } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { refreshHikePhotoExifMetadata, type HikePhotoDetail } from "@/app/_data/hikes";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/index";
import { HikePhotoCoordinateReview } from "@/components/hike-pages/hike-photo-coordinate-review";
import { HikePhotoDetailSummary } from "@/components/hike-pages/hike-photo-detail-summary";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type HikePhotoGalleryItem = {
  id: string;
  title: string;
  description: string | null;
  alt: string;
  thumbnailUrl: string | null;
  fullUrl: string | null;
  detail: HikePhotoDetail | null;
};

type HikePhotoGalleryProps = {
  photos: HikePhotoGalleryItem[];
  canViewFullPhotos: boolean;
  canFocusMap: boolean;
  onFocusMap: (coordinate: NonNullable<HikePhotoDetail["acceptedCoordinate"]>) => void;
};

export const HikePhotoGallery = ({ photos, canViewFullPhotos, canFocusMap, onFocusMap }: HikePhotoGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exifPhotoId, setExifPhotoId] = useState<string | null>(null);
  const [coordinatePhotoId, setCoordinatePhotoId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const activePhoto = activeIndex === null ? null : photos[activeIndex];
  const exifPhoto = photos.find((photo) => photo.id === exifPhotoId) ?? null;
  const coordinatePhoto = photos.find((photo) => photo.id === coordinatePhotoId) ?? null;
  const canNavigate = canViewFullPhotos && photos.length > 1;

  const openPhoto = (index: number) => {
    if (!canViewFullPhotos || !photos[index]?.fullUrl) return;
    setShowDetails(false);
    setActiveIndex(index);
  };

  const closeViewer = () => {
    setActiveIndex(null);
    setShowDetails(false);
  };

  const showPrevious = () => {
    if (activeIndex === null || photos.length === 0) return;
    setShowDetails(false);
    setActiveIndex((activeIndex - 1 + photos.length) % photos.length);
  };

  const showNext = () => {
    if (activeIndex === null || photos.length === 0) return;
    setShowDetails(false);
    setActiveIndex((activeIndex + 1) % photos.length);
  };

  const refreshExif = () => {
    if (!exifPhoto?.detail) return;
    const detail = exifPhoto.detail;

    startTransition(async () => {
      try {
        await refreshHikePhotoExifMetadata({ hikeId: detail.hikeId, photoId: exifPhoto.id });
        toast.success("EXIF metadata refreshed");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to refresh EXIF metadata");
      }
    });
  };

  useEffect(() => {
    if (activeIndex === null || !canNavigate) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setShowDetails(false);
        setActiveIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setShowDetails(false);
        setActiveIndex((current) => (current === null ? current : (current + 1) % photos.length));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, canNavigate, photos.length]);

  if (photos.length === 0) return null;

  return (
    <>
      <section className="grid gap-3">
        <h2 className="text-base font-semibold">Photos</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {photos.map((photo, index) => {
            const isOpenable = canViewFullPhotos && Boolean(photo.fullUrl);

            return (
              <div key={photo.id} className="overflow-hidden rounded-md border">
                <div className="aspect-[4/3] bg-muted">
                  {photo.thumbnailUrl ? (
                    isOpenable ? (
                      <button
                        type="button"
                        className="size-full cursor-zoom-in"
                        onClick={() => openPhoto(index)}
                        aria-label={`Open full photo: ${photo.title}`}
                      >
                        <img src={photo.thumbnailUrl} alt={photo.alt} className="size-full object-cover" />
                      </button>
                    ) : (
                      <img src={photo.thumbnailUrl} alt={photo.alt} className="size-full object-cover" />
                    )
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-6" />
                    </div>
                  )}
                </div>
                <div className="grid gap-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 font-medium">{photo.title}</div>
                    {photo.detail?.canReviewCoordinate ? (
                      <div className="flex shrink-0 gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Refresh EXIF metadata"
                              onClick={() => setExifPhotoId(photo.id)}
                            >
                              <FileSearch />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>EXIF metadata</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Review GPX coordinates"
                              onClick={() => setCoordinatePhotoId(photo.id)}
                            >
                              <Route />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>GPX coordinates</TooltipContent>
                        </Tooltip>
                      </div>
                    ) : null}
                  </div>
                  {photo.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{photo.description}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Dialog open={activePhoto !== null} onOpenChange={(open) => (!open ? closeViewer() : undefined)}>
        <DialogContent
          showCloseButton
          className={cn(
            "max-h-[calc(100dvh-2rem)] gap-3 overflow-y-auto border-none bg-black/95 p-3 text-white sm:max-w-[min(96vw,72rem)]",
            "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
          )}
          aria-describedby="hike-photo-viewer-description"
        >
          {activePhoto ? (
            <>
              <DialogHeader className="gap-1 pr-8 text-left">
                <DialogTitle className="text-white">{activePhoto.title}</DialogTitle>
                <DialogDescription id="hike-photo-viewer-description" className="text-white/70">
                  {activePhoto.description || "Linked hike photo"}
                </DialogDescription>
              </DialogHeader>
              <div className="relative flex min-h-[50vh] items-center justify-center">
                {activePhoto.fullUrl ? (
                  <img
                    src={activePhoto.fullUrl}
                    alt={activePhoto.alt}
                    className="max-h-[min(80vh,900px)] max-w-full object-contain"
                  />
                ) : null}
                {canNavigate ? (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-1/2 left-2 -translate-y-1/2"
                      onClick={showPrevious}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute top-1/2 right-2 -translate-y-1/2"
                      onClick={showNext}
                      aria-label="Next photo"
                    >
                      <ChevronRight />
                    </Button>
                  </>
                ) : null}
              </div>
              {activePhoto.detail ? (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowDetails((current) => !current)}
                  >
                    {showDetails ? "Hide details" : "Photo details"}
                  </Button>
                </div>
              ) : null}
              {showDetails && activePhoto.detail ? (
                <div className="grid gap-4 rounded-md bg-white p-4 text-foreground">
                  <HikePhotoDetailSummary
                    captureSummary={activePhoto.detail.captureSummary}
                    acceptedCoordinate={activePhoto.detail.acceptedCoordinate}
                    linkedTrackTimezones={activePhoto.detail.linkedTrackTimezones}
                    adminExifMetadata={activePhoto.detail.adminExifMetadata}
                  />
                  {canFocusMap && activePhoto.detail.acceptedCoordinate ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onFocusMap(activePhoto.detail!.acceptedCoordinate!);
                          closeViewer();
                        }}
                      >
                        <MapPin />
                        Show on map
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(exifPhoto)} onOpenChange={(open) => (!open ? setExifPhotoId(null) : undefined)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{exifPhoto ? `EXIF for ${exifPhoto.title}` : "EXIF"}</DialogTitle>
            <DialogDescription>
              Refresh the stored photo-level capture metadata. Existing approved coordinate review data is preserved.
            </DialogDescription>
          </DialogHeader>
          {exifPhoto?.detail ? (
            <div className="grid gap-4">
              <HikePhotoDetailSummary
                captureSummary={exifPhoto.detail.captureSummary}
                acceptedCoordinate={exifPhoto.detail.acceptedCoordinate}
                linkedTrackTimezones={exifPhoto.detail.linkedTrackTimezones}
                adminExifMetadata={exifPhoto.detail.adminExifMetadata}
              />
              <div className="flex justify-end">
                <Button type="button" disabled={isPending} onClick={refreshExif}>
                  <FileSearch />
                  {isPending ? "Refreshing..." : "Refresh EXIF"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(coordinatePhoto)} onOpenChange={(open) => (!open ? setCoordinatePhotoId(null) : undefined)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {coordinatePhoto ? `GPX coordinates for ${coordinatePhoto.title}` : "GPX coordinates"}
            </DialogTitle>
            <DialogDescription>
              Approve, reject, or manually correct a coordinate candidate for this linked photo.
            </DialogDescription>
          </DialogHeader>
          {coordinatePhoto?.detail ? (
            <HikePhotoCoordinateReview
              detail={coordinatePhoto.detail}
              onChanged={() => startTransition(() => router.refresh())}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
