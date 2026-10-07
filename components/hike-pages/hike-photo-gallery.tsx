"use client";

import {
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  Heart,
  ImageIcon,
  ImageOff,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Route,
} from "lucide-react";
import Link from "next/link";
import { useT } from "next-i18next/client";
import { forwardRef, useEffect, useImperativeHandle, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  likeHikePhoto,
  refreshHikePhotoExifMetadata,
  unlikeHikePhoto,
  type HikePhotoContributionCapability,
  type HikePhotoDetail,
} from "@/app/_data/hikes";
import { HikePhotoCommentSection } from "@/components/hike-pages/hike-photo-comment-composer";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/index";
import { HikePhotoCoordinateReview } from "@/components/hike-pages/hike-photo-coordinate-review";
import { HikePhotoContributionButton } from "@/components/hike-pages/hike-photo-contribution-form";
import { HikePhotoDetailSummary } from "@/components/hike-pages/hike-photo-detail-summary";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CommentListItem } from "@/lib/comments";
import { tripsNamespace } from "@/app/i18n/settings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type HikePhotoGalleryItem = {
  id: string;
  hikeId: string;
  title: string;
  description: string | null;
  captureInstant: string | null;
  alt: string;
  thumbnailUrl: string | null;
  fullUrl: string | null;
  detail: HikePhotoDetail | null;
  isLikedByViewer: boolean;
  commentCount: number;
  initialComments: CommentListItem[];
  currentUserId?: string | null;
};

type HikePhotoGalleryProps = {
  photos: HikePhotoGalleryItem[];
  canViewFullPhotos: boolean;
  canFocusMap: boolean;
  onFocusMap: (coordinate: NonNullable<HikePhotoDetail["acceptedCoordinate"]>) => void;
  onSelectedPhotoChange?: (photoId: string | null) => void;
  photoContributionCapability?: HikePhotoContributionCapability | null;
  photoOrder: "capture" | "manual";
  canChangePhotoOrder: boolean;
  onPhotoOrderChange: (photoOrder: "capture" | "manual") => void;
};

export type HikePhotoGalleryHandle = {
  openPhotoById: (photoId: string) => void;
  closeViewer: () => void;
};

type FullPhotoImageState = { photoId: string; status: "loaded" | "error" } | null;

const formatPhotoCommentCount = (count: number) => {
  if (count === 0) return "No comments";
  if (count === 1) return "1 comment";

  return `${count} comments`;
};

export const HikePhotoGallery = forwardRef<HikePhotoGalleryHandle, HikePhotoGalleryProps>(function HikePhotoGallery(
  {
    photos,
    canViewFullPhotos,
    canFocusMap,
    onFocusMap,
    onSelectedPhotoChange,
    photoContributionCapability,
    photoOrder,
    canChangePhotoOrder,
    onPhotoOrderChange,
  },
  ref,
) {
  const { t } = useT(tripsNamespace);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [exifPhotoId, setExifPhotoId] = useState<string | null>(null);
  const [coordinatePhotoId, setCoordinatePhotoId] = useState<string | null>(null);
  const [fullPhotoImageState, setFullPhotoImageState] = useState<FullPhotoImageState>(null);
  const [isPending, startTransition] = useTransition();
  const [isLikePending, startLikeTransition] = useTransition();
  const router = useRouter();
  const activeIndex = activePhotoId ? photos.findIndex((photo) => photo.id === activePhotoId) : null;
  const activePhoto = activeIndex === null || activeIndex === -1 ? null : photos[activeIndex];
  const exifPhoto = photos.find((photo) => photo.id === exifPhotoId) ?? null;
  const coordinatePhoto = photos.find((photo) => photo.id === coordinatePhotoId) ?? null;
  const canNavigate = canViewFullPhotos && photos.length > 1;
  const showOverlay = showDetails || showComments;
  const fullPhotoImageStatus =
    activePhoto && fullPhotoImageState?.photoId === activePhoto.id ? fullPhotoImageState.status : "loading";

  const openPhotoById = (photoId: string) => {
    const index = photos.findIndex((photo) => photo.id === photoId);
    if (index === -1 || !canViewFullPhotos || !photos[index]?.fullUrl) {
      toast.info("Sign in to view the full photo");
      return;
    }

    if (activePhotoId === photoId) return;

    openPhoto(index);
  };

  const openPhoto = (index: number) => {
    if (!canViewFullPhotos || !photos[index]?.fullUrl) return;
    setShowDetails(false);
    setShowComments(false);
    setFullPhotoImageState(null);
    setActivePhotoId(photos[index]!.id);
    onSelectedPhotoChange?.(photos[index]!.id);
  };

  const closeViewer = () => {
    setActivePhotoId(null);
    setShowDetails(false);
    setShowComments(false);
    setFullPhotoImageState(null);
    onSelectedPhotoChange?.(null);
  };

  useImperativeHandle(ref, () => ({ openPhotoById, closeViewer }));

  const showPrevious = () => {
    if (activeIndex === null || activeIndex === -1 || photos.length === 0) return;
    const nextIndex = (activeIndex - 1 + photos.length) % photos.length;
    setShowDetails(false);
    setShowComments(false);
    setFullPhotoImageState(null);
    setActivePhotoId(photos[nextIndex]!.id);
    onSelectedPhotoChange?.(photos[nextIndex]!.id);
  };

  const showNext = () => {
    if (activeIndex === null || activeIndex === -1 || photos.length === 0) return;
    const nextIndex = (activeIndex + 1) % photos.length;
    setShowDetails(false);
    setShowComments(false);
    setFullPhotoImageState(null);
    setActivePhotoId(photos[nextIndex]!.id);
    onSelectedPhotoChange?.(photos[nextIndex]!.id);
  };

  const refreshExif = (photo = exifPhoto) => {
    if (!photo?.detail) return;
    const detail = photo.detail;

    startTransition(async () => {
      try {
        await refreshHikePhotoExifMetadata({ hikeId: detail.hikeId, photoId: photo.id });
        toast.success("EXIF metadata refreshed");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to refresh EXIF metadata");
      }
    });
  };

  const toggleLike = (photo: HikePhotoGalleryItem) => {
    if (!canViewFullPhotos) return;

    startLikeTransition(async () => {
      try {
        const result = photo.isLikedByViewer
          ? await unlikeHikePhoto({ hikeId: photo.hikeId, photoId: photo.id })
          : await likeHikePhoto({ hikeId: photo.hikeId, photoId: photo.id });
        toast.success(result.liked ? "Photo liked" : "Like removed");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update photo like");
      }
    });
  };

  useEffect(() => {
    if (activeIndex === null || !canNavigate) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevious();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, canNavigate, showNext, showPrevious]);

  if (photos.length === 0 && !photoContributionCapability) return null;

  return (
    <>
      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Photos</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex" tabIndex={canChangePhotoOrder ? -1 : 0}>
                  <div className="flex rounded-md border p-0.5" role="group" aria-label={t("photoOrderLabel")}>
                    <Button
                      type="button"
                      size="sm"
                      variant={photoOrder === "capture" ? "secondary" : "ghost"}
                      disabled={!canChangePhotoOrder}
                      aria-pressed={photoOrder === "capture"}
                      onClick={() => onPhotoOrderChange("capture")}
                    >
                      {t("photoOrderCapture")}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={photoOrder === "manual" ? "secondary" : "ghost"}
                      disabled={!canChangePhotoOrder}
                      aria-pressed={photoOrder === "manual"}
                      onClick={() => onPhotoOrderChange("manual")}
                    >
                      {t("photoOrderManual")}
                    </Button>
                  </div>
                </div>
              </TooltipTrigger>
              {!canChangePhotoOrder ? <TooltipContent>{t("photoOrderUnchanged")}</TooltipContent> : null}
            </Tooltip>
            {photoContributionCapability ? (
              <HikePhotoContributionButton capability={photoContributionCapability} />
            ) : null}
          </div>
        </div>
        {photos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {photos.map((photo, index) => {
              const isOpenable = canViewFullPhotos && Boolean(photo.fullUrl);

              return (
                <div key={photo.id} className="overflow-hidden rounded-md border">
                  <div className="relative aspect-[4/3] bg-muted">
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
                    {canViewFullPhotos ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isLikePending}
                        aria-pressed={photo.isLikedByViewer}
                        aria-label={photo.isLikedByViewer ? "Remove like" : "Like photo"}
                        className="absolute top-2 right-2 rounded-full bg-black/45 text-red-400 shadow-sm backdrop-blur-sm hover:bg-black/65 hover:text-red-300"
                        onClick={() => toggleLike(photo)}
                      >
                        <Heart className={photo.isLikedByViewer ? "fill-current" : undefined} />
                      </Button>
                    ) : (
                      <Button
                        asChild
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full bg-black/45 text-red-400 shadow-sm backdrop-blur-sm hover:bg-black/65 hover:text-red-300"
                      >
                        <Link href="/sign-in" aria-label="Sign in to like this photo">
                          <Heart />
                        </Link>
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5 font-medium">
                        {!photo.captureInstant ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="shrink-0 text-red-600"
                                tabIndex={0}
                                aria-label={t("photoCaptureDateUnavailableLabel")}
                              >
                                <CircleAlert className="size-4" aria-hidden="true" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{t("photoCaptureDateUnavailable")}</TooltipContent>
                          </Tooltip>
                        ) : null}
                        <span className="truncate">{photo.title}</span>
                      </div>
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
                    {canViewFullPhotos ? (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="size-3.5" />
                        <span>{formatPhotoCommentCount(photo.commentCount)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>

      <Dialog open={activePhoto !== null} onOpenChange={(open) => (!open ? closeViewer() : undefined)}>
        <DialogContent
          showCloseButton
          className={cn(
            "max-h-[calc(100dvh-2rem)] gap-3 overflow-hidden border-none bg-black/95 p-3 text-white sm:max-w-[min(96vw,72rem)]",
            "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
          )}
          aria-describedby="hike-photo-viewer-description"
        >
          {activePhoto ? (
            <>
              <DialogHeader className="gap-1 pr-8 text-left">
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="text-white">{activePhoto.title}</DialogTitle>
                  <span className="shrink-0 text-sm text-white/70" aria-live="polite">
                    {`${(activeIndex ?? 0) + 1} of ${photos.length}`}
                  </span>
                </div>
                <DialogDescription id="hike-photo-viewer-description" className="text-white/70">
                  {activePhoto.description || "Linked hike photo"}
                </DialogDescription>
              </DialogHeader>
              <div className="relative flex min-h-[50vh] items-center justify-center">
                {activePhoto.fullUrl ? (
                  <img
                    key={activePhoto.id}
                    src={activePhoto.fullUrl}
                    alt={activePhoto.alt}
                    className={cn(
                      "max-h-[min(80vh,900px)] max-w-full object-contain",
                      fullPhotoImageStatus === "loaded" ? undefined : "invisible",
                    )}
                    onLoad={() => setFullPhotoImageState({ photoId: activePhoto.id, status: "loaded" })}
                    onError={() => setFullPhotoImageState({ photoId: activePhoto.id, status: "error" })}
                  />
                ) : null}
                {fullPhotoImageStatus === "loading" ? (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-white/80"
                    aria-live="polite"
                  >
                    <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
                    <span>Loading photo…</span>
                  </div>
                ) : null}
                {fullPhotoImageStatus === "error" ? (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-sm text-white/80"
                    role="alert"
                  >
                    <ImageOff className="size-6" aria-hidden="true" />
                    <span>This photo could not be loaded. Try another photo.</span>
                  </div>
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
                {showDetails && activePhoto.detail ? (
                  <div className="absolute inset-x-3 bottom-3 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-md bg-white/75 p-3 text-foreground shadow-lg backdrop-blur-sm sm:max-w-xl">
                    <div className="mb-3 flex justify-end">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setShowDetails(false)}>
                        Hide details
                      </Button>
                    </div>
                    <HikePhotoDetailSummary
                      captureSummary={activePhoto.detail.captureSummary}
                      acceptedCoordinate={activePhoto.detail.acceptedCoordinate}
                      linkedTrackTimezones={activePhoto.detail.linkedTrackTimezones}
                      adminExifMetadata={activePhoto.detail.adminExifMetadata}
                      showCameraTimeRefreshRecommendation={
                        activePhoto.detail.canRefreshExif && activePhoto.detail.requiresCameraTimeRefresh
                      }
                      onRefreshExif={activePhoto.detail.canRefreshExif ? () => refreshExif(activePhoto) : undefined}
                    />
                    {canFocusMap && activePhoto.detail.acceptedCoordinate ? (
                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            closeViewer();
                            onFocusMap(activePhoto.detail!.acceptedCoordinate!);
                          }}
                        >
                          <MapPin />
                          Show on map
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {showComments ? (
                  <div className="absolute inset-x-3 bottom-3 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-md bg-white/95 p-3 text-foreground shadow-lg backdrop-blur-sm sm:max-w-xl">
                    <div className="mb-3 flex justify-end">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setShowComments(false)}>
                        Hide comments
                      </Button>
                    </div>
                    <HikePhotoCommentSection
                      photoId={activePhoto.id}
                      initialComments={activePhoto.initialComments}
                      isAuthenticated={Boolean(activePhoto.currentUserId)}
                      currentUserId={activePhoto.currentUserId ?? null}
                      canViewFullPhotos={canViewFullPhotos}
                    />
                  </div>
                ) : null}
                {!showOverlay && (activePhoto.detail || activePhoto.commentCount > 0 || canViewFullPhotos) ? (
                  <div className="absolute right-3 bottom-3 flex flex-wrap justify-end gap-2">
                    {activePhoto.detail ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setShowDetails(true);
                          setShowComments(false);
                        }}
                      >
                        Photo details
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setShowComments(true);
                        setShowDetails(false);
                      }}
                    >
                      <MessageCircle />
                      {activePhoto.commentCount > 0 ? formatPhotoCommentCount(activePhoto.commentCount) : "Comments"}
                    </Button>
                  </div>
                ) : null}
              </div>
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
                showCameraTimeRefreshRecommendation={
                  exifPhoto.detail.canRefreshExif && exifPhoto.detail.requiresCameraTimeRefresh
                }
              />
              <div className="flex justify-end">
                <Button type="button" disabled={isPending} onClick={() => refreshExif()}>
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
              onChanged={(reason) => {
                startTransition(() => {
                  router.refresh();
                  if (reason === "approved") setCoordinatePhotoId(null);
                });
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
});
