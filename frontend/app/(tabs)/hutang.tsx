import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChipRow, EmptyState, Header, PrimaryButton } from "@/src/components/common";
import { useToast } from "@/src/components/Toast";
import { Debt, debtPaidSum, debtRemaining, useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";
import { formatDateTime, formatRupiah, parseRupiah } from "@/src/utils/format";

const FILTERS = ["Belum Lunas", "Lunas", "Semua"];

export default function Hutang() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { debts, payDebt } = useStore();
  const toast = useToast();

  const [filter, setFilter] = useState("Belum Lunas");
  const [paying, setPaying] = useState<Debt | null>(null);
  const [payStr, setPayStr] = useState("");

  const filtered = useMemo(() => {
    if (filter === "Belum Lunas") return debts.filter((d) => d.status === "belum");
    if (filter === "Lunas") return debts.filter((d) => d.status === "lunas");
    return debts;
  }, [debts, filter]);

  const outstanding = useMemo(
    () => debts.filter((d) => d.status === "belum").reduce((s, d) => s + debtRemaining(d), 0),
    [debts],
  );
  const openCount = debts.filter((d) => d.status === "belum").length;

  const tabBarH = (insets.bottom > 0 ? insets.bottom : spacing.md) + 56;

  const payAmount = parseRupiah(payStr);
  const payingRemaining = paying ? debtRemaining(paying) : 0;

  const handlePay = () => {
    if (!paying) return;
    if (payAmount <= 0) {
      toast.show("Masukkan jumlah pembayaran", "error");
      return;
    }
    if (payAmount > payingRemaining) {
      toast.show("Jumlah melebihi sisa hutang", "error");
      return;
    }
    payDebt(paying.id, payAmount);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.show(payAmount >= payingRemaining ? "Kasbon lunas 🎉" : "Pembayaran dicatat", "success");
    setPaying(null);
    setPayStr("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Header title="Kasbon" subtitle="Catatan hutang pelanggan" testID="hutang-header" />

      {/* Ringkasan */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <View style={[styles.summary, { backgroundColor: colors.brand }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: Font.medium, fontSize: 13, color: colors.onBrandPrimary, opacity: 0.9 }}>
              Total Hutang Berjalan
            </Text>
            <Text
              testID="hutang-outstanding"
              style={{ fontFamily: Font.displayBold, fontSize: 28, color: colors.onBrandPrimary }}
            >
              {formatRupiah(outstanding)}
            </Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontFamily: Font.displayBold, fontSize: 24, color: colors.onBrandPrimary }}>
              {openCount}
            </Text>
            <Text style={{ fontFamily: Font.medium, fontSize: 11, color: colors.onBrandPrimary, opacity: 0.9 }}>
              belum lunas
            </Text>
          </View>
        </View>
      </View>

      <ChipRow items={FILTERS} selected={filter} onSelect={setFilter} />

      {filtered.length === 0 ? (
        <EmptyState
          testID="hutang-empty"
          icon="wallet-outline"
          title={debts.length === 0 ? "Belum ada kasbon" : "Tidak ada catatan"}
          subtitle={
            debts.length === 0
              ? "Kasbon dibuat dari menu Kasir: saat pembayaran pilih metode Kasbon/Hutang"
              : "Coba pilih filter lain"
          }
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: tabBarH + 24,
            gap: spacing.sm,
          }}
          renderItem={({ item }) => (
            <DebtRow
              debt={item}
              colors={colors}
              onPay={() => {
                setPayStr("");
                setPaying(item);
              }}
            />
          )}
        />
      )}

      {/* Modal pembayaran */}
      <Modal visible={!!paying} transparent animationType="fade" onRequestClose={() => setPaying(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPaying(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={{ fontFamily: Font.bold, fontSize: 18, color: colors.onSurface }}>Terima Pembayaran</Text>
            <Text style={{ fontFamily: Font.regular, fontSize: 14, color: colors.onSurfaceTertiary }}>
              {paying?.customerName} · Sisa hutang{" "}
              <Text style={{ fontFamily: Font.bold, color: colors.error }}>{formatRupiah(payingRemaining)}</Text>
            </Text>
            <View style={[styles.payInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Text style={{ fontFamily: Font.displayBold, fontSize: 18, color: colors.onSurfaceTertiary }}>Rp</Text>
              <TextInput
                testID="hutang-pay-input"
                value={payAmount ? payAmount.toLocaleString("id-ID") : ""}
                onChangeText={(t) => setPayStr(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                autoFocus
                placeholder="0"
                placeholderTextColor={colors.onSurfaceTertiary}
                style={{ flex: 1, fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface, height: "100%" }}
              />
            </View>
            <Pressable
              testID="hutang-pay-full"
              onPress={() => setPayStr(String(payingRemaining))}
              style={[styles.fullChip, { backgroundColor: colors.brandTertiary }]}
            >
              <Text style={{ fontFamily: Font.semibold, fontSize: 13, color: colors.brand }}>
                Lunasi Semua ({formatRupiah(payingRemaining)})
              </Text>
            </Pressable>
            <PrimaryButton testID="hutang-pay-save" label="Simpan Pembayaran" icon="checkmark" onPress={handlePay} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DebtRow({ debt, colors, onPay }: { debt: Debt; colors: any; onPay: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const paid = debtPaidSum(debt);
  const remaining = debtRemaining(debt);
  const lunas = debt.status === "lunas";

  return (
    <View
      testID={`debt-row-${debt.id}`}
      style={[
        styles.row,
        {
          backgroundColor: lunas ? colors.surfaceSecondary : colors.errorTint,
          borderColor: lunas ? colors.border : colors.error,
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Font.bold, fontSize: 15, color: colors.onSurface }}>{debt.customerName}</Text>
          <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
            {debt.phone ? debt.phone + " · " : ""}
            {formatDateTime(debt.createdAt)}
          </Text>
          {debt.note ? (
            <Text
              style={{
                fontFamily: Font.regular,
                fontSize: 12,
                color: colors.onSurfaceSecondary,
                fontStyle: "italic",
                marginTop: 2,
              }}
            >
              &quot;{debt.note}&quot;
            </Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: lunas ? colors.success : colors.error }]}>
          <Text style={{ fontFamily: Font.bold, fontSize: 11, color: "#fff" }}>{lunas ? "LUNAS" : "BELUM"}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Font.regular, fontSize: 11, color: colors.onSurfaceTertiary }}>
            Terbayar {formatRupiah(paid)} dari {formatRupiah(debt.amount)}
          </Text>
          <Text
            style={{
              fontFamily: Font.displayBold,
              fontSize: 20,
              color: lunas ? colors.success : colors.error,
            }}
          >
            {lunas ? formatRupiah(debt.amount) : "Sisa " + formatRupiah(remaining)}
          </Text>
        </View>
        {!lunas ? (
          <Pressable testID={`debt-pay-${debt.id}`} onPress={onPay} style={[styles.payBtn, { backgroundColor: colors.brand }]}>
            <Ionicons name="cash-outline" size={16} color={colors.onBrandPrimary} />
            <Text style={{ fontFamily: Font.bold, fontSize: 14, color: colors.onBrandPrimary }}>Bayar</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Riwayat cicilan */}
      {debt.payments.length > 0 ? (
        <View style={{ marginTop: spacing.sm }}>
          <Pressable
            testID={`debt-history-toggle-${debt.id}`}
            onPress={() => setExpanded((e) => !e)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, minHeight: 32 }}
          >
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.brand} />
            <Text style={{ fontFamily: Font.semibold, fontSize: 12, color: colors.brand }}>
              Riwayat Cicilan ({debt.payments.length})
            </Text>
          </Pressable>
          {expanded ? (
            <View
              testID={`debt-history-list-${debt.id}`}
              style={{
                gap: 8,
                marginTop: 2,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
                paddingTop: spacing.sm,
              }}
            >
              {debt.payments.map((p, i) => (
                <View key={p.id} style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                  <Text style={{ flex: 1, fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceSecondary }}>
                    Cicilan {i + 1} · {formatDateTime(p.date)}
                  </Text>
                  <Text style={{ fontFamily: Font.bold, fontSize: 13, color: colors.success }}>
                    +{formatRupiah(p.amount)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  row: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  payInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    height: 56,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
  },
  fullChip: {
    alignSelf: "flex-start",
    height: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    justifyContent: "center",
  },
});
