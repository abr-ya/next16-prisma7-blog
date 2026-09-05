"use client";

import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/index";
import { cn } from "@/lib/utils";

export type HikePhotoGalleryItem = {
  id: string;
  title: string;
  description: string | null;
  alt: string;
  thumbnailUrl: string | null;
  fullUrl: string | null;
};

type HikePhotoGalleryProps = {
  photos: HikePhotoGalleryItem[];
  canViewFullPhotos: boolean;
};

export const HikePhotoGallery = ({ photos, canViewFullPhotos }: HikePhotoGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePhoto = activeIndex === null ? null : photos[activeIndex];
  const canNavigate = canViewFullPhotos && photos.length > 1;

  const openPhoto = (index: number) => {
    if (!canViewFullPhotos || !photos[index]?.fullUrl) return;
    setActiveIndex(index);
  };

  const closeViewer = () => setActiveIndex(null);

  const showPrevious = () => {
    if (activeIndex === null || photos.length === 0) return;
    setActiveIndex((activeIndex - 1 + photos.length) % photos.length);
  };

  const showNext = () => {
    if (activeIndex === null || photos.length === 0) return;
    setActiveIndex((activeIndex + 1) % photos.length);
  };

  useEffect(() => {
    if (activeIndex === null || !canNavigate) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) => (current === null ? current : (current - 1 + photos.length) % photos.length));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
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
        <div className="grid gap-4 sm:grid-cols-2">
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
                  <div className="font-medium">{photo.title}</div>
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
            "gap-3 border-none bg-black/95 p-3 text-white sm:max-w-[min(96vw,72rem)]",
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
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
