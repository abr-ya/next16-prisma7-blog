"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useId, useState } from "react";
import { toast } from "sonner";

import { renameTrackFileAsset } from "@/app/_actions/files";
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

const GPX_SUFFIX = ".gpx";

/** The field holds the base name; the suffix is fixed and shown next to it. */
const toBaseName = (fileName: string) =>
  fileName.toLowerCase().endsWith(GPX_SUFFIX) ? fileName.slice(0, -GPX_SUFFIX.length) : fileName;

export const TrackFileRenameButton = ({ trackId, fileName }: { trackId: string; fileName: string }) => {
  const { t } = useT(tripsNamespace);
  const router = useRouter();
  const fieldId = useId();
  const [open, setOpen] = useState(false);
  const [baseName, setBaseName] = useState(() => toBaseName(fileName));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      // The field always starts from the name the file carries right now.
      setBaseName(toBaseName(fileName));
      setError(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const result = await renameTrackFileAsset({ trackId, name: baseName });

    setSaving(false);

    if (!result.ok) {
      setError(
        result.code === "VALIDATION"
          ? t("trackFileRenameValidation")
          : result.code === "NOT_RENAMABLE"
            ? t("trackFileRenameNotRenamable")
            : t("trackFileRenameError"),
      );
      return;
    }

    toast.success(t("trackFileRenameSuccess"));
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("trackFileRenameAction")}
          title={t("trackFileRenameAction")}
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("trackFileRenameTitle")}</DialogTitle>
          <DialogDescription>{t("trackFileRenameDescription")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <label className="grid gap-1 text-sm" htmlFor={fieldId}>
            <span className="text-muted-foreground">{t("trackFileRenameFieldLabel")}</span>
            <div className="flex items-center gap-2">
              <Input
                id={fieldId}
                value={baseName}
                onChange={(event) => setBaseName(event.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <span className="text-sm text-muted-foreground">{GPX_SUFFIX}</span>
            </div>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            {t("trackFileRenameCancel")}
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? t("trackFileRenameSaving") : t("trackFileRenameSave")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
