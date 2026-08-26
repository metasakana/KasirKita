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

  const total = useMemo(() => {
    return Object.entries(cart).reduce((s, [id, qty]) => {
      const p = products.find((x) => x.id === id);
      return s + (p ? p.sellPrice * qty : 0);
    }, 0);
  }, [cart, products]);

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const [paidStr, setPaidStr] = useState("");
  const paid = parseRupiah(paidStr);
  const change = paid - total;
  const enough = paid >= total && total > 0;

  const handleSave = () => {
    if (!enough) {
      toast.show("Uang diterima kurang dari total", "error");
      return;
    }
    const tx = checkout(paid);
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
          <Text style={{ fontFamily: Font.displayBold, fontSize: 40, color: colors.onBrandPrimary }}>
            {formatRupiah(total)}
          </Text>
        </View>

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
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
        <View style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider }}>
          <PrimaryButton
            testID="checkout-save"
            label="Simpan & Cetak Struk"
            icon="checkmark-circle"
            onPress={handleSave}
            disabled={!enough}
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
  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  quickChip: { height: 40, paddingHorizontal: spacing.lg, borderRadius: radius.pill, justifyContent: "center", borderWidth: 1 },
  changeCard: { borderRadius: radius.md, padding: spacing.lg, borderWidth: 1.5 },
});
