import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

function escapeCell(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// Build CSV (with BOM so Excel opens Indonesian/UTF-8 correctly) and share/download it.
export async function exportCSV(filename: string, rows: (string | number)[][]): Promise<void> {
  const csv = "\uFEFF" + rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");

  // Web: expo-file-system is not supported — download the file directly in the browser.
  if (Platform.OS === "web") {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  // Native: write to cache then open the share sheet.
  const file = new File(Paths.cache, filename);
  try {
    if (file.exists) file.delete();
  } catch {
    // ignore
  }
  try {
    file.create();
  } catch {
    // file may already exist — write() below will overwrite the content
  }
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
