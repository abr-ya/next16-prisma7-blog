"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  attachCreatorTrackToHike,
  createTrackAndAttachToHike,
  type HikeTrackContributionCapability,
} from "@/app/_data/hikes";
import type { CreatorUnlinkedTrack } from "@/app/_data/tracks";
import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";
import { navigationNamespace } from "@/app/i18n/settings";
import { TrackGpxUploadSection } from "@/components/track-pages/track-gpx-upload-section";
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TrackActivityType } from "@/generated/prisma/client";
import type { TrackStatus } from "@/generated/prisma/enums";
import { createSlug } from "@/lib/slug-generator";

const uniqueIds = (ids: string[]) => Array.from(new Set(ids));

const formatActivityTypeName = (activityType: TrackActivityType, language?: string) =>
  language === "ru" ? activityType.nameRu || activityType.nameEn : activityType.nameEn;

const formatDate = (value: Date | string) =>
  new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(value));

const uploadSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  description: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  fileAssetId: z.string().min(1, { message: "GPX file is required" }),
  fileAssetName: z.string().optional(),
  recordingTimezone: z.string().optional(),
  activityTypeId: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const defaultUploadValues: UploadFormValues = {
  title: "",
  slug: "",
  description: "",
  status: "DRAFT",
  fileAssetId: "",
  fileAssetName: "",
  recordingTimezone: "",
  activityTypeId: "",
};

const HikeTrackContributionDialog = ({
  open,
  onOpenChange,
  capability,
  ownerTracks,
  activityTypes,
  onAttached,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capability: HikeTrackContributionCapability;
  ownerTracks: CreatorUnlinkedTrack[];
  activityTypes: TrackActivityType[];
  onAttached: () => void;
}) => {
  const { t, i18n } = useT(navigationNamespace);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const router = useRouter();
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: defaultUploadValues,
    mode: "onBlur",
  });
  const fileAssetId = useWatch({ control: form.control, name: "fileAssetId" });
  const titleValue = useWatch({ control: form.control, name: "title" });
  const [tab, setTab] = useState<"attach" | "upload">(ownerTracks.length > 0 ? "attach" : "upload");
  const [uploadedFileAssetIds, setUploadedFileAssetIds] = useState<string[]>([]);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAttachingId, setIsAttachingId] = useState<string | null>(null);
  const [isDiscarding, startDiscarding] = useTransition();

  const hasUnsavedUploads = uploadedFileAssetIds.length > 0;
  const isFormDirty = form.formState.isDirty;
  const hasGuardedChanges = hasUnsavedUploads || (isFormDirty && tab === "upload");

  useEffect(() => {
    if (!open) return;
    form.reset(defaultUploadValues);
    setUploadedFileAssetIds([]);
    setDiscardConfirmOpen(false);
    setTab(ownerTracks.length > 0 ? "attach" : "upload");
  }, [form, open, ownerTracks.length]);

  const closeWithoutGuard = useCallback(() => {
    setDiscardConfirmOpen(false);
    setUploadedFileAssetIds([]);
    form.reset(defaultUploadValues);
    onOpenChange(false);
  }, [form, onOpenChange]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (hasGuardedChanges) {
      setDiscardConfirmOpen(true);
      return;
    }
    closeWithoutGuard();
  };

  const handleConfirmDiscard = () => {
    const fileIdsToDiscard = uniqueIds(uploadedFileAssetIds);
    if (fileIdsToDiscard.length === 0) {
      closeWithoutGuard();
      return;
    }
    startDiscarding(async () => {
      const result = await markDiscardedTrackGpxFileAssetsPendingDelete(fileIdsToDiscard);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      closeWithoutGuard();
    });
  };

  const handleGenerateSlug = () => {
    const slug = createSlug(titleValue);
    if (slug) form.setValue("slug", slug, { shouldDirty: true, shouldValidate: true });
  };

  const handleAttach = async (track: CreatorUnlinkedTrack) => {
    setIsAttachingId(track.id);
    try {
      await attachCreatorTrackToHike({ hikeId: capability.hikeId, trackId: track.id });
      toast.success(t("trips:addTrackSuccess"));
      onAttached();
      router.refresh();
      closeWithoutGuard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("trips:addTrackAttachError"));
    } finally {
      setIsAttachingId(null);
    }
  };

  const onSubmitUpload = async (values: UploadFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createTrackAndAttachToHike({
        hikeId: capability.hikeId,
        title: values.title,
        slug: values.slug,
        description: values.description,
        status: values.status as TrackStatus,
        fileAssetId: values.fileAssetId,
        recordingTimezone: values.recordingTimezone || null,
        activityTypeId: values.activityTypeId || null,
      });
      if (result.ok) {
        toast.success(t("trips:addTrackSuccess"));
        onAttached();
        router.refresh();
        closeWithoutGuard();
        return;
      }
      const messageByCode: Record<"SLUG" | "TRUST" | "QUOTA" | "VALIDATION" | "INTERNAL", string> = {
        SLUG: t("trips:addTrackSlugConflict"),
        TRUST: t("trips:addTrackError"),
        QUOTA: t("trips:addTrackQuotaReached"),
        VALIDATION: t("trips:addTrackNotTripOwner"),
        INTERNAL: t("trips:addTrackError"),
      };
      toast.error(messageByCode[result.code]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("trips:addTrackUploadError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("trips:addTrack")}</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={(value) => setTab(value as "attach" | "upload")}>
            <TabsList>
              <TabsTrigger value="attach">{t("trips:addTrackAttachTab")}</TabsTrigger>
              <TabsTrigger value="upload">{t("trips:addTrackUploadTab")}</TabsTrigger>
            </TabsList>
            <TabsContent value="attach" className="grid gap-2">
              {ownerTracks.length === 0 ? (
                <p className="rounded-md border p-3 text-sm text-muted-foreground">{t("trips:addTrackEmptyState")}</p>
              ) : (
                <ul className="grid gap-2">
                  {ownerTracks.map((track) => (
                    <li
                      key={track.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3"
                    >
                      <div className="grid gap-1">
                        <div className="font-medium">{track.title}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{track.slug}</span>
                          <span>·</span>
                          <span>{formatDate(track.updatedAt)}</span>
                          <Badge variant={track.parseState === "PARSED" ? "secondary" : "outline"}>
                            {track.parseState === "PARSED" ? "Parsed" : "Not parsed"}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isAttachingId === track.id}
                        onClick={() => handleAttach(track)}
                      >
                        {isAttachingId === track.id ? "Attaching..." : t("trips:addTrackAttachButton")}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="upload" className="grid gap-4">
              <Form {...form}>
                <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmitUpload)}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="activityTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity type</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === "unclassified" ? "" : value)}
                            value={field.value || "unclassified"}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="unclassified">Unclassified</SelectItem>
                              {activityTypes.map((activityType) => (
                                <SelectItem key={activityType.id} value={activityType.id}>
                                  {formatActivityTypeName(activityType, activeLanguage)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <Button type="button" variant="outline" onClick={handleGenerateSlug}>
                              Generate
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                              <SelectItem value="PUBLISHED">Published</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recordingTimezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recording timezone (optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Europe/Sofia" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <TrackGpxUploadSection
                    isEditing={false}
                    onUploadComplete={({ fileAssetId: newFileAssetId, fileName }) => {
                      form.setValue("fileAssetId", newFileAssetId, { shouldDirty: true, shouldValidate: true });
                      form.setValue("fileAssetName", fileName, { shouldDirty: true, shouldValidate: true });
                      setUploadedFileAssetIds((current) => uniqueIds([...current, newFileAssetId]));
                    }}
                    onUploadError={() => {
                      // toast already emitted by the section
                    }}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting || !fileAssetId}>
                      {isSubmitting ? "Saving..." : t("trips:addTrack")}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title={hasUnsavedUploads ? "Discard track and uploaded GPX?" : "Discard track changes?"}
        description={
          hasUnsavedUploads
            ? "This form has unsaved changes and an uploaded GPX file. Discarding will mark the unsaved uploaded GPX file for deletion before closing."
            : "This form has unsaved changes. Discarding will close the modal without saving them."
        }
        confirmLabel={hasUnsavedUploads ? "Discard and remove file" : "Discard changes"}
        confirmVariant="destructive"
        isPending={isDiscarding}
        onConfirm={handleConfirmDiscard}
      />
    </>
  );
};

export const HikeTrackContributionButton = ({
  capability,
  ownerTracks,
  activityTypes,
}: {
  capability: HikeTrackContributionCapability;
  ownerTracks: CreatorUnlinkedTrack[];
  activityTypes: TrackActivityType[];
}) => {
  const { t } = useT(navigationNamespace);
  const [open, setOpen] = useState(false);
  const ownerTracksKey = useMemo(() => ownerTracks.map((track) => track.id).join("|"), [ownerTracks]);

  // Omit the affordance entirely for viewers who are not the eligible creator.
  if (
    capability.viewer === "anonymous" ||
    capability.viewer === "non-owner" ||
    capability.viewer === "owner-trust-ineligible"
  ) {
    return null;
  }

  const limitReached = capability.viewer === "owner-quota-reached";

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          disabled={limitReached}
          title={limitReached ? t("trips:addTrackQuotaReached") : undefined}
          onClick={() => setOpen(true)}
        >
          <Plus />
          {t("trips:addTrack")}
        </Button>
        {limitReached ? <span className="text-xs text-muted-foreground">{t("trips:addTrackQuotaReached")}</span> : null}
      </div>
      <HikeTrackContributionDialog
        key={ownerTracksKey}
        open={open}
        onOpenChange={setOpen}
        capability={capability}
        ownerTracks={ownerTracks}
        activityTypes={activityTypes}
        onAttached={() => {
          // router.refresh is called inside the dialog on success
        }}
      />
    </>
  );
};
