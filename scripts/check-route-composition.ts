/**
 * Asserts the composite-route geometry plan: a repeated loop drops only the
 * duplicate closing points at the lap seams, consecutive segments must meet,
 * and the recipe shape refusals carry the expected codes. Run with:
 *
 *   npx tsx scripts/check-route-composition.ts
 */
import {
  buildRouteCompositionPoints,
  validateRouteCompositionMeaning,
  type RouteCompositionSegment,
} from "../lib/route-composition";

let failures = 0;

const pass = (label: string, detail = "") => {
  console.log(`✓ ${label}${detail ? `: ${detail}` : ""}`);
};

const fail = (label: string, detail: string) => {
  failures += 1;
  console.error(`✗ ${label}: ${detail}`);
};

const expect = (label: string, condition: boolean, detail = "") => {
  if (condition) pass(label, detail);
  else fail(label, detail || "expectation failed");
};

// A short closed loop near the origin: four points, the last equal to the first.
const loop = [
  { lat: 0, lng: 0 },
  { lat: 0.001, lng: 0 },
  { lat: 0.001, lng: 0.001 },
  { lat: 0, lng: 0 },
];

const segment = (
  childRouteId: string,
  points: { lat: number; lng: number }[],
  overrides: Partial<RouteCompositionSegment> = {},
): RouteCompositionSegment => ({
  childRouteId,
  role: "MAIN",
  sortOrder: 0,
  lapCount: 1,
  points,
  ...overrides,
});

// Case 1: one single-lap segment keeps every point.
{
  const plan = buildRouteCompositionPoints([segment("a", loop)]);

  expect(
    "single lap keeps all points",
    plan.ok && plan.points.length === loop.length,
    plan.ok ? `${plan.points.length} points` : plan.issue.message,
  );
}

// Case 2: a closed loop repeated three times drops the two lap seams.
{
  const plan = buildRouteCompositionPoints([segment("a", loop, { lapCount: 3 })]);

  expect(
    "three laps drop the seam duplicates",
    plan.ok && plan.points.length === 3 * loop.length - 2,
    plan.ok ? `${plan.points.length} points` : plan.issue.message,
  );
  expect(
    "three laps keep the loop closure on the last lap",
    plan.ok &&
      plan.points[plan.points.length - 1].lat === loop[loop.length - 1].lat &&
      plan.points[plan.points.length - 1].lng === loop[loop.length - 1].lng,
    plan.ok ? "last point is the loop closure" : plan.issue.message,
  );
}

// Case 3: an open (non-closed) line repeated twice keeps every point.
{
  const open = [
    { lat: 0, lng: 0 },
    { lat: 0.001, lng: 0.001 },
  ];
  const plan = buildRouteCompositionPoints([segment("a", open, { lapCount: 2 })]);

  expect(
    "an open line repeats all points",
    plan.ok && plan.points.length === 4,
    plan.ok ? `${plan.points.length} points` : plan.issue.message,
  );
}

// Case 4: two contiguous segments append without a gap.
{
  const second = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0.001 },
  ];
  const plan = buildRouteCompositionPoints([
    segment("a", loop, { sortOrder: 0 }),
    segment("b", second, { sortOrder: 1 }),
  ]);

  expect(
    "contiguous segments append",
    plan.ok && plan.points.length === loop.length + second.length,
    plan.ok ? `${plan.points.length} points` : plan.issue.message,
  );
}

// Case 5: a segment starting ~111 m away is refused with a measured gap.
{
  const far = [
    { lat: 0.002, lng: 0 },
    { lat: 0.002, lng: 0.001 },
  ];
  const plan = buildRouteCompositionPoints([segment("a", loop, { sortOrder: 0 }), segment("b", far, { sortOrder: 1 })]);

  expect(
    "a gap beyond the tolerance is refused",
    !plan.ok && plan.issue.code === "GAP" && plan.issue.message.includes(" m"),
    plan.ok ? "plan unexpectedly succeeded" : plan.issue.message,
  );
}

// Case 6: shape refusals.
{
  const duplicateOrder = buildRouteCompositionPoints([
    segment("a", loop, { sortOrder: 0 }),
    segment("b", loop, { sortOrder: 0 }),
  ]);
  expect(
    "duplicate segment order is refused",
    !duplicateOrder.ok && duplicateOrder.issue.code === "DUPLICATE_ORDER",
    duplicateOrder.ok ? "plan unexpectedly succeeded" : duplicateOrder.issue.message,
  );

  const zeroLaps = buildRouteCompositionPoints([segment("a", loop, { lapCount: 0 })]);
  expect(
    "a zero lap count is refused",
    !zeroLaps.ok && zeroLaps.issue.code === "LAP_COUNT",
    zeroLaps.ok ? "plan unexpectedly succeeded" : zeroLaps.issue.message,
  );

  const startRole = buildRouteCompositionPoints([segment("a", loop, { role: "START" })]);
  expect(
    "a start role is refused in this slice",
    !startRole.ok && startRole.issue.code === "NON_MAIN_ROLE",
    startRole.ok ? "plan unexpectedly succeeded" : startRole.issue.message,
  );

  const singlePoint = buildRouteCompositionPoints([segment("a", [{ lat: 0, lng: 0 }])]);
  expect(
    "a one-point child is refused",
    !singlePoint.ok && singlePoint.issue.code === "NOT_ENOUGH_POINTS",
    singlePoint.ok ? "plan unexpectedly succeeded" : singlePoint.issue.message,
  );

  const empty = buildRouteCompositionPoints([]);
  expect(
    "an empty recipe is refused",
    !empty.ok && empty.issue.code === "NO_SEGMENTS",
    empty.ok ? "plan unexpectedly succeeded" : empty.issue.message,
  );
}

// Case 7: the meaningful-recipe rule. It judges a shape-valid recipe only:
// the empty recipe is the shape check's business, not this one's.
{
  const singleLap = validateRouteCompositionMeaning([segment("a", loop)]);
  expect(
    "a one-segment single-lap recipe is refused",
    singleLap?.code === "NOT_MEANINGFUL",
    singleLap?.message ?? "unexpectedly allowed",
  );

  const repeatedLoop = validateRouteCompositionMeaning([segment("a", loop, { lapCount: 3 })]);
  expect("a one-segment repeated loop is meaningful", repeatedLoop === null, repeatedLoop?.message ?? "");

  const twoSegments = validateRouteCompositionMeaning([
    segment("a", loop, { sortOrder: 0 }),
    segment("b", loop, { sortOrder: 1 }),
  ]);
  expect("a two-segment recipe is meaningful", twoSegments === null, twoSegments?.message ?? "");

  const sameRouteTwice = validateRouteCompositionMeaning([
    segment("a", loop, { sortOrder: 0 }),
    segment("a", loop, { sortOrder: 1 }),
  ]);
  expect("the same route used twice is meaningful", sameRouteTwice === null, sameRouteTwice?.message ?? "");
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}

console.log("\nAll route-composition checks passed");
