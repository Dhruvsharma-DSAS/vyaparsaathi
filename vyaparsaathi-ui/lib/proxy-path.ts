/** Paths the /api/backend proxy may forward to the Python API: its own /api/... routes and /health. */
export function isAllowedPath(segments: string[]) {
  if (segments.length === 0) return false;
  if (segments.some((segment) => !segment || segment === ".." || segment === "." || /[\\/?#]/.test(segment))) return false;
  return (segments[0] === "api" && segments.length > 1) || (segments.length === 1 && segments[0] === "health");
}
