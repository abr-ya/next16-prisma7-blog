export const databaseBackupScopes = [
  {
    name: "Full database",
    status: "Planned",
    description:
      "All project PostgreSQL data needed to reconstruct app state, including auth, content, comments, links, videos, tags, file metadata, and logs when selected.",
  },
  {
    name: "Partial export",
    status: "Planned",
    description:
      "A deliberately limited export by selected domain or table with included and omitted data declared in the backup metadata.",
  },
] as const;

export const databaseBackupMetadataFields = [
  "Generation time",
  "Environment label",
  "Backup scope",
  "Included domains or tables",
  "Format version",
  "Generator source",
  "Restore compatibility notes",
] as const;

export const databaseBackupBoundaries = [
  {
    name: "Admin role required",
    description:
      "Backup pages and future actions use server-side admin-role authorization, not only the admin layout session gate.",
  },
  {
    name: "Provider files excluded",
    description:
      "FileAsset rows and content references can be part of database backups, but UploadThing object bytes are separate.",
  },
  {
    name: "Restore deferred",
    description:
      "Live restore, import, overwrite, reset, and destructive behavior wait for a separate design with preflight checks.",
  },
  {
    name: "Auditable operations",
    description:
      "Backup generation and download flows must preserve administrator identity, action time, scope, artifact, and result.",
  },
] as const;
