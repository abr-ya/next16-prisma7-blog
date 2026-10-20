import "server-only";

import { spawn, execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type { ReadableStream as WebReadableStream } from "node:stream/web";
import { createLogEvent } from "@/app/_data/log";
import prisma from "@/lib/prisma";

export const BACKUP_PG_DUMP_BIN_ENV = "BACKUP_PG_DUMP_BIN";
export const BACKUP_ENV_LABEL_ENV = "BACKUP_ENVIRONMENT_LABEL";
export const BACKUP_FORMAT_VERSION = "1";
export const BACKUP_SCOPE_FULL = "full" as const;

/** Audit actions emitted by this module. */
export const BACKUP_LOG_ACTIONS = {
  generate: "database.backup.generate",
  download: "database.backup.download",
} as const;

/**
 * Domain groups the full backup covers. Order matches the structure spec's
 * restore-priority narrative (auth → content → comments → links → videos →
 * tags → file metadata → logs).
 */
export const INCLUDED_DOMAINS = [
  "auth",
  "content",
  "comments",
  "links",
  "videos",
  "tags",
  "fileMetadata",
  "logs",
] as const;

export type IncludedDomain = (typeof INCLUDED_DOMAINS)[number];

interface ManifestInput {
  readonly scope: typeof BACKUP_SCOPE_FULL;
  readonly environment: string;
  readonly byteSize?: number;
}

interface Manifest {
  readonly generatedAt: string;
  readonly environment: string;
  readonly scope: typeof BACKUP_SCOPE_FULL;
  readonly includedDomainsOrTables: readonly IncludedDomain[];
  readonly formatVersion: typeof BACKUP_FORMAT_VERSION;
  readonly generatorSource: string;
  readonly restoreCompatibilityNotes: string;
}

interface ReadmeInput {
  readonly environment: string;
  readonly generatedAt: string;
}

interface PgDumpOptions {
  readonly binPath: string;
  readonly connectionString: string;
  readonly dumpPath: string;
}

interface StreamOptions {
  readonly connectionString: string;
  readonly environment: string;
  readonly scope: typeof BACKUP_SCOPE_FULL;
}

interface StreamResult {
  readonly stream: WebReadableStream<Uint8Array>;
  readonly filename: string;
}

/** Resolve the absolute path of the `pg_dump` binary. */
export const resolvePgDumpBin = async (): Promise<string | null> => {
  const explicit = process.env[BACKUP_PG_DUMP_BIN_ENV]?.trim();
  if (explicit) return explicit;

  try {
    const { stdout } = await execFileAsync("which", ["pg_dump"]);
    const resolved = stdout.trim();
    return resolved ? resolved : null;
  } catch {
    return null;
  }
};

/** Compute the environment label surfaced in the manifest and the filename. */
export const getBackupEnvironmentLabel = (): string => {
  const explicit = process.env[BACKUP_ENV_LABEL_ENV]?.trim();
  if (explicit) return explicit;

  const vercelEnv = process.env.VERCEL_ENV?.trim();
  if (vercelEnv) return vercelEnv;

  const nodeEnv = process.env.NODE_ENV?.trim();
  if (nodeEnv) return nodeEnv;

  return "development";
};

const formatUtcIso = (date: Date): string => date.toISOString();

const buildArchiveFilename = (environment: string, generatedAt: Date): string => {
  const safeStamp = formatUtcIso(generatedAt).replace(/[:.]/g, "-");
  return `${environment}-${safeStamp}.tar.gz`;
};

/**
 * Pure builder for the `manifest.json` object. Tests can call this without
 * touching the filesystem.
 */
export const buildManifest = ({ scope, environment, byteSize }: ManifestInput): Manifest => {
  const generatedAt = formatUtcIso(new Date());

  const notes = [
    "Restore by extracting the archive and applying `dump.sql` with `psql` against an empty target schema.",
    `Archive byte size: ${byteSize ?? 0} bytes.`,
    "UploadThing provider bytes are NOT included; only database rows from the `FileAsset` model are present.",
    `Manifest formatVersion: ${BACKUP_FORMAT_VERSION}. Restore tooling must declare compatibility with this version.`,
  ].join(" ");

  return {
    generatedAt,
    environment,
    scope,
    includedDomainsOrTables: INCLUDED_DOMAINS,
    formatVersion: BACKUP_FORMAT_VERSION,
    generatorSource: `next16-prisma7-blog@0.1.0 (pg_dump via node:child_process)`,
    restoreCompatibilityNotes: notes,
  };
};

/**
 * Pure builder for the `README.txt` body. The text intentionally points the
 * reader to `manifest.json` for the authoritative restore notes.
 */
export const buildReadme = ({ environment, generatedAt }: ReadmeInput): string => {
  return [
    "Backup README",
    "==============",
    "",
    `Environment: ${environment}`,
    `Generated at (UTC): ${generatedAt}`,
    "",
    "Restore steps:",
    "1. Extract this archive: `tar -xzf <archive>.tar.gz`.",
    "2. Apply `dump.sql` against an empty PostgreSQL database using `psql`:",
    "     psql --no-owner --no-ACL --single-transaction --set ON_ERROR_STOP=on \\",
    '       --dbname "$TARGET_DATABASE_URL" --file dump.sql',
    "",
    "Provider file bytes are NOT included in this archive. Database rows from",
    "the `FileAsset` model are present, but the actual upload bytes remain in",
    "UploadThing and must be reconciled by an upstream storage backup if needed.",
    "",
    "See `manifest.json` (`restoreCompatibilityNotes`) for the complete restore",
    "contract used by this archive, including formatVersion and any future",
    "compatibility expectations.",
    "",
  ].join("\n");
};

/** Run `pg_dump` and stream its output to `dumpPath`. */
const runPgDump = async ({ binPath, connectionString, dumpPath }: PgDumpOptions): Promise<void> => {
  const args = [
    "--no-owner",
    "--no-acl",
    "--clean",
    "--if-exists",
    "--quote-all-identifiers",
    "--schema=public",
    "--dbname",
    connectionString,
  ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(binPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    const stderrChunks: Buffer[] = [];

    const out = createWriteStream(dumpPath);
    child.stdout.pipe(out);

    child.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on("error", reject);
    out.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
      reject(new Error(`pg_dump exited with code ${code}: ${stderr || "no stderr output"}`));
    });
  });
};

/**
 * Build a complete failure `Log` details payload for the `database.backup.generate`
 * action. Used by preflight, pg_dump, and stream-prep failures.
 */
const buildGenerateFailureDetails = (
  scope: typeof BACKUP_SCOPE_FULL,
  environment: string,
  failureReason: string,
): string =>
  JSON.stringify({
    scope,
    environment,
    formatVersion: BACKUP_FORMAT_VERSION,
    failureReason,
  });

/**
 * Generate the three archive files in a throwaway tmp directory, pipe
 * `tar -czf - ...` to a `WebReadableStream<Uint8Array>`, and return enough
 * metadata for the route to assemble a `Response`.
 *
 * The download log row is written at stream start and updated with the final
 * byte count once the producer (`tar`) closes. The generator success log row
 * is written once pg_dump + manifest + readme preparation succeed.
 */
export const streamFullBackupArchive = async ({
  connectionString,
  environment,
  scope,
}: StreamOptions): Promise<StreamResult> => {
  const startedAt = new Date();
  const filename = buildArchiveFilename(environment, startedAt);
  const streamStartedAtIso = formatUtcIso(startedAt);

  const tmpRoot = path.join(tmpdir(), `admin-database-backup-${randomUUID()}`);
  await mkdir(tmpRoot, { recursive: true });

  const dumpPath = path.join(tmpRoot, "dump.sql");
  const manifestPath = path.join(tmpRoot, "manifest.json");
  const readmePath = path.join(tmpRoot, "README.txt");

  try {
    const pgDumpBin = await resolvePgDumpBin();
    if (!pgDumpBin) {
      await createLogEvent(
        BACKUP_LOG_ACTIONS.generate,
        buildGenerateFailureDetails(scope, environment, "pg_dump_not_found"),
      );
      throw new Error("pg_dump binary not found in $PATH");
    }

    await runPgDump({ binPath: pgDumpBin, connectionString, dumpPath });

    const generatedAt = formatUtcIso(new Date());
    const manifest = buildManifest({ scope, environment });
    const readme = buildReadme({ environment, generatedAt });

    await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
    await writeFile(readmePath, readme, "utf8");

    // Generation succeeded — write the success Log row before stream start.
    await createLogEvent(
      BACKUP_LOG_ACTIONS.generate,
      JSON.stringify({
        scope,
        environment,
        formatVersion: BACKUP_FORMAT_VERSION,
        generatedAt,
      }),
    );
  } catch (error) {
    await cleanupTmp(tmpRoot);

    // If generation failed before we even reached the success Log row, ensure
    // there is a failure row keyed to this attempt.
    const message = error instanceof Error ? error.message : "Unknown preparation failure";
    try {
      await createLogEvent(BACKUP_LOG_ACTIONS.generate, buildGenerateFailureDetails(scope, environment, message));
    } catch {
      // Swallow audit-side failures so we don't shadow the original error.
    }

    throw error;
  }

  const downloadLog = await createLogEvent(
    BACKUP_LOG_ACTIONS.download,
    JSON.stringify({
      scope,
      environment,
      streamStartedAt: streamStartedAtIso,
      byteSize: null as number | null,
    }),
  );

  const tar = spawn("tar", ["-C", tmpRoot, "-czf", "-", "dump.sql", "manifest.json", "README.txt"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  let byteSize = 0;
  const stderrChunks: Buffer[] = [];
  tar.stderr.on("data", (chunk: Buffer) => {
    stderrChunks.push(chunk);
  });

  tar.stdout.on("data", (chunk: Buffer) => {
    byteSize += chunk.length;
  });

  tar.on("close", async (code) => {
    await cleanupTmp(tmpRoot);

    const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
    const baseDetails = {
      scope,
      environment,
      streamStartedAt: streamStartedAtIso,
    };

    if (code === 0) {
      await prisma.log.update({
        where: { id: downloadLog.id },
        data: {
          details: JSON.stringify({ ...baseDetails, byteSize }),
        },
      });
      return;
    }

    await prisma.log.update({
      where: { id: downloadLog.id },
      data: {
        details: JSON.stringify({
          ...baseDetails,
          byteSize,
          failureReason: stderr || `tar exited with code ${code}`,
        }),
      },
    });
  });

  tar.on("error", async (error) => {
    await cleanupTmp(tmpRoot);
    await prisma.log.update({
      where: { id: downloadLog.id },
      data: {
        details: JSON.stringify({
          scope,
          environment,
          streamStartedAt: streamStartedAtIso,
          byteSize,
          failureReason: error.message,
        }),
      },
    });
  });

  const stream = Readable.toWeb(tar.stdout) as unknown as WebReadableStream<Uint8Array>;

  if (typeof stream.getReader !== "function") {
    throw new Error("Failed to convert tar stdout into a Web ReadableStream");
  }

  return { stream, filename };
};

const cleanupTmp = async (tmpRoot: string): Promise<void> => {
  try {
    await rm(tmpRoot, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup; a future retention feature can sweep orphaned
    // tmp directories from `os.tmpdir()`.
  }
};

const execFileAsync = (file: string, args: readonly string[]) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(file, [...args], { encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) {
        reject(Object.assign(error, { stderr }));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
