"use client";

import { useMemo } from "react";

import { FormControl, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/index";
import { gearFitsActivityType } from "@/lib/gear";

// feature-122: the gear an owner attaches to a track. The list narrows itself
// to the gear that fits the activity type of the track — an unclassified item
// fits every type, a classified one only the types it carries.
//
// The component never fetches: the owner receives their gear as a prop. A
// surface that has no gear to show therefore cannot render the field at all,
// and the gear of one owner can never reach the payload of another surface.

export type TrackGearOption = {
  id: string;
  name: string;
  activityTypes: { activityTypeId: string }[];
};

const NO_GEAR_VALUE = "none";

export const TrackGearSelect = ({
  value,
  onChange,
  gear,
  activityTypeId,
  disabled,
  noneLabel = "No gear",
}: {
  value?: string;
  onChange: (value: string) => void;
  gear: TrackGearOption[];
  activityTypeId: string | null;
  disabled?: boolean;
  // feature-123: the wording of the "no gear" choice. The quick upload
  // dialog passes the label of the interface language; the track form keeps
  // the default.
  noneLabel?: string;
}) => {
  const options = useMemo(() => {
    const fitting = gear.filter((item) =>
      gearFitsActivityType(
        item.activityTypes.map((link) => link.activityTypeId),
        activityTypeId,
      ),
    );

    // The attached item is always offered, even when it does not fit the
    // current activity type — the owner has to be able to see what is
    // attached and to clear it.
    if (value && !fitting.some((item) => item.id === value)) {
      const attached = gear.find((item) => item.id === value);

      if (attached) return [...fitting, attached];
    }

    return fitting;
  }, [gear, activityTypeId, value]);

  return (
    <Select
      onValueChange={(next) => onChange(next === NO_GEAR_VALUE ? "" : next)}
      value={value || NO_GEAR_VALUE}
      disabled={disabled}
    >
      <FormControl>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        <SelectItem value={NO_GEAR_VALUE}>{noneLabel}</SelectItem>
        {options.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
