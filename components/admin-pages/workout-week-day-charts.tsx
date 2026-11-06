"use client";

import { useT } from "next-i18next/client";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { tripsNamespace } from "@/app/i18n/settings";
import { formatTrackDistance } from "@/lib/track-gpx-metadata";

/** feature-136: one day of the selected ISO week, Monday first. */
export type WorkoutWeekDayPoint = {
  walkingCount: number;
  runningCount: number;
  /** Summed metres of the walking workouts with a parsed distance; `0` when none. */
  walkingDistanceMeters: number;
  /** Summed metres of the running workouts with a parsed distance; `0` when none. */
  runningDistanceMeters: number;
};

type WorkoutWeekDayChartsProps = {
  activeLanguage: string;
  /** Seven entries, Monday through Sunday. */
  days: WorkoutWeekDayPoint[];
  walkingLabel: string;
  runningLabel: string;
};

type ChartSeries = {
  dataKey: string;
  name: string;
  color: string;
};

type AccessibleChartTableProps = {
  caption: string;
  dayHeader: string;
  headers: string[];
  rows: { day: string; values: string[] }[];
};

// A real table is the accessible view of the chart: it carries every value
// the SVG draws, for screen readers and for anyone reading the dialog as text.
const AccessibleChartTable = ({ caption, dayHeader, headers, rows }: AccessibleChartTableProps) => (
  <table className="sr-only">
    <caption>{caption}</caption>
    <thead>
      <tr>
        <th scope="col">{dayHeader}</th>
        {headers.map((header) => (
          <th key={header} scope="col">
            {header}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.day}>
          <th scope="row">{row.day}</th>
          {row.values.map((value, index) => (
            <td key={headers[index] ?? index}>{value}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };
const axisLine = { stroke: "var(--border)" };
const tooltipContentStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

/**
 * feature-136: the two charts of the Week summary dialog. Values stay in
 * metres until formatting, and missing distances are drawn as absent bars
 * rather than as a recorded zero.
 */
const WorkoutWeekDayCharts = ({ activeLanguage, days, walkingLabel, runningLabel }: WorkoutWeekDayChartsProps) => {
  const { t } = useT(tripsNamespace);

  // 1 January 2024 is a Monday; using a fixed reference week keeps the labels
  // independent of the week being viewed while staying localized.
  const dayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(activeLanguage, { weekday: "short" }).format(new Date(2024, 0, 1 + index, 12)),
      ),
    [activeLanguage],
  );

  const chartData = days.map((day, index) => ({
    day: dayLabels[index] ?? "",
    walkingCount: day.walkingCount,
    runningCount: day.runningCount,
    walkingDistanceMeters: day.walkingDistanceMeters,
    runningDistanceMeters: day.runningDistanceMeters,
  }));

  const hasActivity = days.some((day) => day.walkingCount > 0 || day.runningCount > 0);
  const hasDistance = days.some((day) => day.walkingDistanceMeters > 0 || day.runningDistanceMeters > 0);
  const maxCount = Math.max(1, ...days.map((day) => Math.max(day.walkingCount, day.runningCount)));
  const maxDistance = Math.max(1, ...days.map((day) => Math.max(day.walkingDistanceMeters, day.runningDistanceMeters)));

  if (!hasActivity) {
    return <p className="text-sm text-muted-foreground">{t("workoutWeekChartNoActivity")}</p>;
  }

  const countSeries: ChartSeries[] = [
    { dataKey: "walkingCount", name: walkingLabel, color: "var(--chart-1)" },
    { dataKey: "runningCount", name: runningLabel, color: "var(--chart-2)" },
  ];
  const distanceSeries: ChartSeries[] = [
    { dataKey: "walkingDistanceMeters", name: walkingLabel, color: "var(--chart-1)" },
    { dataKey: "runningDistanceMeters", name: runningLabel, color: "var(--chart-2)" },
  ];

  return (
    <div className="grid gap-5">
      <figure className="grid gap-2">
        <figcaption className="text-sm font-medium">{t("workoutWeekChartCountTitle")}</figcaption>
        <div className="h-44 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" interval={0} tick={axisTick} tickLine={false} axisLine={axisLine} />
              <YAxis
                allowDecimals={false}
                domain={[0, maxCount]}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                contentStyle={tooltipContentStyle}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(value) => String(Number(value))}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {countSeries.map((series) => (
                <Bar
                  key={series.dataKey}
                  dataKey={series.dataKey}
                  name={series.name}
                  fill={series.color}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={16}
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <AccessibleChartTable
          caption={t("workoutWeekChartCountTitle")}
          dayHeader={t("workoutWeekChartDayLabel")}
          headers={[walkingLabel, runningLabel]}
          rows={chartData.map((day) => ({
            day: day.day,
            values: [String(day.walkingCount), String(day.runningCount)],
          }))}
        />
      </figure>
      {hasDistance ? (
        <figure className="grid gap-2">
          <figcaption className="text-sm font-medium">{t("workoutWeekChartDistanceTitle")}</figcaption>
          <div className="h-44 w-full" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={4}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" interval={0} tick={axisTick} tickLine={false} axisLine={axisLine} />
                <YAxis
                  domain={[0, maxDistance]}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(value) => formatTrackDistance(Number(value)) ?? ""}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)", opacity: 0.4 }}
                  contentStyle={tooltipContentStyle}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                  formatter={(value) => {
                    const meters = Number(value);

                    return meters > 0 ? (formatTrackDistance(meters) ?? "—") : "—";
                  }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                {distanceSeries.map((series) => (
                  <Bar
                    key={series.dataKey}
                    dataKey={series.dataKey}
                    name={series.name}
                    fill={series.color}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={16}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <AccessibleChartTable
            caption={t("workoutWeekChartDistanceTitle")}
            dayHeader={t("workoutWeekChartDayLabel")}
            headers={[walkingLabel, runningLabel]}
            rows={chartData.map((day) => ({
              day: day.day,
              values: [
                day.walkingDistanceMeters > 0 ? (formatTrackDistance(day.walkingDistanceMeters) ?? "—") : "—",
                day.runningDistanceMeters > 0 ? (formatTrackDistance(day.runningDistanceMeters) ?? "—") : "—",
              ],
            }))}
          />
        </figure>
      ) : (
        <p className="text-sm text-muted-foreground">{t("workoutWeekChartNoDistance")}</p>
      )}
    </div>
  );
};

export { WorkoutWeekDayCharts };
