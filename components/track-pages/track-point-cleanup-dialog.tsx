"use client";

import { Eraser } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  cleanTrackPoints,
  getTrackPointCleanupData,
  type TrackPointCleanupData,
} from "@/app/_data/track-point-cleanup";
import { tripsNamespace } from "@/app/i18n/settings";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "@/components/index";
import { TrackPointSpeedChart } from "@/components/track-pages/track-point-speed-chart";
import {
  estimateDistanceAfterCleanup,
  isPointWithinCleanupWindow,
  normalizeIndexRanges,
  type TrackPointIndexRange,
} from "@/lib/track-gpx-edit";
import { formatTrackDistance } from "@/lib/track-gpx-metadata";

const TrackPointCleanupMap = dynamic(
  () => import("@/components/track-pages/track-point-cleanup-map").then((module) => module.TrackPointCleanupMap),
  {
    ssr: false,
    loading: () => <div className="h-56 w-full animate-pulse rounded-md bg-muted" />,
  },
);

export const TrackPointCleanupButton = ({ trackId, trackTitle }: { trackId: string; trackTitle: string }) => {
  const { t } = useT(tripsNamespace);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackPointCleanupData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [clickedIndices, setClickedIndices] = useState<number[]>([]);
  const [ranges, setRanges] = useState<TrackPointIndexRange[]>([]);
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [rangeError, setRangeError] = useState<string | null>(null);

  const pointsByIndex = useMemo(() => new Map((data?.points ?? []).map((point) => [point.index, point])), [data]);

  const resetSelection = () => {
    setClickedIndices([]);
    setRanges([]);
    setRangeFrom("");
    setRangeTo("");
    setRangeError(null);
    setSaveError(null);
  };

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    setData(null);
    resetSelection();

    const result = await getTrackPointCleanupData(trackId);

    if (result.ok) {
      setData(result.data);
    } else {
      setLoadError(result.message);
    }

    setLoading(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      void load();
    } else {
      setData(null);
      resetSelection();
    }
  };

  const isSelected = (index: number) => {
    if (ranges.some((range) => index >= range.startIndex && index <= range.endIndex)) return true;

    const point = pointsByIndex.get(index);
    if (!point) return false;

    return clickedIndices.some((clickedIndex) => {
      const clicked = pointsByIndex.get(clickedIndex);

      return clicked ? isPointWithinCleanupWindow(point, clicked) : false;
    });
  };

  const applyRange = (range: TrackPointIndexRange, { syncFields = true }: { syncFields?: boolean } = {}) => {
    if (!data) return;

    const [normalized] = normalizeIndexRanges([range], data.totalPoints);

    if (!normalized) return;

    setRanges([normalized]);
    setClickedIndices([]);

    if (syncFields) {
      setRangeFrom(String(normalized.startIndex + 1));
      setRangeTo(String(normalized.endIndex + 1));
    }

    setRangeError(null);
  };

  const handleRangeInput = (field: "from" | "to", value: string) => {
    if (field === "from") {
      setRangeFrom(value);
    } else {
      setRangeTo(value);
    }

    if (!data) return;

    const from = Number.parseInt(field === "from" ? value : rangeFrom, 10);
    const to = Number.parseInt(field === "to" ? value : rangeTo, 10);

    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 1 ||
      to < 1 ||
      from > data.totalPoints ||
      to > data.totalPoints
    ) {
      return;
    }

    // Live feedback: the map and chart follow the typed numbers as soon as
    // both are valid, without rewriting what the owner is typing.
    applyRange({ startIndex: Math.min(from, to) - 1, endIndex: Math.max(from, to) - 1 }, { syncFields: false });
  };

  const togglePoint = (index: number) => {
    setRangeError(null);

    if (clickedIndices.length === 0) {
      // A fresh click starts a new selection and clears any previous range.
      setRanges([]);
      setRangeFrom("");
      setRangeTo("");
      setClickedIndices([index]);
      return;
    }

    if (clickedIndices.length === 1) {
      const first = clickedIndices[0]!;

      if (first === index) {
        setClickedIndices([]);
        return;
      }

      // The second click closes the range between the two points.
      applyRange({ startIndex: Math.min(first, index), endIndex: Math.max(first, index) });
      return;
    }

    setRanges([]);
    setClickedIndices([index]);
  };

  const selectRange = (range: TrackPointIndexRange) => {
    applyRange(range);
  };

  const handleApplyTypedRange = () => {
    if (!data) return;

    const from = Number.parseInt(rangeFrom, 10);
    const to = Number.parseInt(rangeTo, 10);

    if (
      !Number.isInteger(from) ||
      !Number.isInteger(to) ||
      from < 1 ||
      to < 1 ||
      from > data.totalPoints ||
      to > data.totalPoints
    ) {
      setRangeError(t("trackPointCleanupRangeInvalid", { total: data.totalPoints }));
      return;
    }

    applyRange({ startIndex: Math.min(from, to) - 1, endIndex: Math.max(from, to) - 1 });
  };

  const selectedCount = data ? data.points.filter((point) => isSelected(point.index)).length : 0;
  const estimatedDistanceMeters =
    data && selectedCount > 0
      ? estimateDistanceAfterCleanup(data, { ranges, clickedIndices })
      : (data?.distanceMeters ?? 0);

  const handleSave = async () => {
    if (!data) return;

    setSaving(true);
    setSaveError(null);

    const result = await cleanTrackPoints({
      trackId: data.trackId,
      fileAssetId: data.fileAssetId,
      selection: { ranges, clickedIndices },
    });

    setSaving(false);

    if (!result.ok) {
      setSaveError(
        result.code === "STALE"
          ? t("trackPointCleanupStale")
          : result.code === "VALIDATION"
            ? t("trackPointCleanupValidation")
            : result.code === "INTERNAL"
              ? t("trackPointCleanupError")
              : result.message,
      );
      return;
    }

    toast.success(t("trackPointCleanupSuccess", { count: result.removedCount }));
    setOpen(false);
    setData(null);
    resetSelection();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Eraser />
          {t("trackPointCleanupAction")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-5xl">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t("trackPointCleanupTitle")}</DialogTitle>
          <DialogDescription>{t("trackPointCleanupDescription", { title: trackTitle })}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t("trackPointCleanupLoading")}</p>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : data ? (
            <div className="grid gap-4">
              <section className="grid gap-2">
                <h3 className="text-sm font-medium">{t("trackPointCleanupMapTitle")}</h3>
                <div className="h-56 overflow-hidden rounded-md border">
                  <TrackPointCleanupMap
                    points={data.points}
                    bounds={data.bounds}
                    isSelected={isSelected}
                    onSelectPoint={togglePoint}
                  />
                </div>
              </section>
              {data.hasTimeline ? (
                <section className="grid gap-2">
                  <h3 className="text-sm font-medium">{t("trackPointCleanupChartTitle")}</h3>
                  <TrackPointSpeedChart points={data.points} onSelectPoint={togglePoint} onSelectRange={selectRange} />
                </section>
              ) : (
                <p className="text-sm text-muted-foreground">{t("trackPointCleanupNoTimeline")}</p>
              )}
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">{t("trackPointCleanupRangeFrom")}</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={data.totalPoints}
                    value={rangeFrom}
                    onChange={(event) => handleRangeInput("from", event.target.value)}
                    className="w-28"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-muted-foreground">{t("trackPointCleanupRangeTo")}</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={data.totalPoints}
                    value={rangeTo}
                    onChange={(event) => handleRangeInput("to", event.target.value)}
                    className="w-28"
                  />
                </label>
                <Button type="button" variant="outline" onClick={handleApplyTypedRange}>
                  {t("trackPointCleanupRangeApply")}
                </Button>
              </div>
              {rangeError ? <p className="text-sm text-destructive">{rangeError}</p> : null}
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {t("trackPointCleanupSelected", { count: selectedCount })}
              </p>
              {selectedCount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("trackPointCleanupDistance", {
                    current: formatTrackDistance(data.distanceMeters) ?? "—",
                    after: formatTrackDistance(estimatedDistanceMeters) ?? "—",
                  })}
                </p>
              ) : null}
              {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}
            </div>
          ) : null}
        </div>
        {data ? (
          <DialogFooter className="shrink-0">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {t("trackPointCleanupCancel")}
            </Button>
            <Button type="button" onClick={() => void handleSave()} disabled={saving || selectedCount === 0}>
              {saving ? t("trackPointCleanupSaving") : t("trackPointCleanupSave")}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
