// feature-121: the gear list shows the borrowed activity type in the
// interface language, with the English name as the fallback — the same rule
// the track tables apply to the activity type.

export type GearActivityTypeName = {
  id: string;
  nameEn: string;
  nameRu?: string | null;
};

export const formatGearActivityTypeName = (activityType: GearActivityTypeName | null, language?: string) =>
  activityType ? (language === "ru" ? activityType.nameRu || activityType.nameEn : activityType.nameEn) : "";

export const gearActivityTypeOptions = (activityTypes: GearActivityTypeName[], language?: string) =>
  activityTypes.map((activityType) => ({
    id: activityType.id,
    label: formatGearActivityTypeName(activityType, language),
  }));
