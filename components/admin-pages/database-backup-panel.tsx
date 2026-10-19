import { Download, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resolvePgDumpBin } from "@/lib/admin-database-backup";

const DOWNLOAD_ENDPOINT = "/api/admin/database-backups/full";

export const DatabaseBackupPanel = async () => {
  const pgDumpBin = await resolvePgDumpBin();
  const enabled = Boolean(pgDumpBin);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base">Generate full backup</CardTitle>
          <CardDescription>
            Streams a single <code className="rounded bg-muted px-1 py-0.5 text-xs">tar.gz</code> archive containing
            <code className="rounded bg-muted px-1 py-0.5 text-xs"> dump.sql</code>,
            <code className="rounded bg-muted px-1 py-0.5 text-xs"> manifest.json</code>, and
            <code className="rounded bg-muted px-1 py-0.5 text-xs"> README.txt</code> for the full project PostgreSQL
            scope. The archive is downloaded once and is not persisted on the server.
          </CardDescription>
        </div>
        <Download className="size-4 text-muted-foreground" />
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {enabled ? (
          <form method="get" action={DOWNLOAD_ENDPOINT}>
            <Button type="submit">Generate full backup</Button>
          </form>
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
          >
            <div className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 text-destructive" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">pg_dump is not available on this server</p>
                <p className="text-muted-foreground">
                  The runtime could not locate <code className="rounded bg-muted px-1 py-0.5 text-xs">pg_dump</code> in{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">$PATH</code>. Set the{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">BACKUP_PG_DUMP_BIN</code> environment variable
                  to the absolute path of the <code className="rounded bg-muted px-1 py-0.5 text-xs">pg_dump</code>{" "}
                  executable to enable this control.
                </p>
              </div>
            </div>
            <Button type="button" disabled aria-disabled>
              Generate full backup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
