"use server";

import { InsufficientTrustError, requireTrustGatedAction } from "@/lib/auth-trust-gates.server";
import {
  rebuildRouteCompositionForOwner,
  saveRouteCompositionForOwner,
  type RebuildRouteCompositionResult,
  type SaveRouteCompositionResult,
} from "@/lib/route-composition.server";

// feature-152: the owner-facing entry points of a composite route.
//
// These actions resolve the actor and hand the work to the server-only
// rebuild core. The library UI that calls them ships in
// `outdoor-route-builder`; this slice only makes the recipe storable and
// rebuildable, and keeps the core unreachable from the browser.

export type ReplaceRouteCompositionInput = {
  routeId: string;
  segments: Array<{
    childRouteId: string;
    role?: string;
    sortOrder: number;
    lapCount: number;
  }>;
  /** Required when the parent route is already used by more than one track. */
  confirmShared?: boolean;
};

export type ReplaceRouteCompositionResult = SaveRouteCompositionResult | { ok: false; code: "TRUST"; message: string };

export const replaceRouteComposition = async (
  input: ReplaceRouteCompositionInput,
): Promise<ReplaceRouteCompositionResult> => {
  try {
    const actor = await requireTrustGatedAction("track-upload");
    const routeId = input.routeId?.trim() ?? "";

    if (!routeId) {
      return { ok: false, code: "VALIDATION", message: "Route id is required" };
    }

    if (!Array.isArray(input.segments)) {
      return { ok: false, code: "VALIDATION", message: "A route composition needs at least one segment" };
    }

    const segments = input.segments.map((segment) => ({
      childRouteId: segment.childRouteId?.trim() ?? "",
      role: segment.role?.trim() || "MAIN",
      sortOrder: segment.sortOrder,
      lapCount: segment.lapCount,
    }));

    return await saveRouteCompositionForOwner({
      routeId,
      userId: actor.id,
      segments,
      confirmShared: input.confirmShared,
    });
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not save the route composition",
    };
  }
};

/**
 * Rebuild one composition from its stored recipe. The future **Rebuild route**
 * action calls this; a child edit runs the same core through propagation.
 */
export const rebuildRouteComposition = async (routeId: string): Promise<RebuildRouteCompositionResult> => {
  try {
    const actor = await requireTrustGatedAction("track-upload");
    const normalizedId = routeId?.trim() ?? "";

    if (!normalizedId) {
      return { ok: false, code: "NOT_FOUND", message: "Route not found" };
    }

    return await rebuildRouteCompositionForOwner({ routeId: normalizedId, userId: actor.id });
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "INTERNAL", message: error.message };
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not rebuild the route composition",
    };
  }
};
