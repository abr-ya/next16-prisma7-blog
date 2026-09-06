import type { HikeStatus, HikeType } from "@/generated/prisma/enums";

export type HikePhotoMapMarker = {
  photoId: string;
  title: string;
  lat: number;
  lng: number;
  thumbnailUrl: string | null;
  dayKeys?: string[];
};

export const hikeTypeOptions = [
  { value: "HIKING", label: "Hiking" },
  { value: "MOUNTAIN", label: "Mountain" },
  { value: "WATER", label: "Water" },
  { value: "SKI", label: "Ski" },
  { value: "BIKE", label: "Bike" },
  { value: "OTHER", label: "Other" },
] as const satisfies { value: HikeType; label: string }[];

export const hikeStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
] as const satisfies { value: HikeStatus; label: string }[];

export const formatHikeType = (type: HikeType) =>
  hikeTypeOptions.find((option) => option.value === type)?.label ?? type;

export const formatHikeStatus = (status: HikeStatus) =>
  hikeStatusOptions.find((option) => option.value === status)?.label ?? status;

export const formatHikeDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

export const formatHikeDateRange = ({ startDate, endDate }: { startDate: Date | string; endDate: Date | string }) =>
  `${formatHikeDate(startDate)} - ${formatHikeDate(endDate)}`;
