"use client";

import { Footprints } from "lucide-react";
import { useT } from "next-i18next/client";
import { useState } from "react";

import { tripsNamespace } from "@/app/i18n/settings";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/index";
import { formatIsoWeekRange, getIsoWeekRange, type IsoWeekRef } from "@/lib/track-iso-week";
import { formatTrackDistance } from "@/lib/track-gpx-metadata";

type WorkoutWeekSummaryProps = {
  selectedWeek: IsoWeekRef;
  activeLanguage: string;
  workoutCount: number;
  /** Summed distance of the workouts that carry one; `null` when none do. */
  distanceMeters: number | null;
  distanceCount: number;
};

/**
 * feature-135: the compact summary next to the week filter. Both the button
 * and the dialog describe the whole selected week, so the numbers come from
 * the panel's complete filtered set rather than from the rendered page.
 */
const WorkoutWeekSummary = ({
  selectedWeek,
  activeLanguage,
  workoutCount,
  distanceMeters,
  distanceCount,
}: WorkoutWeekSummaryProps) => {
  const { t } = useT(tripsNamespace);
  const [open, setOpen] = useState(false);

  const weekLabel = t("workoutWeekLabel", {
    week: selectedWeek.week,
    range: formatIsoWeekRange(getIsoWeekRange(selectedWeek.isoYear, selectedWeek.week), activeLanguage),
  });
  const distance = formatTrackDistance(distanceMeters);
  const hasDistance = distance !== null;
  const someWorkoutsMissingDistance = hasDistance && distanceCount < workoutCount;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-2" aria-label={t("workoutWeekSummaryOpen")}>
          <Footprints className="size-4" />
          <span>{t("workoutWeekSummaryCount", { count: workoutCount })}</span>
          {hasDistance ? <span className="text-muted-foreground">{distance}</span> : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("workoutWeekSummaryTitle")}</DialogTitle>
          <DialogDescription>{weekLabel}</DialogDescription>
        </DialogHeader>
        {workoutCount === 0 ? (
          <p className="text-sm text-muted-foreground">{t("workoutWeekSummaryNoWorkouts")}</p>
        ) : (
          <div className="grid gap-3">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">{t("workoutWeekSummaryWorkoutsLabel")}</dt>
              <dd className="text-right font-medium">{workoutCount}</dd>
              <dt className="text-muted-foreground">{t("workoutWeekSummaryDistanceLabel")}</dt>
              <dd className="text-right font-medium">{hasDistance ? distance : t("workoutWeekSummaryNoDistance")}</dd>
            </dl>
            {someWorkoutsMissingDistance ? (
              <p className="text-sm text-muted-foreground">
                {t("workoutWeekSummaryDistanceNote", { count: workoutCount, distanceCount })}
              </p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { WorkoutWeekSummary };
