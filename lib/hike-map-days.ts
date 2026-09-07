import type { PhotoCaptureTimezoneEvidence } from "@/lib/photo-exif-metadata";
import type { TrackGpxTimezoneEvidence } from "@/lib/track-gpx-metadata";

export type HikeMapDay = { key: string; label: string };

const toUtcDateKey = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

export const getHikeMapDays = (startDate: Date | string, endDate: Date | string): HikeMapDay[] => {
  const startKey = toUtcDateKey(startDate);
  const endKey = toUtcDateKey(endDate);
  if (!startKey || !endKey || startKey > endKey) return [];

  const days: HikeMapDay[] = [];
  const cursor = new Date(`${startKey}T00:00:00.000Z`);
  const end = new Date(`${endKey}T00:00:00.000Z`);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    days.push({
      key,
      label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
        cursor,
      ),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

export const getTimestampDayKey = (
  timestamp: string | null | undefined,
  timezoneEvidence: PhotoCaptureTimezoneEvidence | TrackGpxTimezoneEvidence | null | undefined,
) => (timezoneEvidence === "UTC_OR_OFFSET" && timestamp ? toUtcDateKey(timestamp) : null);

export const getTrackDayKeys = ({
  start,
  end,
  timezoneEvidence,
  hikeDays,
}: {
  start: string;
  end: string;
  timezoneEvidence: TrackGpxTimezoneEvidence;
  hikeDays: HikeMapDay[];
}) => {
  if (timezoneEvidence !== "UTC_OR_OFFSET") return [];
  const startKey = toUtcDateKey(start);
  const endKey = toUtcDateKey(end);
  if (!startKey || !endKey) return [];
  return hikeDays.filter(({ key }) => key >= startKey && key <= endKey).map(({ key }) => key);
};
