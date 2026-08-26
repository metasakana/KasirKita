import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/src/theme/ThemeContext";
import { Font, spacing } from "@/src/theme/themes";

type TabDef = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabDef[] = [
  { name: "index", label: "Kasir", icon: "calculator-outline", iconActive: "calculator" },
  { name: "stok", label: "Stok", icon: "cube-outline", iconActive: "cube" },
  { name: "laporan", label: "Laporan", icon: "bar-chart-outline", iconActive: "bar-chart" },
  { name: "pengaturan", label: "Atur", icon: "settings-outline", iconActive: "settings" },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} />
      ))}
    </Tabs>
  );
}

function CustomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <BlurView
        intensity={colors.isDark ? 40 : 60}
        tint={colors.isDark ? "dark" : "light"}
        style={[
          styles.bar,
          {
            paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
            borderTopColor: colors.divider,
            backgroundColor: colors.isDark
              ? "rgba(20,16,13,0.75)"
              : "rgba(255,255,255,0.8)",
          },
        ]}
      >
        {state.routes
          .filter((r: any) => TABS.some((t) => t.name === r.name))
          .map((route: any) => {
            const def = TABS.find((t) => t.name === route.name)!;
            const routeIndex = state.routes.findIndex((r: any) => r.key === route.key);
            const focused = state.index === routeIndex;

            const onPress = () => {
              Haptics.selectionAsync();
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                testID={`tab-${def.label.toLowerCase()}`}
                onPress={onPress}
                style={styles.item}
              >
                <Ionicons
                  name={focused ? def.iconActive : def.icon}
                  size={24}
                  color={focused ? colors.brand : colors.onSurfaceTertiary}
                />
                <Text
                  style={[
                    styles.label,
                    { color: focused ? colors.brand : colors.onSurfaceTertiary },
                  ]}
                >
                  {def.label}
                </Text>
              </Pressable>
            );
          })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0 },
  bar: {
    flexDirection: "row",
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 2 },
  label: { fontFamily: Font.semibold, fontSize: 11 },
});
