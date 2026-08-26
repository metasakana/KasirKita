import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipRow, EmptyState, PrimaryButton } from "@/src/components/common";
import { Header } from "@/src/components/common";
import { LOW_STOCK_THRESHOLD, Product, useStore } from "@/src/store/StoreContext";
import { useToast } from "@/src/components/Toast";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { formatRupiah } from "@/src/utils/format";

export default function Kasir() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { products, cart, addToCart, categories } = useStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");

  const FILTERS = useMemo(() => ["Semua", ...categories], [categories]);
  const activeCategory = FILTERS.includes(category) ? category : "Semua";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q);
      const matchC = activeCategory === "Semua" || p.category === activeCategory;
      return matchQ && matchC;
    });
  }, [products, query, activeCategory]);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = products.find((x) => x.id === id);
      return sum + (p ? p.sellPrice * qty : 0);
    }, 0);
  }, [cart, products]);

  const tabBarH = (insets.bottom > 0 ? insets.bottom : spacing.md) + 56;

  const handleAdd = (p: Product) => {
    if (p.qty <= 0) {
      toast.show("Stok habis", "error");
      return;
    }
    const ok = addToCart(p.id);
    if (ok) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      toast.show(`Stok ${p.name} tidak cukup`, "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Header title="Kasir" subtitle="Pilih barang belanjaan" testID="kasir-header" />

      {/* Search bar */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <View
          style={[
            styles.search,
            { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.onSurfaceTertiary} />
          <TextInput
            testID="kasir-search-input"
            value={query}
            onChangeText={setQuery}
            placeholder="Cari nama barang..."
            placeholderTextColor={colors.onSurfaceTertiary}
            style={[styles.searchInput, { color: colors.onSurface }]}
          />
          {query ? (
            <Pressable testID="kasir-search-clear" onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.onSurfaceTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ChipRow items={FILTERS} selected={activeCategory} onSelect={setCategory} />

      {filtered.length === 0 ? (
        <EmptyState
          testID="kasir-empty"
          icon="cube-outline"
          title={products.length === 0 ? "Belum ada barang di toko" : "Barang tidak ditemukan"}
          subtitle={
            products.length === 0
              ? "Tambahkan barang lewat menu Stok terlebih dahulu"
              : "Coba kata kunci atau kategori lain"
          }
          action={
            products.length === 0 ? (
              <PrimaryButton
                testID="kasir-empty-add"
                label="Tambah Barang"
                icon="add"
                onPress={() => router.push("/product-form")}
              />
            ) : undefined
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg }}
          contentContainerStyle={{
            gap: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: tabBarH + (cartCount > 0 ? 96 : 24),
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ProductCard item={item} inCart={cart[item.id] || 0} onAdd={() => handleAdd(item)} />
          )}
        />
      )}

      {/* Sticky cart summary */}
      {cartCount > 0 ? (
        <BlurView
          intensity={colors.isDark ? 40 : 60}
          tint={colors.isDark ? "dark" : "light"}
          style={[
            styles.cartBar,
            {
              bottom: tabBarH + spacing.sm,
              backgroundColor: colors.isDark ? "rgba(20,16,13,0.6)" : "rgba(255,255,255,0.6)",
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable
            testID="kasir-cart-summary"
            onPress={() => router.push("/cart")}
            style={{ flex: 1 }}
          >
            <Text style={{ fontFamily: Font.medium, fontSize: 12, color: colors.onSurfaceTertiary }}>
              {cartCount} item · Ketuk untuk ubah
            </Text>
            <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface }}>
              {formatRupiah(cartTotal)}
            </Text>
          </Pressable>
          <PrimaryButton
            testID="kasir-bayar-button"
            label="Bayar"
            icon="arrow-forward"
            onPress={() => router.push("/checkout")}
            style={{ paddingHorizontal: spacing.xl }}
          />
        </BlurView>
      ) : null}
    </View>
  );
}

function ProductCard({
  item,
  inCart,
  onAdd,
}: {
  item: Product;
  inCart: number;
  onAdd: () => void;
}) {
  const { colors } = useTheme();
  const low = item.qty > 0 && item.qty < LOW_STOCK_THRESHOLD;
  const out = item.qty <= 0;

  return (
    <Pressable
      testID={`product-card-${item.id}`}
      onPress={onAdd}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: inCart > 0 ? colors.brand : colors.border,
          borderWidth: inCart > 0 ? 2 : 1,
          opacity: out ? 0.55 : 1,
        },
      ]}
    >
      {inCart > 0 ? (
        <View style={[styles.qtyBadge, { backgroundColor: colors.brand }]}>
          <Text style={{ fontFamily: Font.displayBold, fontSize: 13, color: colors.onBrandPrimary }}>
            {inCart}
          </Text>
        </View>
      ) : null}

      <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={{ fontFamily: Font.regular, fontSize: 11, color: colors.onSurfaceTertiary, marginTop: 2 }}>
        {item.category}
      </Text>

      <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface, marginTop: spacing.sm }}>
        {formatRupiah(item.sellPrice)}
      </Text>

      <View style={styles.cardFooter}>
        {out ? (
          <View style={[styles.stockPill, { backgroundColor: colors.error }]}>
            <Text style={[styles.stockText, { color: colors.onError }]}>Habis</Text>
          </View>
        ) : low ? (
          <View style={[styles.stockPill, { backgroundColor: colors.error }]}>
            <Ionicons name="warning" size={12} color={colors.onError} />
            <Text style={[styles.stockText, { color: colors.onError }]}>Sisa {item.qty}</Text>
          </View>
        ) : (
          <View style={[styles.stockPill, { backgroundColor: colors.surfaceTertiary }]}>
            <Text style={[styles.stockText, { color: colors.onSurfaceSecondary }]}>Stok {item.qty}</Text>
          </View>
        )}
        <View style={[styles.addBtn, { backgroundColor: out ? colors.surfaceTertiary : colors.brandTertiary }]}>
          <Ionicons name="add" size={20} color={out ? colors.onSurfaceTertiary : colors.brand} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontFamily: Font.medium, fontSize: 16, height: "100%" },
  card: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 150,
  },
  qtyBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    zIndex: 2,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "auto",
    paddingTop: spacing.sm,
  },
  stockPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 26,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  stockText: { fontFamily: Font.semibold, fontSize: 11 },
  addBtn: { width: 34, height: 34, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  cartBar: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    paddingLeft: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
});
