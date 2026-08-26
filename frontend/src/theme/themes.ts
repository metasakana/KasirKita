// Theme palettes for Kasir Kita POS.
// Three modes per user request: terang (bright/default), gelap (dark), netral (neutral).
// Colors sourced from design_guidelines.json. NO blues/purples.

export type ThemeColors = {
  surface: string;
  onSurface: string;
  surfaceSecondary: string;
  onSurfaceSecondary: string;
  surfaceTertiary: string;
  onSurfaceTertiary: string;
  surfaceInverse: string;
  onSurfaceInverse: string;
  brand: string;
  brandPrimary: string;
  onBrandPrimary: string;
  brandSecondary: string;
  onBrandSecondary: string;
  brandTertiary: string;
  onBrandTertiary: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;
  error: string;
  onError: string;
  errorTint: string;
  border: string;
  borderStrong: string;
  divider: string;
  gradient: [string, string];
  isDark: boolean;
};

export type ThemeMode = "terang" | "gelap" | "netral";

const terang: ThemeColors = {
  surface: "#FFFFFF",
  onSurface: "#1A1412",
  surfaceSecondary: "#F5F0EB",
  onSurfaceSecondary: "#3D312B",
  surfaceTertiary: "#EAE3DD",
  onSurfaceTertiary: "#5C4A42",
  surfaceInverse: "#14100D",
  onSurfaceInverse: "#FDFCFB",
  brand: "#FF6B00",
  brandPrimary: "#FF6B00",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FFB800",
  onBrandSecondary: "#1A1412",
  brandTertiary: "#FFE1CC",
  onBrandTertiary: "#8A3A00",
  success: "#16A34A",
  onSuccess: "#FFFFFF",
  warning: "#EAB308",
  onWarning: "#1A1412",
  error: "#DC2626",
  onError: "#FFFFFF",
  errorTint: "#FDECEC",
  border: "#E5DCD5",
  borderStrong: "#C2B2A9",
  divider: "#E5DCD5",
  gradient: ["#FF6B00", "#FFB800"],
  isDark: false,
};

const gelap: ThemeColors = {
  surface: "#14100D",
  onSurface: "#FDFCFB",
  surfaceSecondary: "#241D18",
  onSurfaceSecondary: "#E5DCD5",
  surfaceTertiary: "#332A23",
  onSurfaceTertiary: "#C2B2A9",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#1A1412",
  brand: "#FF8A33",
  brandPrimary: "#FF8A33",
  onBrandPrimary: "#1A1412",
  brandSecondary: "#FFC733",
  onBrandSecondary: "#1A1412",
  brandTertiary: "#4D2100",
  onBrandTertiary: "#FFD1B3",
  success: "#22C55E",
  onSuccess: "#000000",
  warning: "#FACC15",
  onWarning: "#000000",
  error: "#EF4444",
  onError: "#FFFFFF",
  errorTint: "#3A1A1A",
  border: "#332A23",
  borderStrong: "#4A3E35",
  divider: "#2A221C",
  gradient: ["#FF8A33", "#FFC733"],
  isDark: true,
};

// Neutral: warm grayscale (stone), muted brand, no orange dominance.
const netral: ThemeColors = {
  surface: "#FFFFFF",
  onSurface: "#1C1917",
  surfaceSecondary: "#FAFAF9",
  onSurfaceSecondary: "#44403C",
  surfaceTertiary: "#F5F5F4",
  onSurfaceTertiary: "#57534E",
  surfaceInverse: "#1C1917",
  onSurfaceInverse: "#FAFAF9",
  brand: "#44403C",
  brandPrimary: "#44403C",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#78716C",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#E7E5E4",
  onBrandTertiary: "#44403C",
  success: "#16A34A",
  onSuccess: "#FFFFFF",
  warning: "#CA8A04",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",
  errorTint: "#FBEBEB",
  border: "#E7E5E4",
  borderStrong: "#D6D3D1",
  divider: "#E7E5E4",
  gradient: ["#44403C", "#78716C"],
  isDark: false,
};

export const themes: Record<ThemeMode, ThemeColors> = { terang, gelap, netral };

export const Font = {
  display: "SpaceGrotesk_400Regular",
  displayMedium: "SpaceGrotesk_500Medium",
  displayBold: "SpaceGrotesk_700Bold",
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radius = { sm: 8, md: 16, lg: 24, pill: 999 };
