"use server";

import { InsufficientTrustError, requireTrustGatedAction } from "@/lib/auth-trust-gates.server";
import {
  createRouteCompositionForOwner,
  rebuildRouteCompositionForOwner,
  saveRouteCompositionForOwner,
  type RebuildRouteCompositionResult,
  type RouteCompositionSegmentRequest,
  type SaveRouteCompositionResult,
} from "@/lib/route-composition.server";

// feature-152: the owner-facing entry points of a composite route.
// feature-153: the create path joins them, so the library builder can store a
// brand-new parent from its recipe.
//
// These actions resolve the actor and hand the work to the server-only
// composition core. The core stays unreachable from the browser, so an
// internal `userId` cannot be spoofed the way an action argument could.

export type CreateCompositeRouteInput = {
  title: string;
  description?: string | null;
  segments: RouteCompositionSegmentRequest[];
};

export type CreateCompositeRouteResult =
  | { ok: true; routeId: string; pointCount: number }
  | { ok: false; code: "TRUST" | "VALIDATION" | "INTERNAL"; message: string };

/**
 * feature-153: create a composite route from a recipe.
 *
 * The action resolves the actor and hands the recipe to the server-only core,
 * which validates it, generates the geometry and stores the parent route with
 * its composition. Uploading a generated GPX follows the same trust gate as
 * creating a plain route.
 */
export const createCompositeRoute = async (input: CreateCompositeRouteInput): Promise<CreateCompositeRouteResult> => {
  try {
    const actor = await requireTrustGatedAction("track-upload");
    const title = input.title?.trim() ?? "";

    if (!title) {
      return { ok: false, code: "VALIDATION", message: "Route title is required" };
    }

    if (!Array.isArray(input.segments)) {
      return { ok: false, code: "VALIDATION", message: "A route composition needs at least one segment" };
    }

    return await createRouteCompositionForOwner({
      userId: actor.id,
      title,
      description: input.description,
      segments: input.segments,
    });
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not create the route composition",
    };
  }
};

export type ReplaceRouteCompositionInput = {
  routeId: string;
  segments: RouteCompositionSegmentRequest[];
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

    return await saveRouteCompositionForOwner({
      routeId,
      userId: actor.id,
      segments: input.segments,
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
