import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState, Header, PrimaryButton } from "@/src/components/common";
import { useToast } from "@/src/components/Toast";
import { Transaction, useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { exportCSV } from "@/src/utils/csv";
import { formatDateTime, formatNumber, formatRupiah } from "@/src/utils/format";

type Period = "harian" | "mingguan" | "bulanan";
const PERIODS: { key: Period; label: string }[] = [
  { key: "harian", label: "Harian" },
  { key: "mingguan", label: "Mingguan" },
  { key: "bulanan", label: "Bulanan" },
];

function startOf(period: Period): number {
  const now = new Date();
  if (period === "harian") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }
  if (period === "mingguan") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    d.setDate(d.getDate() - 6);
    return d.getTime();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export default function Laporan() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { transactions, storeName } = useStore();
  const toast = useToast();

  const [period, setPeriod] = useState<Period>("harian");

  const inRange = useMemo(() => {
    const from = startOf(period);
    return transactions.filter((t) => new Date(t.createdAt).getTime() >= from);
  }, [transactions, period]);

  const totals = useMemo(() => {
    return inRange.reduce(
      (acc, t) => {
        acc.gross += t.subtotal;
        acc.cost += t.totalCost;
        acc.profit += t.profit;
        return acc;
      },
      { gross: 0, cost: 0, profit: 0 },
    );
  }, [inRange]);

  const tabBarH = (insets.bottom > 0 ? insets.bottom : spacing.md) + 56;

  const handleExport = async () => {
    if (inRange.length === 0) {
      toast.show("Belum ada transaksi untuk diekspor", "error");
      return;
    }
    const rows: (string | number)[][] = [
      [`Laporan Penjualan ${storeName} - ${period}`],
      ["No Transaksi", "Tanggal", "Jumlah Item", "Total Jual", "Total Modal", "Keuntungan", "Tunai", "Kembalian"],
    ];
    inRange.forEach((t) => {
      const items = t.items.reduce((a, b) => a + b.qty, 0);
      rows.push([
        t.id.toUpperCase(),
        formatDateTime(t.createdAt),
        items,
        t.subtotal,
        t.totalCost,
        t.profit,
        t.paid,
        t.change,
      ]);
    });
    rows.push([]);
    rows.push(["", "", "TOTAL", totals.gross, totals.cost, totals.profit]);
    try {
      await exportCSV(`laporan-${period}.csv`, rows);
    } catch {
      toast.show("Gagal mengekspor CSV", "error");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Header title="Laporan" subtitle="Ringkasan penjualan & laba" testID="laporan-header" />

      {/* Period segmented */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <View style={[styles.segment, { backgroundColor: colors.surfaceSecondary }]}>
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <Text
                key={p.key}
                testID={`period-${p.key}`}
                onPress={() => setPeriod(p.key)}
                style={[
                  styles.segmentItem,
                  {
                    color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary,
                    backgroundColor: active ? colors.brand : "transparent",
                  },
                ]}
              >
                {p.label}
              </Text>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: tabBarH + 90, gap: spacing.md }}
      >
        {/* Metric cards */}
        <View style={[styles.heroCard, { backgroundColor: colors.brand }]}>
          <Text style={{ fontFamily: Font.medium, fontSize: 13, color: colors.onBrandPrimary, opacity: 0.9 }}>
            Keuntungan Bersih (Laba)
          </Text>
          <Text style={{ fontFamily: Font.displayBold, fontSize: 36, color: colors.onBrandPrimary, marginTop: 2 }}>
            {formatRupiah(totals.profit)}
          </Text>
          <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onBrandPrimary, opacity: 0.85, marginTop: 4 }}>
            dari {inRange.length} transaksi
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <MetricCard label="Pendapatan Kotor" value={formatRupiah(totals.gross)} icon="cash-outline" colors={colors} />
          <MetricCard label="Total Modal (HPP)" value={formatRupiah(totals.cost)} icon="pricetag-outline" colors={colors} />
        </View>

        {/* Transactions */}
        <Text style={{ fontFamily: Font.bold, fontSize: 16, color: colors.onSurface, marginTop: spacing.sm }}>
          Riwayat Transaksi
        </Text>

        {inRange.length === 0 ? (
          <View style={{ paddingVertical: spacing["2xl"] }}>
            <EmptyState
              testID="laporan-empty"
              icon="receipt-outline"
              title="Belum ada penjualan"
              subtitle="Transaksi akan muncul di sini setelah Anda melakukan penjualan di menu Kasir"
            />
          </View>
        ) : (
          inRange.map((t) => <TxRow key={t.id} tx={t} colors={colors} />)
        )}
      </ScrollView>

      {/* Export */}
      <View
        style={{
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          bottom: tabBarH + spacing.sm,
        }}
      >
        <PrimaryButton
          testID="laporan-export-csv"
          label="Ekspor ke CSV / Excel"
          icon="download-outline"
          onPress={handleExport}
          variant="brand"
        />
      </View>
    </View>
  );
}

function MetricCard({ label, value, icon, colors }: any) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <Ionicons name={icon} size={20} color={colors.onSurfaceTertiary} />
      <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary, marginTop: spacing.xs }}>
        {label}
      </Text>
      <Text style={{ fontFamily: Font.displayBold, fontSize: 18, color: colors.onSurface, marginTop: 2 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function TxRow({ tx, colors }: { tx: Transaction; colors: any }) {
  const items = tx.items.reduce((a, b) => a + b.qty, 0);
  return (
    <View style={[styles.txRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={[styles.txIcon, { backgroundColor: colors.brandTertiary }]}>
        <Ionicons name="receipt" size={18} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>
          {formatNumber(items)} item · {formatRupiah(tx.subtotal)}
        </Text>
        <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
          {formatDateTime(tx.createdAt)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontFamily: Font.regular, fontSize: 10, color: colors.onSurfaceTertiary }}>Laba</Text>
        <Text style={{ fontFamily: Font.displayBold, fontSize: 15, color: colors.success }}>
          +{formatRupiah(tx.profit)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: "row", borderRadius: radius.md, padding: 4, gap: 4 },
  segmentItem: {
    flex: 1,
    textAlign: "center",
    fontFamily: Font.semibold,
    fontSize: 14,
    paddingVertical: 10,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  heroCard: { borderRadius: radius.lg, padding: spacing.xl },
  metric: { flex: 1, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  txIcon: { width: 40, height: 40, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
});
