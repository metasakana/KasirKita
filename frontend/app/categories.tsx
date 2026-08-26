import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/src/components/common";
import { useToast } from "@/src/components/Toast";
import { useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";

export default function Categories() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { categories, products, addCategory, renameCategory, deleteCategory } = useStore();
  const toast = useToast();

  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const countFor = (c: string) => products.filter((p) => p.category === c).length;

  const handleAdd = () => {
    const n = newName.trim();
    if (!n) {
      toast.show("Nama kategori tidak boleh kosong", "error");
      return;
    }
    if (!addCategory(n)) {
      toast.show("Kategori sudah ada", "error");
      return;
    }
    setNewName("");
    toast.show("Kategori ditambahkan", "success");
  };

  const handleRename = () => {
    if (!editing) return;
    const n = editName.trim();
    if (!n) {
      toast.show("Nama kategori tidak boleh kosong", "error");
      return;
    }
    if (n === editing) {
      setEditing(null);
      return;
    }
    if (!renameCategory(editing, n)) {
      toast.show("Kategori sudah ada", "error");
      return;
    }
    setEditing(null);
    toast.show("Kategori diperbarui", "success");
  };

  const handleDelete = () => {
    if (!deleting) return;
    if (categories.length <= 1) {
      toast.show("Minimal harus ada 1 kategori", "error");
      setDeleting(null);
      return;
    }
    deleteCategory(deleting);
    setDeleting(null);
    toast.show("Kategori dihapus", "success");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.divider }]}>
        <Pressable testID="categories-close" onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="close" size={26} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontFamily: Font.displayBold, fontSize: 20, color: colors.onSurface }}>Kelola Kategori</Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Tambah kategori */}
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text style={{ fontFamily: Font.semibold, fontSize: 14, color: colors.onSurface }}>Tambah Kategori Baru</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <TextInput
            testID="categories-new-input"
            value={newName}
            onChangeText={setNewName}
            placeholder="cth: Bumbu Dapur"
            placeholderTextColor={colors.onSurfaceTertiary}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            style={[
              styles.input,
              { flex: 1, backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border },
            ]}
          />
          <Pressable testID="categories-add-btn" onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.brand }]}>
            <Ionicons name="add" size={26} color={colors.onBrandPrimary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + 40, gap: spacing.sm }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontFamily: Font.bold, fontSize: 13, color: colors.onSurfaceTertiary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.xs }}>
          Daftar Kategori ({categories.length})
        </Text>
        {categories.map((c) => (
          <View
            key={c}
            testID={`category-row-${c}`}
            style={[styles.row, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.brandTertiary }]}>
              <Ionicons name="pricetag" size={18} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Font.semibold, fontSize: 15, color: colors.onSurface }}>{c}</Text>
              <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
                {countFor(c)} barang
              </Text>
            </View>
            <Pressable
              testID={`category-edit-${c}`}
              onPress={() => {
                setEditName(c);
                setEditing(c);
              }}
              style={styles.actionBtn}
            >
              <Ionicons name="pencil" size={20} color={colors.brand} />
            </Pressable>
            <Pressable
              testID={`category-delete-${c}`}
              onPress={() => setDeleting(c)}
              style={styles.actionBtn}
              disabled={categories.length <= 1}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={categories.length <= 1 ? colors.onSurfaceTertiary : colors.error}
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* Modal edit */}
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={{ fontFamily: Font.bold, fontSize: 18, color: colors.onSurface }}>Ubah Nama Kategori</Text>
            <TextInput
              testID="category-edit-input"
              value={editName}
              onChangeText={setEditName}
              autoFocus
              placeholder="Nama kategori"
              placeholderTextColor={colors.onSurfaceTertiary}
              style={[
                styles.input,
                { backgroundColor: colors.surfaceSecondary, color: colors.onSurface, borderColor: colors.border },
              ]}
            />
            <Text style={{ fontFamily: Font.regular, fontSize: 12, color: colors.onSurfaceTertiary }}>
              Semua barang di kategori ini akan ikut berubah.
            </Text>
            <PrimaryButton testID="category-edit-save" label="Simpan" icon="checkmark" onPress={handleRename} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal hapus */}
      <Modal visible={!!deleting} transparent animationType="fade" onRequestClose={() => setDeleting(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDeleting(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => {}}>
            <Text style={{ fontFamily: Font.bold, fontSize: 18, color: colors.onSurface }}>
              Hapus Kategori &quot;{deleting}&quot;?
            </Text>
            <Text style={{ fontFamily: Font.regular, fontSize: 14, color: colors.onSurfaceTertiary, marginBottom: spacing.sm }}>
              {deleting && countFor(deleting) > 0
                ? `${countFor(deleting)} barang di kategori ini akan dipindah ke kategori lain.`
                : "Kategori ini tidak memiliki barang."}
            </Text>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <PrimaryButton label="Batal" variant="outline" onPress={() => setDeleting(null)} style={{ flex: 1 }} />
              <Pressable
                testID="category-delete-confirm"
                onPress={handleDelete}
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
  input: {
    height: 54,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontFamily: Font.medium,
    fontSize: 16,
    borderWidth: 1,
  },
  addBtn: { width: 54, height: 54, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  iconBox: { width: 38, height: 38, borderRadius: radius.sm, alignItems: "center", justifyContent: "center" },
  actionBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  dangerBtn: { flex: 1, minHeight: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
