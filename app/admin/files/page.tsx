import { FileText, HardDrive, ListChecks, UploadCloud } from "lucide-react";

import { getCurrentUserFileStats, getUploadThingUsagePoints, listTrackedFileAssets } from "@/app/_data/files";
import { FileUploadForm } from "@/components/admin-pages/file-upload-form";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFileSize } from "@/lib/file-upload-limits";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin" },
  { label: "Files", to: null },
];

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

const AdminFilesPage = async () => {
  const [stats, files] = await Promise.all([getCurrentUserFileStats(), listTrackedFileAssets()]);
  const usagePoints = getUploadThingUsagePoints();

  return (
    <AdminPageLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">My Files</CardTitle>
              <FileText className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{stats.count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Storage Used</CardTitle>
              <HardDrive className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{formatFileSize(stats.storageUsedBytes)}</div>
              <p className="mt-1 text-sm text-muted-foreground">of {formatFileSize(stats.storageLimitBytes)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Tracked Files</CardTitle>
              <ListChecks className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{files.length}</div>
              <p className="mt-1 text-sm text-muted-foreground">active FileAsset records</p>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Upload File</CardTitle>
              <UploadCloud className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <FileUploadForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">UploadThing Usage Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {usagePoints.map((point) => (
                <div key={`${point.route}-${point.surface}`} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{point.label}</div>
                    <Badge variant={point.status === "tracked" ? "default" : "secondary"}>{point.status}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{point.surface}</div>
                  <div className="mt-2 text-sm">{point.notes}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tracked File Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No tracked files yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="max-w-[280px] truncate font-medium">
                        <a href={`/files/${file.id}/download`} className="hover:underline">
                          {file.name}
                        </a>
                      </TableCell>
                      <TableCell>{file.mimeType}</TableCell>
                      <TableCell>{formatFileSize(file.sizeBytes)}</TableCell>
                      <TableCell>{file.purpose}</TableCell>
                      <TableCell>{formatDate(file.uploadedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminFilesPage;
