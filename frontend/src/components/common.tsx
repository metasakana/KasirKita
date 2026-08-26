import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";

// ---- Header (sticky, safe-area aware) ----
export function Header({
  title,
  subtitle,
  right,
  testID,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  testID?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      testID={testID}
      style={{
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
        paddingHorizontal: spacing.lg,
        backgroundColor: colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.divider,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          {subtitle ? (
            <Text style={{ fontFamily: Font.medium, fontSize: 13, color: colors.onSurfaceTertiary }}>
              {subtitle}
            </Text>
          ) : null}
          <Text style={{ fontFamily: Font.displayBold, fontSize: 26, color: colors.onSurface }}>
            {title}
          </Text>
        </View>
        {right}
      </View>
    </View>
  );
}

// ---- Primary button (min 56pt) ----
export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  style,
  variant = "brand",
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  variant?: "brand" | "solid" | "outline";
  testID?: string;
}) {
  const { colors } = useTheme();
  const isOutline = variant === "outline";
  const content = (
    <View style={styles.btnInner}>
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.brand : colors.onBrandPrimary} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={22}
              color={isOutline ? colors.onSurface : colors.onBrandPrimary}
            />
          ) : null}
          <Text
            style={[
              styles.btnLabel,
              { color: isOutline ? colors.onSurface : colors.onBrandPrimary },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  if (isOutline) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.btn,
          { borderWidth: 1.5, borderColor: colors.borderStrong, opacity: disabled ? 0.5 : 1 },
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={[{ opacity: disabled ? 0.5 : 1, borderRadius: radius.md }, style]}
    >
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btn}
      >
        {content}
      </LinearGradient>
    </Pressable>
  );
}

// ---- Empty state ----
export function EmptyState({
  icon = "cube-outline",
  title,
  subtitle,
  action,
  testID,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.brandTertiary }]}>
        <Ionicons name={icon} size={40} color={colors.brand} />
      </View>
      <Text style={{ fontFamily: Font.bold, fontSize: 18, color: colors.onSurface, marginTop: spacing.lg, textAlign: "center" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            fontFamily: Font.regular,
            fontSize: 14,
            color: colors.onSurfaceTertiary,
            marginTop: spacing.xs,
            textAlign: "center",
            maxWidth: 280,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: spacing.xl }}>{action}</View> : null}
    </View>
  );
}

// ---- Category chip row (horizontal, non-wrapping) ----
export function ChipRow({
  items,
  selected,
  onSelect,
}: {
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 56, justifyContent: "center" }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" }}
      >
        {items.map((it) => {
          const active = it === selected;
          return (
            <Pressable
              key={it}
              testID={`chip-${it}`}
              onPress={() => onSelect(it)}
              style={{
                flexShrink: 0,
                height: 36,
                paddingHorizontal: spacing.lg,
                borderRadius: radius.pill,
                justifyContent: "center",
                backgroundColor: active ? colors.brand : colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: active ? colors.brand : colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: Font.semibold,
                  fontSize: 13,
                  color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary,
                }}
              >
                {it}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  btnLabel: { fontFamily: Font.bold, fontSize: 17 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
