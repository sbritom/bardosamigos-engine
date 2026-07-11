export function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[index]}`;
}

export function formatDuration(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const rest = Math.floor(value % 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m ${rest}s`;
}

export function formatStatus(value) {
  return String(value || "offline").toUpperCase();
}

export function toneFor(value) {
  const normalized = String(value || "").toLowerCase();
  if (["online", "ok", "ready", "live", "playing", "healthy"].includes(normalized)) return "ok";
  if (["warn", "warning", "idle", "unknown", "buffering"].includes(normalized)) return "warn";
  return "error";
}
