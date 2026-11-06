"use client";

import { useT } from "next-i18next/client";
import { Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { tripsNamespace } from "@/app/i18n/settings";
import type { TrackPointEditorPoint } from "@/lib/track-gpx-edit";

type SpeedPoint = {
  index: number;
  position: number;
  pointNumber: number;
  speedKmh: number | null;
};

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };
const tooltipContentStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export const TrackPointSpeedChart = ({
  points,
  onSelectPoint,
  onSelectRange,
}: {
  points: TrackPointEditorPoint[];
  onSelectPoint: (index: number) => void;
  onSelectRange: (range: { startIndex: number; endIndex: number }) => void;
}) => {
  const { t } = useT(tripsNamespace);
  const data: SpeedPoint[] = points.map((point, position) => ({
    index: point.index,
    position: position + 1,
    pointNumber: point.index + 1,
    speedKmh: point.speedMps === null ? null : point.speedMps * 3.6,
  }));

  if (!data.some((point) => point.speedKmh !== null)) {
    return <p className="text-sm text-muted-foreground">{t("trackPointCleanupNoTimeline")}</p>;
  }

  const handleChartClick = (state: unknown) => {
    const index = (state as { activePayload?: Array<{ payload?: SpeedPoint }> }).activePayload?.[0]?.payload?.index;

    if (typeof index === "number") onSelectPoint(index);
  };

  const handleBrushChange = (range: { startIndex?: number; endIndex?: number }) => {
    const startIndex = Math.max(0, range.startIndex ?? 0);
    const endIndex = Math.min(data.length - 1, range.endIndex ?? data.length - 1);

    // Recharts fires an initial change for the full span; treating it as a
    // selection would mark the whole track before the owner touches anything.
    if (startIndex === 0 && endIndex === data.length - 1) return;

    const start = data[startIndex];
    const end = data[endIndex];

    if (start && end) onSelectRange({ startIndex: start.index, endIndex: end.index });
  };

  return (
    <div className="grid gap-2">
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} onClick={handleChartClick}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="pointNumber" tick={axisTick} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
            <YAxis
              domain={[0, "auto"]}
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value) => `${Math.round(Number(value))}`}
            />
            <Tooltip
              contentStyle={tooltipContentStyle}
              labelStyle={{ color: "var(--muted-foreground)" }}
              labelFormatter={(label) => t("trackPointCleanupPointLabel", { number: label })}
              formatter={(value) => [`${Number(value).toFixed(1)} km/h`, t("trackPointCleanupChartTitle")]}
            />
            <Line
              type="monotone"
              dataKey="speedKmh"
              name={t("trackPointCleanupChartTitle")}
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Brush
              dataKey="pointNumber"
              height={18}
              stroke="var(--chart-1)"
              travellerWidth={8}
              onChange={handleBrushChange}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{t("trackPointCleanupChartTitle")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("trackPointCleanupPointHeader")}</th>
            <th scope="col">{t("trackPointCleanupChartTitle")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.index}>
              <th scope="row">{point.position}</th>
              <td>{point.speedKmh === null ? "—" : `${point.speedKmh.toFixed(1)} km/h`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
