import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";

export default function Index() {
  const { ready, pinSet, unlocked } = useStore();
  const { colors, ready: themeReady } = useTheme();

  if (!ready || !themeReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
        <ActivityIndicator size="large" color={colors.brand} />
      </View>
    );
  }

  if (!pinSet || !unlocked) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
