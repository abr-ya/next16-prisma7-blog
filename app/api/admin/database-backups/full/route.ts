import { NextResponse } from "next/server";

import { createLogEvent } from "@/app/_data/log";
import {
  BACKUP_FORMAT_VERSION,
  BACKUP_SCOPE_FULL,
  getBackupEnvironmentLabel,
  resolvePgDumpBin,
  streamFullBackupArchive,
} from "@/lib/admin-database-backup";
import { AuthorizationError, authSession, requireAdminControl } from "@/lib/auth-utils";

export const runtime = "nodejs";

const buildGenerateDetails = (input: { failureReason: string; environment: string; requestedBy?: string }): string =>
  JSON.stringify({
    scope: BACKUP_SCOPE_FULL,
    environment: input.environment,
    formatVersion: BACKUP_FORMAT_VERSION,
    failureReason: input.failureReason,
    requestedBy: input.requestedBy ?? null,
  });

export async function GET() {
  // Capture the session up-front so we can include `requestedBy` in the
  // audit row when a denial happens to an authenticated non-admin.
  const session = await authSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    await requireAdminControl();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      await createLogEvent(
        "database.backup.generate",
        buildGenerateDetails({
          failureReason: "non_admin_denial",
          environment: getBackupEnvironmentLabel(),
          requestedBy: session.user.id,
        }),
      );

      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    throw error;
  }

  const environment = getBackupEnvironmentLabel();

  // Runtime preflight: surface missing `pg_dump` with a clear 503 and an audit row.
  if (!(await resolvePgDumpBin())) {
    await createLogEvent(
      "database.backup.generate",
      buildGenerateDetails({
        failureReason: "pg_dump_not_found",
        environment,
        requestedBy: session.user.id,
      }),
    );

    return NextResponse.json({ error: "pg_dump binary is not available on the server" }, { status: 503 });
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "DATABASE_URL is not configured" }, { status: 500 });
  }

  try {
    const { stream, filename } = await streamFullBackupArchive({
      connectionString,
      environment,
      scope: BACKUP_SCOPE_FULL,
    });

    return new Response(stream as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // streamFullBackupArchive has already written a failure generate Log row;
    // we still want a clean 500 response on the wire.
    console.error("admin database-backup route error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
