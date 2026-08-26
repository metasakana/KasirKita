import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/common";
import { useToast } from "@/src/components/Toast";
import { useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { formatDateTime, formatRupiah } from "@/src/utils/format";
import { printReceipt, shareReceipt } from "@/src/utils/receipt";

export default function Receipt() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, storeName } = useStore();
  const toast = useToast();

  const tx = transactions.find((t) => t.id === id);

  const done = () => router.replace("/(tabs)");

  if (!tx) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: Font.semibold, color: colors.onSurface }}>Struk tidak ditemukan</Text>
        <View style={{ height: spacing.lg }} />
        <PrimaryButton label="Kembali" onPress={done} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceSecondary }}>
      <View style={{ paddingTop: insets.top + spacing.lg, alignItems: "center" }}>
        <View style={[styles.successBadge, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
        <Text style={{ fontFamily: Font.displayBold, fontSize: 22, color: colors.onSurface, marginTop: spacing.md }}>
          Transaksi Berhasil
        </Text>
        <Text style={{ fontFamily: Font.medium, fontSize: 14, color: colors.onSurfaceTertiary }}>
          Kembalian {formatRupiah(tx.change)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={[styles.receipt, { backgroundColor: colors.surface }]} testID="receipt-card">
          <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface, textAlign: "center" }}>
            {storeName}
          </Text>
          <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary, textAlign: "center", marginTop: 2 }}>
            {formatDateTime(tx.createdAt)}
          </Text>
          <Text style={{ fontFamily: Font.regular, fontSize: 11, color: colors.onSurfaceTertiary, textAlign: "center" }}>
            No: {tx.id.toUpperCase()}
          </Text>

          <View style={[styles.dashed, { borderColor: colors.borderStrong }]} />

          {tx.items.map((it) => (
            <View key={it.productId} style={styles.line}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>{it.name}</Text>
                <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
                  {it.qty} x {formatRupiah(it.sellPrice)}
                </Text>
              </View>
              <Text style={{ fontFamily: Font.displayMedium, fontSize: 14, color: colors.onSurface }}>
                {formatRupiah(it.sellPrice * it.qty)}
              </Text>
            </View>
          ))}

          <View style={[styles.dashed, { borderColor: colors.borderStrong }]} />

          <Row label="Total" value={formatRupiah(tx.subtotal)} colors={colors} bold />
          <Row label="Tunai" value={formatRupiah(tx.paid)} colors={colors} />
          <Row label="Kembalian" value={formatRupiah(tx.change)} colors={colors} />

          <View style={[styles.dashed, { borderColor: colors.borderStrong }]} />
          <Text style={{ textAlign: "center", fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
            Terima kasih telah berbelanja 🙏
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.lg }}>
          <PrimaryButton
            testID="receipt-print"
            label="Cetak"
            icon="print-outline"
            variant="outline"
            style={{ flex: 1 }}
            onPress={async () => {
              try {
                await printReceipt(tx, storeName);
              } catch {
                toast.show("Gagal membuka pencetak", "error");
              }
            }}
          />
          <PrimaryButton
            testID="receipt-share"
            label="Bagikan"
            icon="share-social-outline"
            style={{ flex: 1 }}
            onPress={async () => {
              try {
                await shareReceipt(tx, storeName);
              } catch {
                toast.show("Gagal membagikan struk", "error");
              }
            }}
          />
        </View>
      </ScrollView>

      <View style={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.md }}>
        <PrimaryButton testID="receipt-done" label="Selesai" icon="checkmark" onPress={done} />
      </View>
    </View>
  );
}

function Row({ label, value, colors, bold }: any) {
  return (
    <View style={styles.totalRow}>
      <Text style={{ fontFamily: bold ? Font.bold : Font.regular, fontSize: bold ? 16 : 14, color: colors.onSurface }}>
        {label}
      </Text>
      <Text style={{ fontFamily: bold ? Font.displayBold : Font.displayMedium, fontSize: bold ? 18 : 14, color: colors.onSurface }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  successBadge: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  receipt: { borderRadius: radius.md, padding: spacing.xl },
  dashed: { borderTopWidth: 1, borderStyle: "dashed", marginVertical: spacing.md },
  line: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 5 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 },
});
