import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/src/components/common";
import { StockEntry, useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { formatDateTime, formatNumber } from "@/src/utils/format";

export default function StockHistory() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { stockEntries } = useStore();

  const totalIn = stockEntries.reduce((s, e) => s + e.qty, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.divider }]}>
        <Pressable testID="stock-history-close" onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface }}>Stok Masuk</Text>
          <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
            {stockEntries.length} catatan · total {formatNumber(totalIn)} pcs
          </Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {stockEntries.length === 0 ? (
        <EmptyState
          testID="stock-history-empty"
          icon="archive-outline"
          title="Belum ada catatan stok masuk"
          subtitle='Tambah stok dari halaman Stok dengan tombol "+ Stok" pada barang'
        />
      ) : (
        <FlatList
          data={stockEntries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 40, gap: spacing.sm }}
          renderItem={({ item }) => <EntryRow entry={item} colors={colors} />}
        />
      )}
    </View>
  );
}

function EntryRow({ entry, colors }: { entry: StockEntry; colors: any }) {
  return (
    <View
      testID={`stock-entry-${entry.id}`}
      style={[styles.row, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.brandTertiary }]}>
        <Ionicons name="arrow-down-circle" size={20} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Font.semibold, fontSize: 15, color: colors.onSurface }} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
          {formatDateTime(entry.createdAt)}
        </Text>
        {entry.note ? (
          <Text
            style={{
              fontFamily: Font.regular,
              fontSize: 12,
              color: colors.onSurfaceSecondary,
              fontStyle: "italic",
              marginTop: 2,
            }}
          >
            &quot;{entry.note}&quot;
          </Text>
        ) : null}
      </View>
      <Text style={{ fontFamily: Font.displayBold, fontSize: 18, color: colors.success }}>
        +{formatNumber(entry.qty)}
      </Text>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  iconBox: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
});
