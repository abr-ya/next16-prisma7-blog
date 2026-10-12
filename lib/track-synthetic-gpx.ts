/**
 * Build a minimal GPX 1.1 byte string from a list of placed points for the
 * `Place on map` track creation path (feature-111). The synthetic GPX
 * deliberately omits `<time>` elements so the existing parse pipeline
 * produces no timeline (matching the behavior of a coordinate-only uploaded
 * GPX) and never exposes a recording-start time that the user did not
 * provide. The `creator="manual-track-editor"` marker identifies synthetic
 * files when a developer needs to distinguish them from uploaded GPX.
 *
 * Lives in `lib/` (not `app/_data/tracks.ts`) because the latter carries
 * the `"use server"` directive, which forbids synchronous function exports.
 */
const escapeXmlText = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const buildSyntheticGpxBytes = (
  title: string,
  points: { lat: number; lng: number }[],
): string => {
  const safeTitle = escapeXmlText(title);
  const trkpts = points
    .map(
      (point) =>
        `      <trkpt lat="${Number(point.lat).toFixed(7)}" lon="${Number(point.lng).toFixed(7)}"/>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="manual-track-editor" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${safeTitle}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
};
