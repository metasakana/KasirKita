import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/common";
import { useToast } from "@/src/components/Toast";
import { useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { formatRupiah, parseRupiah } from "@/src/utils/format";

function suggestions(total: number): number[] {
  const set = new Set<number>();
  set.add(total); // uang pas
  const denoms = [5000, 10000, 20000, 50000, 100000];
  for (const d of denoms) {
    const rounded = Math.ceil(total / d) * d;
    if (rounded > total) set.add(rounded);
  }
  return Array.from(set).sort((a, b) => a - b).slice(0, 6);
}

export default function Checkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { cart, products, checkout } = useStore();
  const toast = useToast();

  const subtotal = useMemo(() => {
    return Object.entries(cart).reduce((s, [id, qty]) => {
      const p = products.find((x) => x.id === id);
      return s + (p ? p.sellPrice * qty : 0);
    }, 0);
  }, [cart, products]);

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  // Diskon
  const [discType, setDiscType] = useState<"rp" | "persen">("rp");
  const [discStr, setDiscStr] = useState("");
  const discInput = parseRupiah(discStr);
  const discount = useMemo(() => {
    if (discInput <= 0) return 0;
    const raw = discType === "rp" ? discInput : Math.round((subtotal * Math.min(discInput, 100)) / 100);
    return Math.min(raw, subtotal);
  }, [discInput, discType, subtotal]);
  const total = subtotal - discount;

  // Metode pembayaran
  const [method, setMethod] = useState<"tunai" | "kasbon">("tunai");

  // Tunai
  const [paidStr, setPaidStr] = useState("");
  const paid = parseRupiah(paidStr);
  const change = paid - total;
  const enough = itemCount > 0 && paid >= total;

  // Kasbon
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custNote, setCustNote] = useState("");
  const [dpStr, setDpStr] = useState("");
  const dp = parseRupiah(dpStr);

  const handleSave = () => {
    if (method === "kasbon") {
      if (!custName.trim()) {
        toast.show("Nama pelanggan wajib diisi", "error");
        return;
      }
      if (total > 0 && dp >= total) {
        toast.show("Uang muka sudah menutupi total. Gunakan metode Tunai", "error");
        return;
      }
      const tx = checkout({ paid: dp, discount, debt: { customerName: custName, phone: custPhone, note: custNote } });
      if (!tx) {
        toast.show("Keranjang kosong", "error");
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/receipt", params: { id: tx.id } });
      return;
    }
    if (!enough) {
      toast.show("Uang diterima kurang dari total", "error");
      return;
    }
    const tx = checkout({ paid, discount });
    if (!tx) {
      toast.show("Keranjang kosong", "error");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: "/receipt", params: { id: tx.id } });
  };

  const quick = suggestions(total);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.divider }]}>
        <Pressable testID="checkout-close" onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface }}>Pembayaran</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAwareScrollView
        bottomOffset={90}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Total */}
        <View style={[styles.totalCard, { backgroundColor: colors.brand }]}>
          <Text style={{ fontFamily: Font.medium, fontSize: 14, color: colors.onBrandPrimary, opacity: 0.9 }}>
            Total Belanja · {itemCount} item
          </Text>
          <Text testID="checkout-total" style={{ fontFamily: Font.displayBold, fontSize: 40, color: colors.onBrandPrimary }}>
            {formatRupiah(total)}
          </Text>
          {discount > 0 ? (
            <Text style={{ fontFamily: Font.medium, fontSize: 13, color: colors.onBrandPrimary, opacity: 0.9, marginTop: 2 }}>
              Subtotal {formatRupiah(subtotal)} − Diskon {formatRupiah(discount)}
            </Text>
          ) : null}
        </View>

        {/* Diskon */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>
            Diskon / Potongan Harga
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <View style={[styles.discToggle, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              {(["rp", "persen"] as const).map((t) => {
                const active = discType === t;
                return (
                  <Pressable
                    key={t}
                    testID={`checkout-disc-${t}`}
                    onPress={() => {
                      setDiscType(t);
                      setDiscStr("");
                    }}
                    style={[styles.discToggleItem, { backgroundColor: active ? colors.brand : "transparent" }]}
                  >
                    <Text style={{ fontFamily: Font.bold, fontSize: 15, color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary }}>
                      {t === "rp" ? "Rp" : "%"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.discInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <TextInput
                testID="checkout-discount-input"
                value={discType === "rp" ? (discInput ? discInput.toLocaleString("id-ID") : "") : discStr}
                onChangeText={(t) => setDiscStr(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder={discType === "rp" ? "0" : "0 %"}
                placeholderTextColor={colors.onSurfaceTertiary}
                style={{ flex: 1, fontFamily: Font.displayBold, fontSize: 18, color: colors.onSurface, height: "100%" }}
              />
            </View>
          </View>
          {discount > 0 ? (
            <Text testID="checkout-discount-value" style={{ fontFamily: Font.semibold, fontSize: 13, color: colors.success }}>
              Potongan harga: -{formatRupiah(discount)}
            </Text>
          ) : null}
        </View>

        {/* Metode pembayaran */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>Metode Pembayaran</Text>
          <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary }]}>
            {(
              [
                { key: "tunai", label: "Tunai", icon: "cash-outline" },
                { key: "kasbon", label: "Kasbon / Hutang", icon: "wallet-outline" },
              ] as const
            ).map((m) => {
              const active = method === m.key;
              return (
                <Pressable
                  key={m.key}
                  testID={`checkout-method-${m.key}`}
                  onPress={() => setMethod(m.key)}
                  style={[styles.segmentItem, { backgroundColor: active ? colors.brand : "transparent" }]}
                >
                  <Ionicons name={m.icon} size={18} color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary} />
                  <Text style={{ fontFamily: Font.semibold, fontSize: 13, color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary }}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {method === "tunai" ? (
          <>
            {/* Uang diterima */}
            <View style={{ gap: spacing.sm }}>
              <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>Uang Diterima</Text>
              <View style={[styles.input, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurfaceTertiary }}>Rp</Text>
                <TextInput
                  testID="checkout-paid-input"
                  value={paidStr ? parseRupiah(paidStr).toLocaleString("id-ID") : ""}
                  onChangeText={(t) => setPaidStr(t.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.onSurfaceTertiary}
                  style={{ flex: 1, fontFamily: Font.displayBold, fontSize: 24, color: colors.onSurface, height: "100%" }}
                />
              </View>

              {/* Quick cash */}
              <View style={styles.quickWrap}>
                {quick.map((v) => (
                  <Pressable
                    key={v}
                    testID={`checkout-quick-${v}`}
                    onPress={() => setPaidStr(String(v))}
                    style={[styles.quickChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                  >
                    <Text style={{ fontFamily: Font.semibold, fontSize: 13, color: colors.onSurface }}>
                      {v === total ? "Uang Pas" : formatRupiah(v)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Kembalian */}
            <View style={[styles.changeCard, { backgroundColor: colors.surfaceSecondary, borderColor: enough ? colors.success : colors.border }]}>
              <Text style={{ fontFamily: Font.medium, fontSize: 14, color: colors.onSurfaceSecondary }}>Kembalian</Text>
              <Text
                testID="checkout-change-value"
                style={{
                  fontFamily: Font.displayBold,
                  fontSize: 28,
                  color: paid === 0 ? colors.onSurfaceTertiary : enough ? colors.success : colors.error,
                }}
              >
                {paid === 0 ? formatRupiah(0) : enough ? formatRupiah(change) : "Kurang " + formatRupiah(-change)}
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* Data pelanggan kasbon */}
            <View style={{ gap: spacing.sm }}>
              <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>Nama Pelanggan *</Text>
              <TextInput
                testID="checkout-cust-name"
                value={custName}
                onChangeText={setCustName}
                placeholder="cth: Bu Siti"
                placeholderTextColor={colors.onSurfaceTertiary}
                style={[styles.textInput, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
              />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>No. HP</Text>
                <TextInput
                  testID="checkout-cust-phone"
                  value={custPhone}
                  onChangeText={setCustPhone}
                  keyboardType="phone-pad"
                  placeholder="08xx (opsional)"
                  placeholderTextColor={colors.onSurfaceTertiary}
                  style={[styles.textInput, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
                />
              </View>
              <View style={{ flex: 1, gap: spacing.sm }}>
                <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>Catatan</Text>
                <TextInput
                  testID="checkout-cust-note"
                  value={custNote}
                  onChangeText={setCustNote}
                  placeholder="opsional"
                  placeholderTextColor={colors.onSurfaceTertiary}
                  style={[styles.textInput, { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border }]}
                />
              </View>
            </View>
            <View style={{ gap: spacing.sm }}>
              <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>
                Uang Muka / DP (opsional)
              </Text>
              <View style={[styles.input, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurfaceTertiary }}>Rp</Text>
                <TextInput
                  testID="checkout-dp-input"
                  value={dpStr ? dp.toLocaleString("id-ID") : ""}
                  onChangeText={(t) => setDpStr(t.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.onSurfaceTertiary}
                  style={{ flex: 1, fontFamily: Font.displayBold, fontSize: 24, color: colors.onSurface, height: "100%" }}
                />
              </View>
            </View>

            {/* Sisa hutang */}
            <View style={[styles.changeCard, { backgroundColor: colors.errorTint, borderColor: colors.error }]}>
              <Text style={{ fontFamily: Font.medium, fontSize: 14, color: colors.onSurfaceSecondary }}>
                Sisa Hutang (Kasbon)
              </Text>
              <Text
                testID="checkout-debt-remaining"
                style={{ fontFamily: Font.displayBold, fontSize: 28, color: colors.error }}
              >
                {formatRupiah(Math.max(0, total - Math.min(dp, total)))}
              </Text>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }}>
          <PrimaryButton
            testID="checkout-save"
            label={method === "kasbon" ? "Simpan Kasbon" : "Simpan & Cetak Struk"}
            icon={method === "kasbon" ? "wallet" : "checkmark-circle"}
            onPress={handleSave}
            disabled={method === "kasbon" ? itemCount === 0 || !custName.trim() : !enough}
          />
        </View>
      </KeyboardStickyView>
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
  totalCard: { borderRadius: radius.lg, padding: spacing.xl, alignItems: "center" },
  input: { flexDirection: "row", alignItems: "center", gap: spacing.sm, height: 60, borderRadius: radius.md, paddingHorizontal: spacing.lg, borderWidth: 1 },
  textInput: { height: 54, borderRadius: radius.md, paddingHorizontal: spacing.lg, fontFamily: Font.medium, fontSize: 16, borderWidth: 1 },
  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  quickChip: { height: 40, paddingHorizontal: spacing.lg, borderRadius: radius.pill, justifyContent: "center", borderWidth: 1 },
  changeCard: { borderRadius: radius.md, padding: spacing.lg, borderWidth: 1.5 },
  discToggle: { flexDirection: "row", height: 54, borderRadius: radius.md, borderWidth: 1, padding: 4, gap: 4 },
  discToggleItem: { width: 54, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  discInput: { flex: 1, height: 54, borderRadius: radius.md, paddingHorizontal: spacing.lg, borderWidth: 1, justifyContent: "center" },
  segment: { flexDirection: "row", borderRadius: radius.md, padding: 4, gap: 4 },
  segmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.sm,
  },
});
