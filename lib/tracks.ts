import type { TrackStatus } from "@/generated/prisma/enums";

export const trackStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
] as const satisfies { value: TrackStatus; label: string }[];

export const formatTrackStatus = (status: TrackStatus) =>
  trackStatusOptions.find((option) => option.value === status)?.label ?? status;
