import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Header, PrimaryButton } from "@/src/components/common";
import { useToast } from "@/src/components/Toast";
import { useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { ThemeMode } from "@/src/theme/themes";
import { Font, radius, spacing } from "@/src/theme/themes";
import { exportCSV } from "@/src/utils/csv";

const THEMES: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "terang", label: "Terang", icon: "sunny" },
  { key: "netral", label: "Netral", icon: "contrast" },
  { key: "gelap", label: "Gelap", icon: "moon" },
];

export default function Pengaturan() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { mode, setMode } = useTheme();
  const { storeName, setStoreName, products, clearPin, resetAllData } = useStore();
  const toast = useToast();

  const [nameModal, setNameModal] = useState(false);
  const [nameDraft, setNameDraft] = useState(storeName);
  const [confirm, setConfirm] = useState<null | "pin" | "reset">(null);
  const inputRef = useRef<TextInput>(null);

  const tabBarH = (insets.bottom > 0 ? insets.bottom : spacing.md) + 56;

  const exportProducts = async () => {
    if (products.length === 0) {
      toast.show("Belum ada barang untuk diekspor", "error");
      return;
    }
    const rows: (string | number)[][] = [
      ["Data Barang - " + storeName],
      ["Nama Barang", "Kategori", "Stok", "Harga Modal", "Harga Jual", "Untung/unit"],
      ...products.map((p) => [
        p.name,
        p.category,
        p.qty,
        p.costPrice,
        p.sellPrice,
        p.sellPrice - p.costPrice,
      ]),
    ];
    try {
      await exportCSV("data-barang.csv", rows);
    } catch {
      toast.show("Gagal mengekspor", "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Header title="Pengaturan" subtitle="Sesuaikan aplikasi Anda" testID="pengaturan-header" />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: tabBarH + 24, gap: spacing.xl }}>
        {/* Store name */}
        <Section title="Toko" colors={colors}>
          <Pressable
            testID="setting-store-name"
            onPress={() => {
              setNameDraft(storeName);
              setNameModal(true);
            }}
            style={[styles.row, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <IconBox icon="storefront" colors={colors} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Nama Toko</Text>
              <Text style={{ fontFamily: Font.regular, fontSize: 13, color: colors.onSurfaceTertiary }}>
                {storeName}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
          </Pressable>
        </Section>

        {/* Theme */}
        <Section title="Tampilan" colors={colors}>
          <View style={[styles.themeRow, { backgroundColor: colors.surfaceSecondary }]}>
            {THEMES.map((t) => {
              const active = t.key === mode;
              return (
                <Pressable
                  key={t.key}
                  testID={`theme-${t.key}`}
                  onPress={() => setMode(t.key)}
                  style={[
                    styles.themeItem,
                    { backgroundColor: active ? colors.brand : "transparent" },
                  ]}
                >
                  <Ionicons
                    name={t.icon}
                    size={22}
                    color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary}
                  />
                  <Text
                    style={{
                      fontFamily: Font.semibold,
                      fontSize: 13,
                      marginTop: 4,
                      color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary,
                    }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Data */}
        <Section title="Data" colors={colors}>
          <SettingRow
            testID="setting-export-products"
            icon="download-outline"
            label="Ekspor Data Barang (CSV)"
            sub="Simpan daftar barang ke Excel/CSV"
            colors={colors}
            onPress={exportProducts}
          />
        </Section>

        {/* Security */}
        <Section title="Keamanan" colors={colors}>
          <SettingRow
            testID="setting-change-pin"
            icon="lock-closed-outline"
            label="Ganti PIN"
            sub="Buat PIN baru untuk masuk"
            colors={colors}
            onPress={() => setConfirm("pin")}
          />
          <SettingRow
            testID="setting-reset-data"
            icon="trash-outline"
            label="Hapus Semua Data"
            sub="Kosongkan barang & transaksi"
            colors={colors}
            danger
            onPress={() => setConfirm("reset")}
          />
        </Section>

        <Text style={{ textAlign: "center", fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
          WarungPintar · Data tersimpan di HP ini
        </Text>
      </ScrollView>

      {/* Store name modal */}
      <Modal visible={nameModal} transparent animationType="fade" onRequestClose={() => setNameModal(false)}>
        <Pressable style={styles.backdrop} onPress={() => setNameModal(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={{ fontFamily: Font.bold, fontSize: 18, color: colors.onSurface }}>Nama Toko</Text>
            <TextInput
              ref={inputRef}
              testID="store-name-input"
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              placeholder="Contoh: Toko Berkah Jaya"
              placeholderTextColor={colors.onSurfaceTertiary}
              style={[
                styles.input,
                { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border },
              ]}
            />
            <PrimaryButton
              testID="store-name-save"
              label="Simpan"
              onPress={() => {
                const v = nameDraft.trim() || "Toko Saya";
                setStoreName(v);
                setNameModal(false);
                toast.show("Nama toko diperbarui", "success");
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Confirm modal */}
      <Modal visible={confirm !== null} transparent animationType="fade" onRequestClose={() => setConfirm(null)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirm(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={{ fontFamily: Font.bold, fontSize: 18, color: colors.onSurface }}>
              {confirm === "pin" ? "Ganti PIN?" : "Hapus Semua Data?"}
            </Text>
            <Text style={{ fontFamily: Font.regular, fontSize: 14, color: colors.onSurfaceTertiary, marginTop: spacing.xs, marginBottom: spacing.lg }}>
              {confirm === "pin"
                ? "Anda akan diminta membuat PIN baru."
                : "Semua barang dan riwayat transaksi akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <PrimaryButton
                testID="confirm-cancel"
                label="Batal"
                variant="outline"
                onPress={() => setConfirm(null)}
                style={{ flex: 1 }}
              />
              <Pressable
                testID="confirm-ok"
                onPress={async () => {
                  if (confirm === "pin") {
                    await clearPin();
                    setConfirm(null);
                    router.replace("/login");
                  } else {
                    await resetAllData();
                    setConfirm(null);
                    toast.show("Semua data dihapus", "success");
                  }
                }}
                style={[
                  styles.dangerBtn,
                  { backgroundColor: confirm === "reset" ? colors.error : colors.brand },
                ]}
              >
                <Text style={{ fontFamily: Font.bold, fontSize: 16, color: "#fff" }}>
                  {confirm === "pin" ? "Ganti" : "Hapus"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Section({ title, children, colors }: any) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ fontFamily: Font.bold, fontSize: 13, color: colors.onSurfaceTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </Text>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

function IconBox({ icon, colors, danger }: any) {
  return (
    <View style={[styles.iconBox, { backgroundColor: danger ? colors.errorTint : colors.brandTertiary }]}>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.brand} />
    </View>
  );
}

function SettingRow({ icon, label, sub, colors, onPress, danger, testID }: any) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
    >
      <IconBox icon={icon} colors={colors} danger={danger} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: danger ? colors.error : colors.onSurface }]}>{label}</Text>
        <Text style={{ fontFamily: Font.regular, fontSize: 13, color: colors.onSurfaceTertiary }}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rowLabel: { fontFamily: Font.semibold, fontSize: 15 },
  iconBox: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  themeRow: { flexDirection: "row", borderRadius: radius.md, padding: 6, gap: 6 },
  themeItem: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderRadius: radius.sm },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  input: {
    height: 54,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontFamily: Font.medium,
    fontSize: 16,
    borderWidth: 1,
  },
  dangerBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
