import { normalizeTrackRecordingTimezone } from "@/lib/track-recording-timezone";

type LocalDateTime = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const EXIF_DATE_TIME_PATTERN = /^(\d{4})[:-]?(\d{2})[:-]?(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/;

const formatterFor = (timeZone: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

export const parsePhotoLocalWallTime = (value?: string | null): LocalDateTime | null => {
  if (!value) return null;
  const match = value.trim().match(EXIF_DATE_TIME_PATTERN);
  if (!match) return null;
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day ||
    utc.getUTCHours() !== hour ||
    utc.getUTCMinutes() !== minute ||
    utc.getUTCSeconds() !== second
  ) {
    return null;
  }
  return { year, month, day, hour, minute, second };
};

const localPartsAt = (instant: Date, timeZone: string): LocalDateTime => {
  const values = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
};

const sameLocalTime = (left: LocalDateTime, right: LocalDateTime) =>
  left.year === right.year &&
  left.month === right.month &&
  left.day === right.day &&
  left.hour === right.hour &&
  left.minute === right.minute &&
  left.second === right.second;

/** Returns null for invalid, skipped, or ambiguous local times. */
export const derivePhotoCaptureInstantUtc = ({
  localWallTime,
  timeZone,
}: {
  localWallTime?: string | null;
  timeZone?: string | null;
}) => {
  const local = parsePhotoLocalWallTime(localWallTime);
  const normalizedTimezone = normalizeTrackRecordingTimezone(timeZone);
  if (!local || !normalizedTimezone) return null;

  const naiveUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  const matches: number[] = [];
  for (let offsetMinutes = -14 * 60; offsetMinutes <= 14 * 60; offsetMinutes += 15) {
    const timestamp = naiveUtc - offsetMinutes * 60_000;
    if (sameLocalTime(localPartsAt(new Date(timestamp), normalizedTimezone), local)) matches.push(timestamp);
  }

  return matches.length === 1 ? new Date(matches[0]).toISOString() : null;
};
