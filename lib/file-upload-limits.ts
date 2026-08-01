export const GENERAL_FILE_UPLOAD_MAX_BYTES = 64 * 1024 * 1024;
export const GENERAL_FILE_UPLOAD_MAX_SIZE = "64MB";
export const GENERAL_FILE_UPLOAD_MAX_COUNT = 1;
export const GENERAL_FILE_USER_STORAGE_LIMIT_BYTES = 512 * 1024 * 1024;

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
};
