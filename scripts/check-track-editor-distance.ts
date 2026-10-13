/**
 * Asserts the running distance preview in `TrackEditor` matches the sum of
 * `distanceBetweenPoints` between consecutive placed points for several
 * representative point sets, including the edge cases (zero, one, two
 * points) and a reorder case where the same points are passed in a
 * different order to confirm order-sensitivity. Run with:
 *
 *   npx tsx scripts/check-track-editor-distance.ts
 */
import { distanceBetweenPoints, EARTH_RADIUS_METERS } from "../lib/track-gpx-parser";
import { computeEditorDistanceMeters } from "../components/track-pages/track-editor";

const check = (label: string, actual: number, expected: number) => {
  const delta = Math.abs(actual - expected);

  if (delta > 1e-6) {
    console.error(`✗ ${label}: actual=${actual.toFixed(6)} expected=${expected.toFixed(6)} delta=${delta}`);
    process.exit(1);
  }

  console.log(`✓ ${label}: ${actual.toFixed(3)} m`);
};

const sumByHaversine = (points: { lat: number; lng: number }[]) => {
  let total = 0;

  for (let i = 1; i < points.length; i += 1) {
    total += distanceBetweenPoints(points[i - 1], points[i]);
  }

  return total;
};

// Case 1: zero points
check("zero points", computeEditorDistanceMeters([]), 0);

// Case 2: single point
check("single point", computeEditorDistanceMeters([{ lat: 0, lng: 0 }]), 0);

// Case 3: two points, equator-to-1deg-east = ~111195 m (Haversine)
const twoPoints = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
];
check("two points (1° equator)", computeEditorDistanceMeters(twoPoints), (2 * Math.PI * EARTH_RADIUS_METERS) / 360);

// Case 4: three points, ordered (lon, lat move)
const threePoints = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 },
];
const expected3 = sumByHaversine(threePoints);
check("three points ordered", computeEditorDistanceMeters(threePoints), expected3);

// Case 5: reordered (last segment changes)
const reordered = [threePoints[0], threePoints[2], threePoints[1]];
const expectedReordered = sumByHaversine(reordered);
check("three points reordered", computeEditorDistanceMeters(reordered), expectedReordered);

if (Math.abs(expected3 - expectedReordered) < 1e-6) {
  console.error("✗ reorder test should produce a different distance than ordered test");
  process.exit(1);
}

// Case 6: one point removed
const withoutMiddle = [threePoints[0], threePoints[2]];
const expectedWithoutMiddle = sumByHaversine(withoutMiddle);
check("three points with middle removed", computeEditorDistanceMeters(withoutMiddle), expectedWithoutMiddle);

console.log("All track editor distance assertions passed.");
