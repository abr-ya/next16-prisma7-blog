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
  validateRouteCompositionRecipe,
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

// Case 3: a repeated segment must be a closed loop; an open line with one lap
// is still a valid segment.
{
  const open = [
    { lat: 0, lng: 0 },
    { lat: 0.001, lng: 0.001 },
  ];
  const repeated = buildRouteCompositionPoints([segment("a", open, { lapCount: 2 })]);

  expect(
    "an open line cannot be repeated",
    !repeated.ok && repeated.issue.code === "OPEN_LAP",
    repeated.ok ? "plan unexpectedly succeeded" : repeated.issue.message,
  );

  const singleLap = buildRouteCompositionPoints([segment("a", open)]);

  expect(
    "an open line with one lap keeps its points",
    singleLap.ok && singleLap.points.length === 2,
    singleLap.ok ? `${singleLap.points.length} points` : singleLap.issue.message,
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

  const leadIn = [
    { lat: 0, lng: 0.001 },
    { lat: 0, lng: 0 },
  ];
  const leadOut = [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0.001 },
  ];

  const withConnectors = buildRouteCompositionPoints([
    segment("in", leadIn, { role: "START", sortOrder: 0 }),
    segment("loop", loop, { sortOrder: 1, lapCount: 2 }),
    segment("out", leadOut, { role: "END", sortOrder: 2 }),
  ]);
  expect(
    "a lead-in, two laps, and a lead-out materialize in order",
    withConnectors.ok && withConnectors.points.length === 2 + (2 * loop.length - 1) + 2,
    withConnectors.ok ? `${withConnectors.points.length} points` : withConnectors.issue.message,
  );

  const startNotFirst = buildRouteCompositionPoints([
    segment("loop", loop, { sortOrder: 0 }),
    segment("in", leadIn, { role: "START", sortOrder: 1 }),
  ]);
  expect(
    "a start that is not first is refused",
    !startNotFirst.ok && startNotFirst.issue.code === "ROLE_ORDER",
    startNotFirst.ok ? "plan unexpectedly succeeded" : startNotFirst.issue.message,
  );

  const secondStart = buildRouteCompositionPoints([
    segment("in", leadIn, { role: "START", sortOrder: 0 }),
    segment("in2", leadIn, { role: "START", sortOrder: 1 }),
    segment("loop", loop, { sortOrder: 2 }),
  ]);
  expect(
    "a second start is refused",
    !secondStart.ok && secondStart.issue.code === "ROLE_DUPLICATE",
    secondStart.ok ? "plan unexpectedly succeeded" : secondStart.issue.message,
  );

  const endInTheMiddle = buildRouteCompositionPoints([
    segment("out", leadOut, { role: "END", sortOrder: 0 }),
    segment("loop", loop, { sortOrder: 1 }),
  ]);
  expect(
    "an end that is not last is refused",
    !endInTheMiddle.ok && endInTheMiddle.issue.code === "ROLE_ORDER",
    endInTheMiddle.ok ? "plan unexpectedly succeeded" : endInTheMiddle.issue.message,
  );

  const connectorLaps = buildRouteCompositionPoints([
    segment("in", leadIn, { role: "START", sortOrder: 0, lapCount: 2 }),
    segment("loop", loop, { sortOrder: 1 }),
  ]);
  expect(
    "a start with more than one lap is refused",
    !connectorLaps.ok && connectorLaps.issue.code === "CONNECTOR_LAPS",
    connectorLaps.ok ? "plan unexpectedly succeeded" : connectorLaps.issue.message,
  );

  const noMain = buildRouteCompositionPoints([
    segment("in", leadIn, { role: "START", sortOrder: 0 }),
    segment("out", leadOut, { role: "END", sortOrder: 1 }),
  ]);
  expect(
    "a recipe without a main segment is refused",
    !noMain.ok && noMain.issue.code === "ROLE_MISSING_MAIN",
    noMain.ok ? "plan unexpectedly succeeded" : noMain.issue.message,
  );

  const unknownRole = buildRouteCompositionPoints([segment("a", loop, { role: "FOO" })]);
  expect(
    "an unknown role is refused",
    !unknownRole.ok && unknownRole.issue.code === "ROLE",
    unknownRole.ok ? "plan unexpectedly succeeded" : unknownRole.issue.message,
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

// Case 8: the cheap recipe checks run both the shape and the meaning rule.
{
  const malformed = validateRouteCompositionRecipe([segment("a", loop, { lapCount: 0 })]);
  expect(
    "a malformed recipe is refused by the shape rule",
    malformed?.code === "LAP_COUNT",
    malformed?.message ?? "unexpectedly allowed",
  );

  const degenerate = validateRouteCompositionRecipe([segment("a", loop)]);
  expect(
    "a degenerate recipe is refused by the meaning rule",
    degenerate?.code === "NOT_MEANINGFUL",
    degenerate?.message ?? "unexpectedly allowed",
  );

  const empty = validateRouteCompositionRecipe([]);
  expect(
    "an empty recipe is refused by the shape rule",
    empty?.code === "NO_SEGMENTS",
    empty?.message ?? "unexpectedly allowed",
  );

  const valid = validateRouteCompositionRecipe([
    segment("a", loop, { sortOrder: 0 }),
    segment("b", loop, { sortOrder: 1 }),
  ]);
  expect("a well-formed recipe passes the cheap checks", valid === null, valid?.message ?? "");
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}

console.log("\nAll route-composition checks passed");
