import type { Prisma } from "@/generated/prisma/client";
import type { FileAssetStatus, HikeStatus, HikeType, PhotoStatus, TrackStatus } from "@/generated/prisma/enums";
import type { HikePhotoMapMarker } from "@/lib/hikes";
import type { HikeNoteMapMarker } from "@/lib/hike-notes";
import type { PhotoExifMetadata, PhotoExifSummary, PhotoMapCoordinate } from "@/lib/photo-exif-metadata";
import type { TrackTimeMatchCandidate, TrackTimeMatchPhotoInput } from "@/lib/outdoor-photo-track-time-matching";
import type { TrackGpxSummary, TrackGpxTimedPoint, TrackMapViewModel } from "@/lib/track-gpx-metadata";

const ACTIVE_FILE_STATUS: FileAssetStatus = "ACTIVE";

export const hikeListInclude = {
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  tracks: {
    orderBy: {
      assignedAt: "desc",
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          slug: true,
          recordingTimezone: true,
          status: true,
          metadata: true,
          fileAsset: {
            select: {
              id: true,
              fileKey: true,
            },
          },
        },
      },
    },
  },
  photos: {
    orderBy: [{ position: "asc" }, { assignedAt: "desc" }],
    include: {
      photo: {
        select: {
          id: true,
          title: true,
          status: true,
          metadata: true,
          images: {
            orderBy: {
              sortOrder: "asc",
            },
            take: 1,
            select: {
              fileAsset: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                },
              },
            },
          },
        },
      },
    },
  },
  notes: { orderBy: [{ dayKey: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.HikeInclude;

export const publicHikeInclude = {
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  tracks: {
    where: {
      track: {
        status: "PUBLISHED",
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          recordingTimezone: true,
          status: true,
          updatedAt: true,
          metadata: true,
          fileAsset: {
            select: {
              id: true,
              fileKey: true,
            },
          },
        },
      },
    },
  },
  photos: {
    where: {
      photo: {
        status: "PUBLISHED",
      },
    },
    orderBy: [{ position: "asc" }, { assignedAt: "desc" }],
    include: {
      photo: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          metadata: true,
          images: {
            where: {
              fileAsset: {
                status: ACTIVE_FILE_STATUS,
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              sortOrder: true,
              fileAsset: {
                select: {
                  id: true,
                  name: true,
                  mimeType: true,
                  sizeBytes: true,
                },
              },
            },
          },
        },
      },
    },
  },
  notes: {
    where: { status: "PUBLISHED", latitude: { not: null }, longitude: { not: null } },
    orderBy: [{ dayKey: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, body: true, latitude: true, longitude: true, dayKey: true },
  },
} satisfies Prisma.HikeInclude;

export type HikeActionValues = {
  id?: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  type: HikeType;
  status?: HikeStatus;
};

export type HikeTrackOption = {
  id: string;
  title: string;
  slug: string;
  status: TrackStatus;
};

export type HikePhotoOption = {
  id: string;
  title: string;
  status: PhotoStatus;
  trackTimeMatch: TrackTimeMatchPhotoInput;
  mapCoordinate: PhotoMapCoordinate | null;
  previewImage: {
    id: string;
    name: string;
    thumbnailUrl: string;
  } | null;
};

// Internal helper types (sibling-only — not re-exported from index.ts)
export type HikePhotoOptionRecord = {
  id: string;
  title: string;
  status: PhotoStatus;
  metadata: Prisma.JsonValue | null;
  images: {
    fileAsset: NonNullable<HikePhotoOption["previewImage"]>;
  }[];
};

export type HikePhotoIdAssociation = {
  photoId: string;
};

export type HikeTrackAssociationWithStoredMetadata = {
  track: {
    metadata: Prisma.JsonValue | null;
    fileAsset: { id: string; fileKey: string };
  };
};

export type HikeListItem = Prisma.HikeGetPayload<{
  include: typeof hikeListInclude;
}>;

export type HikeViewerStatus = "creator" | "participant" | "viewer";

export type PublicHikeListItem = HikeListItem & {
  viewerStatus: HikeViewerStatus;
};

export type PublicHikeRecord = Prisma.HikeGetPayload<{
  include: typeof publicHikeInclude;
}>;

export type PublicHike = Omit<PublicHikeRecord, "tracks" | "photos" | "notes"> & {
  tracks: {
    hikeId: string;
    trackId: string;
    assignedAt: Date;
    track: {
      id: string;
      title: string;
      slug: string;
      description: string | null;
      recordingTimezone: string | null;
      status: TrackStatus;
      updatedAt: Date;
      parsed: {
        summary: TrackGpxSummary;
      } | null;
      map: TrackMapViewModel | null;
    };
  }[];
  photos: {
    hikeId: string;
    photoId: string;
    position: number;
    assignedAt: Date;
    photo: Omit<PublicHikeRecord["photos"][number]["photo"], "metadata"> & { captureInstant: string | null };
  }[];
  photoMapMarkers: HikePhotoMapMarker[];
  noteMapMarkers: HikeNoteMapMarker[];
};

export type HikeParticipantManagement = {
  hike: { id: string; slug: string; title: string };
  pendingInvitations: { id: string; email: string; name: string; invitedAt: Date }[];
  acceptedParticipants: { id: string; email: string; name: string; acceptedAt: Date | null }[];
};

export type HikePhotoContributionCapability = {
  hikeId: string;
  remainingPhotoCount: number | null;
};

export type HikeTrackContributionCapability = {
  hikeId: string;
  viewer: "anonymous" | "non-owner" | "owner-trust-ineligible" | "owner-quota-reached" | "owner-eligible";
  eligible: boolean;
  remainingTrackCount: number | null;
};

export type CreatorUnlinkedTrack = {
  id: string;
  title: string;
  slug: string;
  updatedAt: Date;
  parseState: "PARSED" | "NOT_PARSED";
};

export type CreateTrackAndAttachToHikeInput = {
  hikeId: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  status?: TrackStatus;
  fileAssetId: string;
  recordingTimezone?: string | null;
  activityTypeId?: string | null;
};

export type CreateTrackAndAttachToHikeResult =
  | { ok: true; trackId: string; trackSlug: string }
  | {
      ok: false;
      code: "TRUST" | "QUOTA" | "VALIDATION" | "SLUG" | "INTERNAL";
      message: string;
    };

export type HikePhotoLikeState = {
  isLikedByViewer: boolean;
};

export type MyLikedHikePhoto = {
  id: string;
  likedAt: Date;
  photo: {
    id: string;
    title: string;
    description: string | null;
    trips: { id: string; slug: string; title: string }[];
  };
};

export type MyLikedHikePhotoRecord = {
  id: string;
  createdAt: Date;
  photo: {
    id: string;
    title: string;
    description: string | null;
    hikes: { hike: { id: string; slug: string; title: string } }[];
  };
};

export type HikePhotoAcceptedCoordinate = {
  lat: number;
  lng: number;
  source: "DIRECT_EXIF" | "INFERRED_TRACK_TIME" | "MANUALLY_CORRECTED";
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
  placementMethod: PhotoMapCoordinate["placementMethod"] | "DIRECT_EXIF";
  explanation: string | null;
};

export type HikePhotoDetail = {
  hikeId: string;
  photoId: string;
  captureSummary: PhotoExifSummary | null;
  adminExifMetadata: PhotoExifMetadata | null;
  linkedTrackTimezones: string[];
  captureTimeAssumption: { timeZone: string; provenance: "TRACK_DEFAULT" | "USER_CONFIRMED" } | null;
  timezoneConfirmationRequired: boolean;
  canRefreshExif: boolean;
  requiresCameraTimeRefresh: boolean;
  acceptedCoordinate: HikePhotoAcceptedCoordinate | null;
  canReviewCoordinate: boolean;
  isAdmin: boolean;
  candidates: TrackTimeMatchCandidate[];
  previewByCandidateId: Record<
    string,
    { track: TrackMapViewModel; timeline: TrackGpxTimedPoint[]; capturedAt: string }
  >;
};

export type PendingHikeInvitation = {
  id: string;
  hike: { title: string; slug: string; startDate: Date; endDate: Date };
  invitedAt: Date;
};

/**
 * Read-only projection used by the public `/trips` listing to render an
 * accurate disabled state for the trip-creation entry point. Reasons are
 * intentionally narrow (no trust level, quota count, or other account data)
 * because this projection is consumed by anonymous viewers.
 *
 * `createHike` remains the authoritative server gate: a stale projection
 * only results in an actionable submission error, never in a hidden privilege
 * bypass.
 */
export type PublicTripCreationCapability =
  | { eligible: true }
  | { eligible: false; reason: "anonymous" | "insufficient-trust" | "verified-trip-quota-reached" };

export type HikePhotoContributionValues = {
  hikeId: string;
  title: string;
  description?: string | null;
  fileAssetIds?: string[] | null;
};
