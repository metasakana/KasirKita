import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/common";
import { useToast } from "@/src/components/Toast";
import { useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { formatRupiah, parseRupiah } from "@/src/utils/format";

export default function ProductForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getProduct, addProduct, updateProduct, deleteProduct, categories } = useStore();
  const toast = useToast();

  const existing = id ? getProduct(id) : undefined;
  const editing = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState(existing?.category ?? categories[0] ?? "Lainnya");
  const [qty, setQty] = useState(existing ? String(existing.qty) : "");
  const [cost, setCost] = useState(existing ? String(existing.costPrice) : "");
  const [sell, setSell] = useState(existing ? String(existing.sellPrice) : "");
  const [sellMode, setSellMode] = useState<"rp" | "persen">("rp");
  const [pctStr, setPctStr] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const costNum = parseRupiah(cost);
  const pct = parseRupiah(pctStr);
  const sellNum = sellMode === "rp" ? parseRupiah(sell) : pct > 0 ? Math.round(costNum * (1 + pct / 100)) : 0;
  const profit = sellNum - costNum;

  const catOptions = useMemo(
    () => (category && !categories.includes(category) ? [category, ...categories] : categories),
    [category, categories],
  );

  const save = () => {
    if (!name.trim()) {
      toast.show("Nama barang wajib diisi", "error");
      return;
    }
    if (sellNum <= 0) {
      toast.show("Harga jual belum diisi", "error");
      return;
    }
    const payload = {
      name: name.trim(),
      category,
      qty: parseInt(qty || "0", 10) || 0,
      costPrice: costNum,
      sellPrice: sellNum,
    };
    if (editing && existing) {
      updateProduct(existing.id, payload);
      toast.show("Barang diperbarui", "success");
    } else {
      addProduct(payload);
      toast.show("Barang ditambahkan", "success");
    }
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.divider }]}>
        <Pressable testID="form-close" onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface }}>
          {editing ? "Edit Barang" : "Tambah Barang"}
        </Text>
        {editing ? (
          <Pressable testID="form-delete" onPress={() => setConfirmDel(true)} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={24} color={colors.error} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <KeyboardAwareScrollView
        bottomOffset={90}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Nama Barang" colors={colors}>
          <TextInput
            testID="form-name-input"
            value={name}
            onChangeText={setName}
            placeholder="cth: Minyak Goreng Bimoli 1L"
            placeholderTextColor={colors.onSurfaceTertiary}
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
          />
        </Field>

        <Field label="Kategori" colors={colors}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {catOptions.map((c) => {
              const active = c === category;
              return (
                <Pressable
                  key={c}
                  testID={`form-cat-${c}`}
                  onPress={() => setCategory(c)}
                  style={{
                    flexShrink: 0,
                    height: 40,
                    paddingHorizontal: spacing.lg,
                    borderRadius: radius.pill,
                    justifyContent: "center",
                    backgroundColor: active ? colors.brand : colors.surfaceSecondary,
                    borderWidth: 1,
                    borderColor: active ? colors.brand : colors.border,
                  }}
                >
                  <Text style={{ fontFamily: Font.semibold, fontSize: 13, color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary }}>
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Field>

        <Field label="Stok Tersedia" colors={colors}>
          <TextInput
            testID="form-qty-input"
            value={qty}
            onChangeText={(t) => setQty(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.onSurfaceTertiary}
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
          />
        </Field>

        <Field label="Harga Modal / Beli (Rp)" colors={colors}>
          <TextInput
            testID="form-cost-input"
            value={cost}
            onChangeText={(t) => setCost(t.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.onSurfaceTertiary}
            style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
          />
        </Field>

        {/* Harga Jual: langsung (Rp) atau kenaikan persen dari modal */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>Harga Jual</Text>
            <View style={[styles.modeToggle, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {(
                [
                  { key: "rp", label: "Rp" },
                  { key: "persen", label: "Naik %" },
                ] as const
              ).map((m) => {
                const active = sellMode === m.key;
                return (
                  <Pressable
                    key={m.key}
                    testID={`form-sellmode-${m.key}`}
                    onPress={() => setSellMode(m.key)}
                    style={[styles.modeItem, { backgroundColor: active ? colors.brand : "transparent" }]}
                  >
                    <Text style={{ fontFamily: Font.bold, fontSize: 12, color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary }}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {sellMode === "rp" ? (
            <TextInput
              testID="form-sell-input"
              value={sell}
              onChangeText={(t) => setSell(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.onSurfaceTertiary}
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
            />
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
                <View style={[styles.input, { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <TextInput
                    testID="form-pct-input"
                    value={pctStr}
                    onChangeText={(t) => setPctStr(t.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder="cth: 10"
                    placeholderTextColor={colors.onSurfaceTertiary}
                    style={{ flex: 1, fontFamily: Font.medium, fontSize: 16, color: colors.onSurface, height: "100%" }}
                  />
                  <Text style={{ fontFamily: Font.bold, fontSize: 16, color: colors.onSurfaceTertiary }}>%</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {[5, 10, 15, 20, 25, 30].map((v) => {
                  const active = pct === v && pctStr !== "";
                  return (
                    <Pressable
                      key={v}
                      testID={`form-pct-${v}`}
                      onPress={() => setPctStr(String(v))}
                      style={{
                        height: 36,
                        paddingHorizontal: spacing.md,
                        borderRadius: radius.pill,
                        justifyContent: "center",
                        backgroundColor: active ? colors.brand : colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: active ? colors.brand : colors.border,
                      }}
                    >
                      <Text style={{ fontFamily: Font.semibold, fontSize: 13, color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary }}>
                        +{v}%
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text testID="form-sell-computed" style={{ fontFamily: Font.semibold, fontSize: 13, color: sellNum > 0 ? colors.success : colors.onSurfaceTertiary }}>
                {costNum > 0 && pct > 0
                  ? `Harga jual: ${formatRupiah(costNum)} + ${pct}% = ${formatRupiah(sellNum)}`
                  : "Isi harga modal & persen kenaikan dulu"}
              </Text>
            </>
          )}
        </View>

        {/* Profit preview */}
        <View style={[styles.profitCard, { backgroundColor: profit >= 0 ? colors.brandTertiary : colors.errorTint }]}>
          <Text style={{ fontFamily: Font.medium, fontSize: 13, color: colors.onSurfaceSecondary }}>
            Keuntungan per unit{sellMode === "persen" && sellNum > 0 ? ` · Jual ${formatRupiah(sellNum)}` : ""}
          </Text>
          <Text style={{ fontFamily: Font.displayBold, fontSize: 24, color: profit >= 0 ? colors.brand : colors.error }}>
            {formatRupiah(profit)}
          </Text>
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }}>
          <PrimaryButton testID="form-save" label={editing ? "Simpan Perubahan" : "Tambah ke Stok"} icon="checkmark" onPress={save} />
        </View>
      </KeyboardStickyView>

      <Modal visible={confirmDel} transparent animationType="fade" onRequestClose={() => setConfirmDel(false)}>
        <Pressable style={styles.backdrop} onPress={() => setConfirmDel(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={{ fontFamily: Font.bold, fontSize: 18, color: colors.onSurface }}>Hapus Barang?</Text>
            <Text style={{ fontFamily: Font.regular, fontSize: 14, color: colors.onSurfaceTertiary, marginBottom: spacing.md }}>
              &quot;{existing?.name}&quot; akan dihapus dari stok.
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <PrimaryButton label="Batal" variant="outline" onPress={() => setConfirmDel(false)} style={{ flex: 1 }} />
              <Pressable
                testID="form-delete-confirm"
                onPress={() => {
                  if (existing) deleteProduct(existing.id);
                  setConfirmDel(false);
                  toast.show("Barang dihapus", "success");
                  router.back();
                }}
                style={[styles.dangerBtn, { backgroundColor: colors.error }]}
              >
                <Text style={{ fontFamily: Font.bold, fontSize: 16, color: "#fff" }}>Hapus</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Field({ label, children, colors, style }: any) {
  return (
    <View style={[{ gap: spacing.sm }, style]}>
      <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  input: { height: 54, borderRadius: radius.md, paddingHorizontal: spacing.lg, fontFamily: Font.medium, fontSize: 16, borderWidth: 1 },
  modeToggle: { flexDirection: "row", borderRadius: radius.pill, borderWidth: 1, padding: 3, gap: 3 },
  modeItem: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill },
  profitCard: { borderRadius: radius.md, padding: spacing.lg },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl, paddingBottom: spacing["2xl"], gap: spacing.sm },
  dangerBtn: { flex: 1, minHeight: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
