import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

function escapeCell(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Build CSV (with BOM so Excel opens Indonesian/UTF-8 correctly) and share it.
export async function exportCSV(filename: string, rows: (string | number)[][]): Promise<void> {
  const csv = "\uFEFF" + rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
  const file = new File(Paths.cache, filename);
  try {
    if (file.exists) file.delete();
  } catch {
    // ignore
  }
  file.create();
  file.write(csv);

  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: filename,
      UTI: "public.comma-separated-values-text",
    });
  }
}
