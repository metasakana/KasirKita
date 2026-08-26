// Formatting helpers for Indonesian Rupiah, numbers and dates.

export function formatNumber(n: number): string {
  const v = Math.round(n || 0);
  const neg = v < 0;
  const s = Math.abs(v).toString();
  return (neg ? "-" : "") + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatRupiah(n: number): string {
  return "Rp " + formatNumber(n);
}

// Parse a user-typed rupiah string ("12.000", "12000", "Rp 12.000") -> number.
export function parseRupiah(s: string): number {
  const digits = (s || "").replace(/[^0-9]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

const BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];
const BULAN_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateFull(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${BULAN_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}
