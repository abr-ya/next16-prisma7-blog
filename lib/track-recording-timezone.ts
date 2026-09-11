export const LEGACY_TRACK_RECORDING_TIMEZONE = "UTC";

const supportedTimezones = new Set([
  ...(typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []),
  LEGACY_TRACK_RECORDING_TIMEZONE,
]);

export const getSupportedTrackRecordingTimezones = () => [...supportedTimezones].sort();

export const normalizeTrackRecordingTimezone = (value?: string | null) => {
  const normalized = value?.trim();

  if (!normalized || !supportedTimezones.has(normalized)) return null;

  return normalized;
};

export const requireTrackRecordingTimezone = (value?: string | null) => {
  const timezone = normalizeTrackRecordingTimezone(value);

  if (!timezone) throw new Error("Recording timezone is invalid");

  return timezone;
};

export const getTrackRecordingTimezone = (value?: string | null) =>
  normalizeTrackRecordingTimezone(value) ?? LEGACY_TRACK_RECORDING_TIMEZONE;

export const formatTrackRecordingTimezone = (value?: string | null) =>
  normalizeTrackRecordingTimezone(value) ?? "UTC (unconfirmed)";
