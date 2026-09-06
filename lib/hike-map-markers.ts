import type { HikePhotoMapMarker } from "@/lib/hikes";

export type HikePhotoMapMarkerGroup = {
  lat: number;
  lng: number;
  photos: HikePhotoMapMarker[];
};

/** Groups only exact coordinate matches and preserves the input order. */
export const groupHikePhotoMapMarkers = (markers: HikePhotoMapMarker[]): HikePhotoMapMarkerGroup[] => {
  const groups = new Map<string, HikePhotoMapMarkerGroup>();

  for (const marker of markers) {
    const key = `${marker.lat},${marker.lng}`;
    const group = groups.get(key);

    if (group) {
      group.photos.push(marker);
      continue;
    }

    groups.set(key, {
      lat: marker.lat,
      lng: marker.lng,
      photos: [marker],
    });
  }

  return [...groups.values()];
};
