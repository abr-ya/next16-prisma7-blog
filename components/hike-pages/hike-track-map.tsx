import type { HikePhotoMapMarker } from "@/lib/hikes";
import { CombinedTrackMap, type TrackMapViewModel } from "@/components/track-pages/track-map";

export const HikeTrackMap = ({
  tracks,
  photoMarkers = [],
}: {
  tracks: TrackMapViewModel[];
  photoMarkers?: HikePhotoMapMarker[];
}) => <CombinedTrackMap ariaLabel="Hike route map" tracks={tracks} photoMarkers={photoMarkers} />;
