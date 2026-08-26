import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState, PrimaryButton } from "@/src/components/common";
import { useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { formatRupiah } from "@/src/utils/format";

export default function Cart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { cart, products, setCartQty, removeFromCart, clearCart } = useStore();

  const items = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const p = products.find((x) => x.id === id);
        return p ? { p, qty } : null;
      })
      .filter(Boolean) as { p: (typeof products)[number]; qty: number }[];
  }, [cart, products]);

  const total = items.reduce((s, it) => s + it.p.sellPrice * it.qty, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.divider }]}>
        <Pressable testID="cart-close" onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface }}>Keranjang</Text>
        {items.length > 0 ? (
          <Pressable testID="cart-clear" onPress={clearCart} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </Pressable>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      {items.length === 0 ? (
        <EmptyState
          testID="cart-empty"
          icon="cart-outline"
          title="Keranjang kosong"
          subtitle="Pilih barang di menu Kasir untuk mulai transaksi"
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 24 }}>
            {items.map(({ p, qty }) => (
              <View key={p.id} style={[styles.row, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Font.semibold, fontSize: 15, color: colors.onSurface }} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={{ fontFamily: Font.displayMedium, fontSize: 13, color: colors.onSurfaceTertiary, marginTop: 2 }}>
                    {formatRupiah(p.sellPrice)} · maks {p.qty}
                  </Text>
                  <Text style={{ fontFamily: Font.displayBold, fontSize: 16, color: colors.brand, marginTop: 4 }}>
                    {formatRupiah(p.sellPrice * qty)}
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    testID={`cart-minus-${p.id}`}
                    onPress={() => (qty <= 1 ? removeFromCart(p.id) : setCartQty(p.id, qty - 1))}
                    style={[styles.stepBtn, { backgroundColor: colors.surfaceTertiary }]}
                  >
                    <Ionicons name={qty <= 1 ? "trash-outline" : "remove"} size={20} color={colors.onSurface} />
                  </Pressable>
                  <Text style={{ fontFamily: Font.displayBold, fontSize: 18, color: colors.onSurface, minWidth: 28, textAlign: "center" }}>
                    {qty}
                  </Text>
                  <Pressable
                    testID={`cart-plus-${p.id}`}
                    onPress={() => setCartQty(p.id, qty + 1)}
                    disabled={qty >= p.qty}
                    style={[styles.stepBtn, { backgroundColor: qty >= p.qty ? colors.surfaceTertiary : colors.brand, opacity: qty >= p.qty ? 0.5 : 1 }]}
                  >
                    <Ionicons name="add" size={20} color={qty >= p.qty ? colors.onSurface : colors.onBrandPrimary} />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
              <Text style={{ fontFamily: Font.medium, fontSize: 15, color: colors.onSurfaceSecondary }}>Total Belanja</Text>
              <Text style={{ fontFamily: Font.displayBold, fontSize: 26, color: colors.onSurface }}>{formatRupiah(total)}</Text>
            </View>
            <PrimaryButton
              testID="cart-checkout"
              label="Lanjut Bayar"
              icon="arrow-forward"
              onPress={() => router.replace("/checkout")}
            />
          </View>
        </>
      )}
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
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepBtn: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  footer: { padding: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth },
});
