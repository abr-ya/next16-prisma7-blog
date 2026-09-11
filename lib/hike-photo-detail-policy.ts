import { isValidGps, type PhotoExifGps, type PhotoMapCoordinate } from "@/lib/photo-exif-metadata";

export type HikePhotoDetailAccessFlags = {
  isAdmin: boolean;
  isCreator: boolean;
  isPhotoOwner: boolean;
  isAcceptedParticipant: boolean;
};

export const canViewHikePhotoDetail = ({
  isAdmin,
  isCreator,
  isPhotoOwner,
  isAcceptedParticipant,
}: HikePhotoDetailAccessFlags) => isAdmin || isCreator || isPhotoOwner || isAcceptedParticipant;

export const canReviewHikePhotoCoordinate = ({ isAdmin, isPhotoOwner }: HikePhotoDetailAccessFlags) =>
  isAdmin || isPhotoOwner;

export const canRefreshHikePhotoExif = ({ isAdmin, isPhotoOwner }: HikePhotoDetailAccessFlags) =>
  isAdmin || isPhotoOwner;

export const getAcceptedHikePhotoCoordinate = ({
  directGps,
  mapCoordinate,
}: {
  directGps: PhotoExifGps | null;
  mapCoordinate: PhotoMapCoordinate | null;
}) => {
  if (directGps && isValidGps(directGps.lat, directGps.lng)) {
    return {
      lat: directGps.lat,
      lng: directGps.lng,
      source: "DIRECT_EXIF" as const,
      confidence: "HIGH" as const,
      placementMethod: "DIRECT_EXIF" as const,
      explanation: null,
    };
  }

  if (
    mapCoordinate?.status === "APPROVED" &&
    mapCoordinate.lat !== null &&
    mapCoordinate.lng !== null &&
    isValidGps(mapCoordinate.lat, mapCoordinate.lng)
  ) {
    return {
      lat: mapCoordinate.lat,
      lng: mapCoordinate.lng,
      source: mapCoordinate.source,
      confidence: mapCoordinate.confidence,
      placementMethod: mapCoordinate.placementMethod,
      explanation: mapCoordinate.explanation,
    };
  }

  return null;
};
