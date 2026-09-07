import type { HikeNoteStatus } from "@/generated/prisma/enums";
import { getHikeMapDays } from "@/lib/hike-map-days";

export type HikeNoteInput = {
  id?: string;
  hikeId: string;
  title: string;
  body?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  dayKey?: string | null;
  status?: HikeNoteStatus;
};

export type HikeNoteMapMarker = {
  noteId: string;
  title: string;
  body: string | null;
  lat: number;
  lng: number;
  dayKeys?: string[];
};

export const hikeNoteStatusOptions = [
  { value: "DRAFT", label: "Private" },
  { value: "PUBLISHED", label: "Public" },
] as const satisfies { value: HikeNoteStatus; label: string }[];

export const formatHikeNoteStatus = (status: HikeNoteStatus) =>
  hikeNoteStatusOptions.find((option) => option.value === status)?.label ?? status;

export const isValidHikeNoteCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180;

export const validateHikeNoteDayKey = ({
  dayKey,
  startDate,
  endDate,
}: {
  dayKey?: string | null;
  startDate: Date | string;
  endDate: Date | string;
}) => {
  if (!dayKey) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) throw new Error("Note day is invalid");
  if (!getHikeMapDays(startDate, endDate).some((day) => day.key === dayKey)) {
    throw new Error("Note day must be within the hike date range");
  }
  return dayKey;
};
