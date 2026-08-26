import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState, Header, PrimaryButton } from "@/src/components/common";
import { useToast } from "@/src/components/Toast";
import { LOW_STOCK_THRESHOLD, Product, useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { formatRupiah } from "@/src/utils/format";
import { ChipRow } from "@/src/components/common";

export default function Stok() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { products, categories, restock } = useStore();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [restocking, setRestocking] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [restockNote, setRestockNote] = useState("");

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

  const lowCount = products.filter((p) => p.qty < LOW_STOCK_THRESHOLD).length;
  const tabBarH = (insets.bottom > 0 ? insets.bottom : spacing.md) + 56;

  const handleRestock = () => {
    if (!restocking) return;
    const q = parseInt(restockQty.replace(/[^0-9]/g, ""), 10) || 0;
    if (q <= 0) {
      toast.show("Masukkan jumlah stok masuk", "error");
      return;
    }
    restock(restocking.id, q, restockNote);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.show(`Stok ${restocking.name} bertambah +${q}`, "success");
    setRestocking(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Header
        title="Stok Barang"
        subtitle={`${products.length} barang · ${lowCount} stok menipis`}
        testID="stok-header"
        right={
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable
              testID="stok-history"
              onPress={() => router.push("/stock-history")}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.sm,
                backgroundColor: colors.surfaceSecondary,
              }}
            >
              <Ionicons name="time-outline" size={22} color={colors.brand} />
            </Pressable>
            <Pressable
              testID="stok-manage-categories"
              onPress={() => router.push("/categories")}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.sm,
                backgroundColor: colors.surfaceSecondary,
              }}
            >
              <Ionicons name="pricetags-outline" size={22} color={colors.brand} />
            </Pressable>
          </View>
        }
      />

      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <View style={[styles.search, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.onSurfaceTertiary} />
          <TextInput
            testID="stok-search-input"
            value={query}
            onChangeText={setQuery}
            placeholder="Cari barang untuk cek harga & stok..."
            placeholderTextColor={colors.onSurfaceTertiary}
            style={[styles.searchInput, { color: colors.onSurface }]}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color={colors.onSurfaceTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ChipRow items={FILTERS} selected={activeCategory} onSelect={setCategory} />

      {filtered.length === 0 ? (
        <EmptyState
          testID="stok-empty"
          icon="file-tray-outline"
          title={products.length === 0 ? "Rak masih kosong" : "Barang tidak ditemukan"}
          subtitle={
            products.length === 0
              ? "Mulai catat barang dagangan Anda"
              : "Coba kata kunci atau kategori lain"
          }
          action={
            products.length === 0 ? (
              <PrimaryButton
                testID="stok-empty-add"
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
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: tabBarH + 90,
            gap: spacing.sm,
          }}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <StockRow
              item={item}
              onPress={() => router.push({ pathname: "/product-form", params: { id: item.id } })}
              onRestock={() => {
                setRestockQty("");
                setRestockNote("");
                setRestocking(item);
              }}
            />
          )}
        />
      )}

      {/* FAB */}
      {products.length > 0 ? (
        <Pressable
          testID="stok-fab-add"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/product-form");
          }}
          style={[styles.fab, { bottom: tabBarH + spacing.md, backgroundColor: colors.brand }]}
        >
          <Ionicons name="add" size={30} color={colors.onBrandPrimary} />
        </Pressable>
      ) : null}

      {/* Modal stok masuk */}
      <Modal visible={!!restocking} transparent animationType="fade" onRequestClose={() => setRestocking(null)}>
        <Pressable style={styles.backdrop} onPress={() => setRestocking(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={{ fontFamily: Font.bold, fontSize: 18, color: colors.onSurface }}>Stok Masuk / Restok</Text>
            <Text style={{ fontFamily: Font.regular, fontSize: 14, color: colors.onSurfaceTertiary }}>
              {restocking?.name} · Stok saat ini{" "}
              <Text style={{ fontFamily: Font.bold, color: colors.onSurface }}>{restocking?.qty}</Text>
            </Text>
            <View style={[styles.sheetInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Ionicons name="add" size={20} color={colors.onSurfaceTertiary} />
              <TextInput
                testID="restock-qty-input"
                value={restockQty}
                onChangeText={(t) => setRestockQty(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                autoFocus
                placeholder="Jumlah masuk (pcs)"
                placeholderTextColor={colors.onSurfaceTertiary}
                style={{ flex: 1, fontFamily: Font.displayBold, fontSize: 18, color: colors.onSurface, height: "100%" }}
              />
            </View>
            <TextInput
              testID="restock-note-input"
              value={restockNote}
              onChangeText={setRestockNote}
              placeholder="Catatan, cth: kulakan Pasar Senin (opsional)"
              placeholderTextColor={colors.onSurfaceTertiary}
              style={[
                styles.sheetInput,
                {
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  color: colors.onSurface,
                  fontFamily: Font.medium,
                  fontSize: 15,
                  paddingHorizontal: spacing.lg,
                },
              ]}
            />
            {restockQty ? (
              <Text style={{ fontFamily: Font.semibold, fontSize: 13, color: colors.success }}>
                Stok baru: {(restocking?.qty ?? 0) + (parseInt(restockQty, 10) || 0)}
              </Text>
            ) : null}
            <PrimaryButton testID="restock-save" label="Simpan Stok Masuk" icon="checkmark" onPress={handleRestock} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function StockRow({ item, onPress, onRestock }: { item: Product; onPress: () => void; onRestock: () => void }) {
  const { colors } = useTheme();
  const low = item.qty < LOW_STOCK_THRESHOLD;
  const profit = item.sellPrice - item.costPrice;

  return (
    <Pressable
      testID={`stock-row-${item.id}`}
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: low ? colors.errorTint : colors.surfaceSecondary,
          borderColor: low ? colors.error : colors.border,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Font.semibold, fontSize: 15, color: colors.onSurface }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary, marginTop: 1 }}>
          {item.category}
        </Text>

        <View style={styles.priceLine}>
          <PriceTag label="Modal" value={formatRupiah(item.costPrice)} colors={colors} />
          <PriceTag label="Jual" value={formatRupiah(item.sellPrice)} colors={colors} strong />
          <PriceTag label="Untung" value={formatRupiah(profit)} colors={colors} success />
        </View>
      </View>

      <View style={styles.stockCol}>
        <Text
          style={{
            fontFamily: Font.displayBold,
            fontSize: 24,
            color: low ? colors.error : colors.onSurface,
          }}
        >
          {item.qty}
        </Text>
        <Text style={{ fontFamily: Font.medium, fontSize: 11, color: low ? colors.error : colors.onSurfaceTertiary }}>
          {low ? "menipis" : "stok"}
        </Text>
        <Pressable
          testID={`stock-restock-${item.id}`}
          onPress={onRestock}
          style={[styles.restockBtn, { backgroundColor: colors.brandTertiary }]}
        >
          <Ionicons name="add" size={14} color={colors.brand} />
          <Text style={{ fontFamily: Font.bold, fontSize: 11, color: colors.brand }}>Stok</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function PriceTag({ label, value, colors, strong, success }: any) {
  return (
    <View>
      <Text style={{ fontFamily: Font.regular, fontSize: 10, color: colors.onSurfaceTertiary }}>{label}</Text>
      <Text
        style={{
          fontFamily: strong || success ? Font.displayBold : Font.displayMedium,
          fontSize: 13,
          color: success ? colors.success : colors.onSurface,
        }}
      >
        {value}
      </Text>
    </View>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  priceLine: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  stockCol: { alignItems: "center", minWidth: 52 },
  restockBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  sheetInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
