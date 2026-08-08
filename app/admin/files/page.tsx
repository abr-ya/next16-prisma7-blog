import { FileText, HardDrive, ListChecks, UploadCloud } from "lucide-react";

import { getCurrentUserFileStats, getUploadThingUsagePoints, listTrackedFileAssets } from "@/app/_data/files";
import { FileUploadForm } from "@/components/admin-pages/file-upload-form";
import { FilesTable } from "@/components/admin-pages/files-table";
import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth-utils";
import { formatFileSize } from "@/lib/file-upload-limits";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin" },
  { label: "Files", to: null },
];

const AdminFilesPage = async () => {
  await requireAdmin();

  const [stats, files] = await Promise.all([getCurrentUserFileStats(), listTrackedFileAssets()]);
  const usagePoints = getUploadThingUsagePoints();
  const activeFilesCount = files.filter((file) => file.status === "ACTIVE").length;

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
              <div className="text-3xl font-semibold">{activeFilesCount}</div>
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

        <FilesTable data={files} />
      </div>
    </AdminPageLayout>
  );
};

export default AdminFilesPage;
