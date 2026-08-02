import { Archive, ClipboardList, Database, FileArchive, ShieldCheck, TriangleAlert } from "lucide-react";

import { AdminPageLayout } from "@/components/layout/admin-page-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  databaseBackupBoundaries,
  databaseBackupMetadataFields,
  databaseBackupScopes,
} from "@/lib/admin-database-backup-contract";
import { requireAdmin } from "@/lib/auth-utils";

const breadcrumbs = [
  { label: "Dashboard", to: "/admin" },
  { label: "Database", to: null },
];

const AdminDatabasePage = async () => {
  await requireAdmin();

  return (
    <AdminPageLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-4">
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="size-5 text-muted-foreground" />
                <h1 className="text-2xl font-semibold">Database Backups</h1>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Admin-only backup structure for project PostgreSQL data. Generation, download, retention, and restore
                controls are intentionally not active in this slice.
              </p>
            </div>
            <Badge variant="secondary">Structure only</Badge>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {databaseBackupBoundaries.map((boundary) => (
            <Card key={boundary.name}>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <CardTitle className="text-base">{boundary.name}</CardTitle>
                <ShieldCheck className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{boundary.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Backup Scopes</CardTitle>
              <FileArchive className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {databaseBackupScopes.map((scope) => (
                <div key={scope.name} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium">{scope.name}</h2>
                    <Badge variant="outline">{scope.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{scope.description}</p>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Manifest Fields</CardTitle>
              <ClipboardList className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {databaseBackupMetadataFields.map((field) => (
                  <li key={field} className="flex items-center gap-2 text-sm">
                    <Archive className="size-3.5 text-muted-foreground" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Restore Boundary</CardTitle>
            <TriangleAlert className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Restore remains a separate high-risk capability. A later restore feature must define preflight validation,
              explicit administrator confirmation, environment restrictions, and recovery expectations before any live
              import, overwrite, reset, or destructive database behavior is added.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminDatabasePage;
