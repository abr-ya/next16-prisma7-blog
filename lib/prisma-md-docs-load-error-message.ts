const GENERIC = "Unable to load posts. Please try again later.";
const UNREACHABLE = "Cannot reach the database. Check that the service is running and try again.";

const UNREACHABLE_KNOWN_CODES = new Set(["P1001", "P1002", "P1008", "ETIMEDOUT"]);

function getErrorRecord(error: unknown): Record<string, unknown> | null {
  if (typeof error !== "object" || error === null) return null;
  return error as Record<string, unknown>;
}

/** English user-facing message for home page md doc list failure (no secrets). */
export function getMdDocsLoadErrorMessage(error: unknown): string {
  const record = getErrorRecord(error);
  if (!record) return GENERIC;

  const name = record.name;
  const code = record.code;

  if (name === "PrismaClientInitializationError") {
    return UNREACHABLE;
  }

  if (name === "PrismaClientKnownRequestError" && typeof code === "string" && UNREACHABLE_KNOWN_CODES.has(code)) {
    return UNREACHABLE;
  }

  return GENERIC;
}
