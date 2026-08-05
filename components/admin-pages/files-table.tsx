"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";

import type { FileAssetWithOwner } from "@/app/_data/files";
import { formatFileSize } from "@/lib/file-upload-limits";

import { Badge, Button, DataTable, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "..";

interface IFilesTableProps {
  data: FileAssetWithOwner[];
}

const ADMIN_FILES_PAGE_SIZE = 10;
const ALL_PURPOSES_VALUE = "__all_purposes__";
const ALL_VISIBILITIES_VALUE = "__all_visibilities__";
const ALL_STATUSES_VALUE = "__all_statuses__";

const formatDateTime = (date: Date) =>
  date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPurpose = (purpose: string) => {
  const purposeLabels: Record<string, string> = {
    ADMIN_UPLOAD: "Admin Upload",
    ARCHIVE_ATTACHMENT: "Archive Attachment",
    VIDEO_ATTACHMENT: "Video Attachment",
    PREVIEW_IMAGE: "Preview Image",
    RICH_TEXT_IMAGE: "Rich Text Image",
    STANDALONE_SHARED_FILE: "Standalone Shared File",
  };
  return purposeLabels[purpose] || purpose;
};

const formatVisibility = (visibility: string) => {
  const visibilityLabels: Record<string, string> = {
    PRIVATE: "Private",
    UNLISTED: "Unlisted",
    PUBLIC: "Public",
  };
  return visibilityLabels[visibility] || visibility;
};

const formatStatus = (status: string) => {
  const statusLabels: Record<string, string> = {
    ACTIVE: "Active",
    DETACHED: "Detached",
    PENDING_DELETE: "Pending Delete",
    DELETED: "Deleted",
  };
  return statusLabels[status] || status;
};

const columns: ColumnDef<FileAssetWithOwner>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => (
      <a
        href={`/files/${row.original.id}/download`}
        className="block max-w-70 truncate font-medium text-blue-500 underline-offset-4 hover:underline"
        title={row.original.name}
      >
        {row.original.name}
      </a>
    ),
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
      <Badge variant={row.original.status === "ACTIVE" ? "default" : "secondary"}>
        {formatStatus(row.original.status)}
      </Badge>
    ),
  },
  {
    accessorKey: "owner",
    header: "Owner",
    cell: ({ row }) => <span className="block w-32 truncate text-sm">{row.original.owner.name}</span>,
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
];

export const FilesTable = ({ data }: IFilesTableProps) => {
  const [selectedPurpose, setSelectedPurpose] = useState(ALL_PURPOSES_VALUE);
  const [selectedVisibility, setSelectedVisibility] = useState(ALL_VISIBILITIES_VALUE);
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  const purposeOptions = useMemo(() => {
    const purposes = new Set<string>();
    data.forEach((file) => purposes.add(file.purpose));
    return Array.from(purposes).sort();
  }, [data]);

  const visibilityOptions = useMemo(() => {
    const visibilities = new Set<string>();
    data.forEach((file) => visibilities.add(file.visibility));
    return Array.from(visibilities).sort();
  }, [data]);

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    data.forEach((file) => statuses.add(file.status));
    return Array.from(statuses).sort();
  }, [data]);

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
          {purposeOptions.length > 0 ? (
            <Select value={selectedPurpose} onValueChange={setSelectedPurpose}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Filter files by purpose">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_PURPOSES_VALUE}>All purposes</SelectItem>
                {purposeOptions.map((purpose) => (
                  <SelectItem key={purpose} value={purpose}>
                    {formatPurpose(purpose)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {visibilityOptions.length > 0 ? (
            <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Filter files by visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VISIBILITIES_VALUE}>All visibilities</SelectItem>
                {visibilityOptions.map((visibility) => (
                  <SelectItem key={visibility} value={visibility}>
                    {formatVisibility(visibility)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {statusOptions.length > 0 ? (
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Filter files by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES_VALUE}>All statuses</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatStatus(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>
      <DataTable data={filteredData} columns={columns} pagination={{ pageSize: ADMIN_FILES_PAGE_SIZE }} />
    </div>
  );
};
