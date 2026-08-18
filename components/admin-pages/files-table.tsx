"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { markFileAssetPendingDelete } from "@/app/_actions/files";
import type { FileAssetWithOwner } from "@/app/_data/files";
import { FileAssetPurpose, FileAssetStatus, FileAssetVisibility } from "@/generated/prisma/enums";
import { formatFileSize } from "@/lib/file-upload-limits";

import {
  Badge,
  Button,
  ConfirmDialog,
  DataTable,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "..";
import { FilePreviewDialog, isFilePreviewable } from "./file-preview-dialog";

interface IFilesTableProps {
  data: FileAssetWithOwner[];
}

const ADMIN_FILES_PAGE_SIZE = 10;
const ALL_PURPOSES_VALUE = "__all_purposes__";
const ALL_VISIBILITIES_VALUE = "__all_visibilities__";
const ALL_STATUSES_VALUE = "__all_statuses__";
const FILE_PURPOSE_OPTIONS = Object.values(FileAssetPurpose);
const FILE_VISIBILITY_OPTIONS = Object.values(FileAssetVisibility);
const FILE_STATUS_OPTIONS = Object.values(FileAssetStatus);

const formatDateTime = (date: Date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPurpose = (purpose: FileAssetWithOwner["purpose"]) => {
  const purposeLabels: Record<FileAssetWithOwner["purpose"], string> = {
    ADMIN_UPLOAD: "Admin Upload",
    ARCHIVE_ATTACHMENT: "Archive Attachment",
    VIDEO_ATTACHMENT: "Video Attachment",
    PREVIEW_IMAGE: "Preview Image",
    RICH_TEXT_IMAGE: "Rich Text Image",
    STANDALONE_SHARED_FILE: "Standalone Shared File",
  };
  return purposeLabels[purpose];
};

const formatVisibility = (visibility: FileAssetWithOwner["visibility"]) => {
  const visibilityLabels: Record<FileAssetWithOwner["visibility"], string> = {
    PRIVATE: "Private",
    UNLISTED: "Unlisted",
    PUBLIC: "Public",
  };
  return visibilityLabels[visibility];
};

const formatStatus = (status: FileAssetWithOwner["status"]) => {
  const statusLabels: Record<FileAssetWithOwner["status"], string> = {
    ACTIVE: "Active",
    DETACHED: "Detached",
    PENDING_DELETE: "Pending Delete",
    DELETED: "Deleted",
  };
  return statusLabels[status];
};

const getStatusBadgeVariant = (status: FileAssetWithOwner["status"]) => {
  if (status === "ACTIVE") return "default";
  if (status === "PENDING_DELETE") return "outline";
  if (status === "DELETED") return "destructive";

  return "secondary";
};

const FileActions = ({
  file,
  onPreview,
}: {
  file: FileAssetWithOwner;
  onPreview: (file: FileAssetWithOwner) => void;
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const isActive = file.status === "ACTIVE";
  const previewable = isActive && isFilePreviewable(file.mimeType);
  const canDelete = isActive;

  const handleDelete = async () => {
    setIsConfirmOpen(false);
    setIsDeleting(true);

    try {
      const result = await markFileAssetPendingDelete(file.id);

      if (!result.success) {
        toast.error(result.message);
        router.refresh();
        return;
      }

      toast.success(result.message);
      router.refresh();
    } catch {
      toast.error("Something went wrong marking the file pending delete");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex w-24 items-center justify-end gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          title={
            previewable
              ? `Preview ${file.name}`
              : isActive
                ? "Preview unavailable for this file type"
                : "Preview unavailable for non-active files"
          }
          aria-label={
            previewable
              ? `Preview ${file.name}`
              : isActive
                ? "Preview unavailable for this file type"
                : "Preview unavailable for non-active files"
          }
          disabled={!previewable}
          onClick={() => onPreview(file)}
        >
          <Eye className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          title={canDelete ? `Mark ${file.name} pending delete` : "Delete unavailable for non-active files"}
          aria-label={canDelete ? `Mark ${file.name} pending delete` : "Delete unavailable for non-active files"}
          className="text-destructive hover:text-destructive"
          disabled={!canDelete || isDeleting}
          onClick={() => setIsConfirmOpen(true)}
        >
          <Trash className="size-4" />
        </Button>
      </div>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={`Mark "${file.name}" pending delete?`}
        description="The stored provider file will not be removed yet."
        confirmLabel="Mark Pending Delete"
        confirmVariant="destructive"
        isPending={isDeleting}
        onConfirm={handleDelete}
      />
    </>
  );
};

const getColumns = (onPreview: (file: FileAssetWithOwner) => void): ColumnDef<FileAssetWithOwner>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const file = row.original;
      const isActive = file.status === "ACTIVE";

      return (
        <div className="flex min-w-72 max-w-96 flex-col gap-1">
          {isActive ? (
            <a
              href={`/files/${file.id}/download`}
              className="truncate font-medium text-blue-500 underline-offset-4 hover:underline"
              title={file.name}
            >
              {file.name}
            </a>
          ) : (
            <span className="truncate font-medium text-muted-foreground" title={file.name}>
              {file.name}
            </span>
          )}
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            <span className="truncate font-mono" title={file.fileKey}>
              key: {file.fileKey}
            </span>
            {file.customId ? (
              <span className="truncate font-mono" title={file.customId}>
                custom: {file.customId}
              </span>
            ) : null}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "mimeType",
    header: "Type",
    cell: ({ row }) => <span className="block w-32 truncate text-sm">{row.original.mimeType}</span>,
  },
  {
    accessorKey: "sizeBytes",
    header: "Size",
    cell: ({ row }) => <span className="block w-20 text-sm">{formatFileSize(row.original.sizeBytes)}</span>,
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => (
      <Badge variant="outline" className="max-w-36 truncate">
        {formatPurpose(row.original.purpose)}
      </Badge>
    ),
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.visibility === "PUBLIC"
            ? "default"
            : row.original.visibility === "PRIVATE"
              ? "secondary"
              : "outline"
        }
      >
        {formatVisibility(row.original.visibility)}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={getStatusBadgeVariant(row.original.status)}>{formatStatus(row.original.status)}</Badge>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => (
      <span className="block w-32 truncate text-sm">{row.original.owner?.name || "Unknown owner"}</span>
    ),
  },
  {
    accessorKey: "uploadedAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="w-36 justify-start"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Uploaded
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="w-36 truncate" title={formatDateTime(row.getValue("uploadedAt") as Date)}>
        {formatDateTime(row.getValue("uploadedAt") as Date)}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const file = row.original;

      return <FileActions file={file} onPreview={onPreview} />;
    },
  },
];

export const FilesTable = ({ data }: IFilesTableProps) => {
  const [selectedPurpose, setSelectedPurpose] = useState(ALL_PURPOSES_VALUE);
  const [selectedVisibility, setSelectedVisibility] = useState(ALL_VISIBILITIES_VALUE);
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<FileAssetWithOwner | null>(null);
  const columns = useMemo(() => getColumns(setPreviewFile), []);

  const filteredData = useMemo(() => {
    return data.filter((file) => {
      const matchesPurpose = selectedPurpose === ALL_PURPOSES_VALUE || file.purpose === selectedPurpose;
      const matchesVisibility = selectedVisibility === ALL_VISIBILITIES_VALUE || file.visibility === selectedVisibility;
      const matchesStatus = selectedStatus === ALL_STATUSES_VALUE || file.status === selectedStatus;
      const matchesSearch = searchQuery === "" || file.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesPurpose && matchesVisibility && matchesStatus && matchesSearch;
    });
  }, [data, selectedPurpose, selectedVisibility, selectedStatus, searchQuery]);

  return (
    <div className="flex w-full min-w-0 max-w-full flex-col gap-3 p-4">
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">files count: {filteredData.length}</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Input
            type="text"
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter files by purpose">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_PURPOSES_VALUE}>All purposes</SelectItem>
              {FILE_PURPOSE_OPTIONS.map((purpose) => (
                <SelectItem key={purpose} value={purpose}>
                  {formatPurpose(purpose)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter files by visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VISIBILITIES_VALUE}>All visibilities</SelectItem>
              {FILE_VISIBILITY_OPTIONS.map((visibility) => (
                <SelectItem key={visibility} value={visibility}>
                  {formatVisibility(visibility)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter files by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES_VALUE}>All statuses</SelectItem>
              {FILE_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable data={filteredData} columns={columns} pagination={{ pageSize: ADMIN_FILES_PAGE_SIZE }} />
      <FilePreviewDialog
        file={previewFile}
        open={Boolean(previewFile)}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </div>
  );
};
