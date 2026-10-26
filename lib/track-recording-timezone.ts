export const LEGACY_TRACK_RECORDING_TIMEZONE = "UTC";

const supportedTimezones = new Set([
  ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []),
  LEGACY_TRACK_RECORDING_TIMEZONE,
]);

// feature-123: a fixed UTC offset — the zone a GPX file's own timestamps
// carry when they name an offset but no zone. `Intl` reads `+03:00` as a
// time zone, but not `UTC+03:00`, so the canonical form is the bare offset.
const FIXED_OFFSET_PATTERN = /^(?:UTC|GMT)?([+-])(\d{1,2}):?(\d{2})$/i;
const MAX_FIXED_OFFSET_MINUTES = 14 * 60;

export const getSupportedTrackRecordingTimezones = () => [...supportedTimezones].sort();

/**
 * The canonical form of a fixed UTC offset — `+03:00`.
 *
 * `null` when the offset is out of range or not a whole number of minutes.
 */
export const formatFixedUtcOffset = (minutes: number | null | undefined): string | null => {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return null;

  const total = Math.trunc(minutes);

  if (Math.abs(total) > MAX_FIXED_OFFSET_MINUTES) return null;

  const sign = total < 0 ? "-" : "+";
  const absolute = Math.abs(total);
  const hours = Math.floor(absolute / 60);
  const restMinutes = absolute % 60;

  return `${sign}${String(hours).padStart(2, "0")}:${String(restMinutes).padStart(2, "0")}`;
};

const readFixedUtcOffset = (value: string): number | null => {
  const match = FIXED_OFFSET_PATTERN.exec(value.trim());

  if (!match) return null;

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours > 14 || minutes > 59) return null;

  return sign * (hours * 60 + minutes);
};

export const normalizeTrackRecordingTimezone = (value?: string | null) => {
  const normalized = value?.trim();

  if (!normalized) return null;
  if (supportedTimezones.has(normalized)) return normalized;

  // feature-123: the fixed-offset form the quick upload writes when the file
  // carries an offset but names no zone.
  const offset = readFixedUtcOffset(normalized);

  return offset === null ? null : formatFixedUtcOffset(offset);
};

export const requireTrackRecordingTimezone = (value?: string | null) => {
  const timezone = normalizeTrackRecordingTimezone(value);

  if (!timezone) throw new Error("Recording timezone is invalid");

  return timezone;
};

export const getTrackRecordingTimezone = (value?: string | null) =>
  normalizeTrackRecordingTimezone(value) ?? LEGACY_TRACK_RECORDING_TIMEZONE;

/**
 * The display form of a recording timezone.
 *
 * A fixed offset reads as `UTC+03:00` — the bare `+03:00` is the stored
 * value, but the `UTC` prefix is what a reader expects to see.
 */
export const formatTrackRecordingTimezone = (value?: string | null) => {
  const timezone = normalizeTrackRecordingTimezone(value);

  if (!timezone) return "UTC (unconfirmed)";

  return readFixedUtcOffset(timezone) === null ? timezone : `UTC${timezone}`;
};

/**
 * The recording timezone a UTC offset stands for.
 *
 * A file written in Moscow says `+03:00` in its timestamps; that offset is
 * the recording's own wall-clock, and it becomes the track's recording
 * timezone so every surface shows the time the owner actually recorded.
 * `null` when the file named no offset — the timestamps are naive wall-clock
 * values and only the device that wrote them knew the zone.
 */
export const toRecordingTimezoneFromUtcOffset = (minutes: number | null | undefined): string | null => {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return null;
  if (Math.trunc(minutes) === 0) return LEGACY_TRACK_RECORDING_TIMEZONE;

  return formatFixedUtcOffset(minutes);
};

/**
 * The offset a file's own timestamps name as the recording's local clock.
 *
 * A non-zero offset (`+03:00`) is the recording's own wall-clock: it is the
 * only place that survives the normalization to UTC instants. UTC — a `Z` or a
 * `+00:00` — names the *instant*, not the wall-clock the owner recorded in,
 * so it describes no local zone at all, exactly like a naive timestamp does.
 *
 * `null` when the file names no local offset.
 */
export const toLocalRecordingOffsetMinutes = (minutes: number | null | undefined): number | null => {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return null;

  const total = Math.trunc(minutes);

  return total === 0 ? null : total;
};

/**
 * The recording timezone a quick upload stores.
 *
 * The file's own *local* offset wins — it is the recording's own wall-clock.
 * A file that names no local offset carries either naive wall-clock
 * timestamps or timestamps written in UTC, and both lose the local clock the
 * owner recorded in, so the device that uploaded it is then the only
 * reference there is and the device's timezone is the fallback. It is
 * validated the way every recording timezone is, and an unsupported one is
 * dropped rather than stored.
 *
 * `null` when neither source names a usable zone — the track then reads as
 * the explicit UTC fallback with the unconfirmed marker.
 */
export const resolveQuickWorkoutRecordingTimezone = (
  utcOffsetMinutes: number | null | undefined,
  deviceTimezone?: string | null,
): string | null => {
  const localOffsetMinutes = toLocalRecordingOffsetMinutes(utcOffsetMinutes);

  if (localOffsetMinutes !== null) {
    const fromOffset = formatFixedUtcOffset(localOffsetMinutes);

    if (fromOffset) return fromOffset;
  }

  const device = normalizeTrackRecordingTimezone(deviceTimezone);

  if (device) return device;

  // The device names nothing usable: the file's own UTC stays, and a file
  // that names no offset at all leaves the track unconfirmed.
  return toRecordingTimezoneFromUtcOffset(utcOffsetMinutes);
};
