import { CombinedTrackMap, type TrackMapViewModel } from "@/components/track-pages/track-map";

export const HikeTrackMap = ({ tracks }: { tracks: TrackMapViewModel[] }) => (
  <CombinedTrackMap ariaLabel="Hike route map" tracks={tracks} />
);
