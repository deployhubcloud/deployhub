export const dateTime = (value) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
};
export const shortDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { dateStyle: "medium" })
    : "—";
};
export const number = (value) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString()
    : "—";
export const message = (error) =>
  error.response?.data?.message ||
  error.message ||
  "The action could not be completed.";
export const titleCase = (value) =>
  String(value || "Unknown")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
export function bytes(value) {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  const n = Number(value);
  if (n < 1024) return n + " B";
  const unit = Math.min(4, Math.floor(Math.log(n) / Math.log(1024)));
  return (
    (n / 1024 ** unit).toFixed(1) + " " + ["B", "KB", "MB", "GB", "TB"][unit]
  );
}
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
export function exportCsv(filename, columns, rows) {
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const content = [
    columns.map((column) => cell(column.label)).join(","),
    ...rows.map((row) =>
      columns.map((column) => cell(column.value(row))).join(","),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
