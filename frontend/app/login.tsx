import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStore } from "@/src/store/StoreContext";
import { useTheme } from "@/src/theme/ThemeContext";
import { Font, radius, spacing } from "@/src/theme/themes";

const PIN_LEN = 6;
const HERO = "https://images.unsplash.com/photo-1617957718614-8c23f060c2d0?crop=entropy&cs=srgb&fm=jpg&q=85&w=800";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { pinSet, setPin, verifyPin, unlock } = useStore();

  // Setup flow: step 'create' -> 'confirm'. Enter flow: single 'enter'.
  const [stage, setStage] = useState<"create" | "confirm" | "enter">(pinSet ? "enter" : "create");
  const [firstPin, setFirstPin] = useState("");
  const [pin, setPinValue] = useState("");
  const [error, setError] = useState("");
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setStage(pinSet ? "enter" : "create");
  }, [pinSet]);

  const doShake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shake]);

  const handleComplete = useCallback(
    async (value: string) => {
      if (stage === "create") {
        setFirstPin(value);
        setPinValue("");
        setStage("confirm");
        setError("");
        return;
      }
      if (stage === "confirm") {
        if (value === firstPin) {
          await setPin(value);
          router.replace("/(tabs)");
        } else {
          setError("PIN tidak cocok, ulangi lagi");
          setFirstPin("");
          setPinValue("");
          setStage("create");
          doShake();
        }
        return;
      }
      // enter
      const ok = await verifyPin(value);
      if (ok) {
        unlock();
        router.replace("/(tabs)");
      } else {
        setError("PIN salah, coba lagi");
        setPinValue("");
        doShake();
      }
    },
    [stage, firstPin, setPin, verifyPin, unlock, router, doShake],
  );

  const press = useCallback(
    (d: string) => {
      Haptics.selectionAsync();
      setError("");
      setPinValue((prev) => {
        if (prev.length >= PIN_LEN) return prev;
        const next = prev + d;
        if (next.length === PIN_LEN) {
          setTimeout(() => handleComplete(next), 120);
        }
        return next;
      });
    },
    [handleComplete],
  );

  const backspace = useCallback(() => {
    Haptics.selectionAsync();
    setPinValue((prev) => prev.slice(0, -1));
  }, []);

  const title =
    stage === "create" ? "Buat PIN Baru" : stage === "confirm" ? "Ulangi PIN" : "Masukkan PIN";
  const subtitle =
    stage === "create"
      ? "Amankan aplikasi dengan 6 digit PIN"
      : stage === "confirm"
        ? "Ketik ulang PIN untuk konfirmasi"
        : "Selamat datang kembali 👋";

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]} testID="login-screen">
      <View style={styles.hero}>
        <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["transparent", colors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroContent, { paddingTop: insets.top + spacing.xl }]}>
          <View style={[styles.logo, { backgroundColor: "rgba(255,255,255,0.9)" }]}>
            <Ionicons name="storefront" size={30} color="#FF6B00" />
          </View>
          <Text style={styles.brandName}>Kasir Kita</Text>
          <Text style={styles.brandTag}>Kasir & Stok Toko Kelontong</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.onSurfaceTertiary }]}>{subtitle}</Text>

        <Animated.View style={[styles.dots, { transform: [{ translateX: shake }] }]}>
          {Array.from({ length: PIN_LEN }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  borderColor: error ? colors.error : colors.borderStrong,
                  backgroundColor:
                    i < pin.length ? (error ? colors.error : colors.brand) : "transparent",
                },
              ]}
            />
          ))}
        </Animated.View>

        {error ? (
          <Text testID="pin-error" style={[styles.error, { color: colors.error }]}>
            {error}
          </Text>
        ) : (
          <View style={{ height: 20 }} />
        )}

        <View style={styles.pad}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <Key key={d} label={d} onPress={() => press(d)} colors={colors} />
          ))}
          <View style={styles.key} />
          <Key label="0" onPress={() => press("0")} colors={colors} />
          <Pressable
            testID="pin-backspace"
            onPress={backspace}
            style={[styles.key]}
          >
            <Ionicons name="backspace-outline" size={28} color={colors.onSurface} />
          </Pressable>
        </View>
        <View style={{ height: insets.bottom + spacing.md }} />
      </View>
    </View>
  );
}

function Key({ label, onPress, colors }: { label: string; onPress: () => void; colors: any }) {
  return (
    <Pressable
      testID={`pin-key-${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        {
          backgroundColor: pressed ? colors.surfaceTertiary : colors.surfaceSecondary,
        },
      ]}
    >
      <Text style={[styles.keyText, { color: colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { height: "30%", minHeight: 200 },
  heroContent: { flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: spacing.md },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  brandName: { fontFamily: Font.displayBold, fontSize: 26, color: "#1A1412" },
  brandTag: { fontFamily: Font.medium, fontSize: 13, color: "#3D312B" },
  body: { flex: 1, paddingHorizontal: spacing.xl, alignItems: "center" },
  title: { fontFamily: Font.displayBold, fontSize: 24, marginTop: spacing.lg },
  subtitle: { fontFamily: Font.regular, fontSize: 14, marginTop: 2 },
  dots: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xl },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  error: { fontFamily: Font.semibold, fontSize: 13, marginTop: spacing.md, height: 20 },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    maxWidth: 300,
  },
  key: {
    width: 80,
    height: 72,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  keyText: { fontFamily: Font.displayMedium, fontSize: 28 },
});
