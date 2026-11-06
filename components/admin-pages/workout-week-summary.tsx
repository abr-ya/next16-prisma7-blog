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
import { WorkoutWeekDayCharts, type WorkoutWeekDayPoint } from "@/components/admin-pages/workout-week-day-charts";

/** feature-136: one activity type's totals for the selected week. */
export type WorkoutWeekCategoryTotals = {
  count: number;
  /** Summed metres of this type's workouts with a parsed distance. */
  distanceMeters: number;
  /** How many of this type's workouts carry a finite distance. */
  distanceCount: number;
};

type WorkoutWeekSummaryProps = {
  selectedWeek: IsoWeekRef;
  activeLanguage: string;
  workoutCount: number;
  /** Summed distance of the workouts that carry one; `null` when none do. */
  distanceMeters: number | null;
  distanceCount: number;
  /** feature-136: seven days, Monday first, for the daily charts. */
  days: WorkoutWeekDayPoint[];
  /** feature-136: per-activity totals shown in the breakdown table. */
  categories: {
    walking: WorkoutWeekCategoryTotals;
    running: WorkoutWeekCategoryTotals;
  };
  /** Localized activity-type names, matching the names the table shows. */
  walkingLabel: string;
  runningLabel: string;
  /** Workouts in the week whose activity type is neither walking nor running. */
  otherActivityCount: number;
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
  days,
  categories,
  walkingLabel,
  runningLabel,
  otherActivityCount,
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
  const breakdownRows = [
    { key: "walking", label: walkingLabel, totals: categories.walking },
    { key: "running", label: runningLabel, totals: categories.running },
  ];
  const formatCategoryDistance = (totals: WorkoutWeekCategoryTotals) => {
    if (totals.count === 0) return null;
    if (totals.distanceCount === 0) return t("workoutWeekSummaryNoDistance");
    return formatTrackDistance(totals.distanceMeters) ?? t("workoutWeekSummaryNoDistance");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="gap-2" aria-label={t("workoutWeekSummaryOpen")}>
          <Footprints className="size-4" />
          <span>{t("workoutWeekSummaryCount", { count: workoutCount })}</span>
          {hasDistance ? <span className="text-muted-foreground">{distance}</span> : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("workoutWeekSummaryTitle")}</DialogTitle>
          <DialogDescription>{weekLabel}</DialogDescription>
        </DialogHeader>
        {workoutCount === 0 ? (
          <p className="text-sm text-muted-foreground">{t("workoutWeekSummaryNoWorkouts")}</p>
        ) : (
          <div className="grid gap-4">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">{t("workoutWeekSummaryWorkoutsLabel")}</dt>
              <dd className="text-right font-medium">{workoutCount}</dd>
              <dt className="text-muted-foreground">{t("workoutWeekSummaryDistanceLabel")}</dt>
              <dd className="text-right font-medium">{hasDistance ? distance : t("workoutWeekSummaryNoDistance")}</dd>
            </dl>
            <table className="w-full text-sm">
              <caption className="pb-2 text-left text-muted-foreground">{t("workoutWeekBreakdownTitle")}</caption>
              <thead>
                <tr className="text-muted-foreground">
                  <th scope="col" className="pb-1 text-left font-normal">
                    {t("workoutWeekSummaryActivityLabel")}
                  </th>
                  <th scope="col" className="pb-1 text-right font-normal">
                    {t("workoutWeekSummaryWorkoutsLabel")}
                  </th>
                  <th scope="col" className="pb-1 text-right font-normal">
                    {t("workoutWeekSummaryDistanceLabel")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdownRows.map((row) => {
                  const rowDistance = formatCategoryDistance(row.totals);

                  return (
                    <tr key={row.key} className="border-t">
                      <th scope="row" className="py-1.5 text-left font-normal">
                        {row.label}
                      </th>
                      <td className="py-1.5 text-right tabular-nums">{row.totals.count}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {rowDistance ?? <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t pt-4">
              <WorkoutWeekDayCharts
                activeLanguage={activeLanguage}
                days={days}
                walkingLabel={walkingLabel}
                runningLabel={runningLabel}
              />
            </div>
            {someWorkoutsMissingDistance ? (
              <p className="text-sm text-muted-foreground">
                {t("workoutWeekSummaryDistanceNote", { count: workoutCount, distanceCount })}
              </p>
            ) : null}
            {otherActivityCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("workoutWeekChartOtherTypes", { count: otherActivityCount })}
              </p>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { WorkoutWeekSummary };
