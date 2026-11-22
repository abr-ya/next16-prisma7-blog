"use client";

import { Lock, Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { updateTrackPrivateNote } from "@/app/_data/tracks";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/index";

// feature-145: the owner's private note, editable from the published track
// page. The note stays owner-only; this component is rendered only when the
// payload says the viewer owns the track.

const MAX_PRIVATE_NOTE_LENGTH = 2000;

export const TrackPrivateNoteSection = ({ trackId, privateNote }: { trackId: string; privateNote: string | null }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(privateNote ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const openEditor = () => {
    setValue(privateNote ?? "");
    setOpen(true);
  };

  const save = async () => {
    setIsSaving(true);

    try {
      const result = await updateTrackPrivateNote(trackId, value);

      if (!result.ok) {
        toast.error(result.message);

        return;
      }

      toast.success(value.trim() ? "Private note saved" : "Private note cleared");
      setOpen(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {privateNote ? (
        <section className="grid max-w-3xl gap-2 rounded-md border border-dashed bg-muted/40 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lock className="size-4" />
            Your private note
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto"
              title="Edit private note"
              aria-label="Edit private note"
              onClick={openEditor}
            >
              <Pencil className="size-4" />
            </Button>
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{privateNote}</p>
          <p className="text-xs text-muted-foreground">Only you can see this note.</p>
        </section>
      ) : (
        <Button type="button" variant="outline" className="w-fit" onClick={openEditor}>
          <Plus />
          Add private note
        </Button>
      )}

      <Dialog open={open} onOpenChange={(nextOpen) => !isSaving && setOpen(nextOpen)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Private note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <textarea
              value={value}
              maxLength={MAX_PRIVATE_NOTE_LENGTH}
              disabled={isSaving}
              onChange={(event) => setValue(event.target.value)}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
              placeholder="What you want to remember about this workout."
            />
            <p className="text-right text-xs text-muted-foreground">
              {value.length} / {MAX_PRIVATE_NOTE_LENGTH}
            </p>
            <p className="text-xs text-muted-foreground">Only you can see this note.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSaving} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isSaving} onClick={() => void save()}>
              {isSaving ? "Saving…" : "Save note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
