// feature-121: the gear list shows the borrowed activity types in the
// interface language, with the English name as the fallback — the same rule
// the track tables apply to the activity type. A gear item carries a set of
// them, so the helpers work over a list rather than over a single record.

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

/**
 * The activity types of one gear item, ready for the table cell. A type that
 * was deactivated after it was attached keeps its name — the classification
 * stays, the dictionary value only stops being offered for new attachments.
 */
export const gearActivityTypeLabels = (
  activityTypes: { activityType: GearActivityTypeName }[],
  language?: string,
): string[] =>
  activityTypes
    .map(({ activityType }) => formatGearActivityTypeName(activityType, language))
    .filter((label): label is string => Boolean(label));
