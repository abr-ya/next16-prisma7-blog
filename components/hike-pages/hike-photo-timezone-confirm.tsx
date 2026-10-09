"use client";

import { useState, useTransition } from "react";
import { useT } from "next-i18next/client";
import { toast } from "sonner";

import {
  clearHikePhotoCaptureTimezone,
  confirmHikePhotoCaptureTimezone,
  type HikePhotoDetail,
} from "@/app/_data/hikes";
import { tripsNamespace } from "@/app/i18n/settings";
import { Badge, Button, Input } from "@/components/index";
import { formatPhotoCaptureTimeContext } from "@/lib/photo-exif-metadata";

const NO_PERMISSION_MESSAGE = "You cannot clear this photo timezone";
const NO_NORMALIZATION_MESSAGE = "This photo has no capture-time normalization to reset";

export const HikePhotoTimezoneConfirm = ({ detail, onChanged }: { detail: HikePhotoDetail; onChanged: () => void }) => {
  const { t } = useT(tripsNamespace);
  const [isPending, startTransition] = useTransition();
  const initialTimeZone = detail.captureTimeAssumption?.timeZone ?? detail.linkedTrackTimezones[0] ?? "";
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const hasNormalization = Boolean(detail.captureTimeAssumption);

  const handleConfirm = () => {
    if (!timeZone.trim()) return;
    startTransition(async () => {
      try {
        await confirmHikePhotoCaptureTimezone({
          hikeId: detail.hikeId,
          photoId: detail.photoId,
          timeZone,
        });
        toast.success(t("photoTimezoneConfirmed"));
        onChanged();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("photoTimezoneConfirmError"));
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      try {
        await clearHikePhotoCaptureTimezone({ hikeId: detail.hikeId, photoId: detail.photoId });
        toast.success(t("photoTimezoneResetSuccess"));
        onChanged();
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === NO_PERMISSION_MESSAGE) {
          toast.error(t("photoTimezoneResetNoPermission"));
        } else if (message === NO_NORMALIZATION_MESSAGE) {
          toast.error(t("photoTimezoneResetNoNormalization"));
        } else {
          toast.error(message || t("photoTimezoneResetError"));
        }
      }
    });
  };

  const captureSummary = detail.captureSummary;
  const context = captureSummary
    ? formatPhotoCaptureTimeContext({
        capturedAt: captureSummary.capturedAt,
        timezoneEvidence: captureSummary.captureTimeTimezoneEvidence,
      })
    : null;
  const captureSource = captureSummary?.captureTimeProvenance?.source ?? null;

  return (
    <section className="grid gap-4">
      <div className="grid gap-2 rounded-md border border-dashed p-3 text-sm">
        <p className="text-muted-foreground">
          {context
            ? `${t("photoTimezoneCaptureTime")}: ${context.storedUtc} · ${context.timezoneEvidence}`
            : t("photoTimezoneCaptureUnavailable")}
        </p>
        {captureSource ? (
          <p className="text-muted-foreground">
            {t("photoTimezoneCaptureSource")}: {captureSource}
          </p>
        ) : null}
        {detail.linkedTrackTimezones.length > 0 ? (
          <p className="text-muted-foreground">
            {t("photoTimezoneLinkedTrackLabel")}: {detail.linkedTrackTimezones.join(", ")}
          </p>
        ) : null}
        {detail.captureTimeAssumption ? (
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline">{detail.captureTimeAssumption.timeZone}</Badge>
            <Badge variant={detail.captureTimeAssumption.provenance === "USER_CONFIRMED" ? "secondary" : "outline"}>
              {detail.captureTimeAssumption.provenance === "USER_CONFIRMED"
                ? t("photoTimezoneProvenanceConfirmed")
                : t("photoTimezoneProvenanceTrackDefault")}
            </Badge>
          </div>
        ) : null}
      </div>
      <div className="grid gap-2">
        <label className="grid gap-1 text-xs font-medium">
          {t("photoTimezoneIanaLabel")}
          <Input
            list="photo-capture-timezone-options-timezone-confirm"
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
            placeholder={t("photoTimezoneIanaPlaceholder")}
            autoComplete="off"
          />
        </label>
        <datalist id="photo-capture-timezone-options-timezone-confirm">
          <option value="UTC" />
          <option value="Europe/Sofia" />
          <option value="Europe/Moscow" />
          <option value="America/New_York" />
        </datalist>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending || !hasNormalization}
            onClick={handleReset}
          >
            {t("photoTimezoneResetButton")}
          </Button>
          <Button type="button" size="sm" disabled={isPending || !timeZone.trim()} onClick={handleConfirm}>
            {t("photoTimezoneConfirmButton")}
          </Button>
        </div>
        {!hasNormalization ? (
          <p className="text-xs text-muted-foreground">{t("photoTimezoneResetUnavailableHint")}</p>
        ) : null}
      </div>
    </section>
  );
};
