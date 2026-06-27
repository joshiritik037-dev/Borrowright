import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/lib/api";

export default function Otp() {
  const router = useRouter();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const { signInWithOtp } = useAuth();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(30);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    api.post("/auth/otp/request", { mobile }).catch(() => {});
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [mobile]);

  const set = (i: number, v: string) => {
    const c = v.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[i] = c;
    setCode(next);
    if (c && i < 5) refs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const full = code.join("");
    if (full.length !== 6) { setError("Enter the 6-digit code"); return; }
    setError(null);
    setLoading(true);
    try {
      await signInWithOtp(String(mobile), full);
    } catch (e: any) {
      setError(e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.scroll}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="otp-back-button">
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>

          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtitle}>We sent a 6-digit code to <Text style={{ color: colors.onSurface, fontWeight: "700" }}>{mobile}</Text></Text>

          <View style={styles.devHint}>
            <Ionicons name="information-circle" size={16} color={colors.brandPrimary} />
            <Text style={styles.devHintText}>Dev mode — any 6-digit code works (e.g., 123456)</Text>
          </View>

          <View style={styles.otpRow}>
            {code.map((c, i) => (
              <TextInput
                key={i}
                ref={(r) => { refs.current[i] = r; }}
                testID={`otp-input-${i}`}
                style={[styles.box, c ? styles.boxFilled : null]}
                keyboardType="number-pad"
                maxLength={1}
                value={c}
                onChangeText={(v) => set(i, v)}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === "Backspace" && !c && i > 0) refs.current[i - 1]?.focus();
                }}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={{ height: spacing.xl }} />
          <Button title="Verify & Continue" onPress={verify} loading={loading} testID="otp-verify-button" />

          <Pressable onPress={() => { if (resendIn === 0) { setResendIn(30); api.post("/auth/otp/request", { mobile }).catch(() => {}); } }} style={{ marginTop: spacing.xl }}>
            <Text style={styles.resend}>
              {resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.xl, flex: 1 },
  backBtn: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary, marginBottom: spacing.lg },
  title: { color: colors.onSurface, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { color: colors.onSurfaceSubtle, fontSize: fontSize.md, marginTop: spacing.sm, lineHeight: 22 },
  devHint: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radii.md },
  devHintText: { color: colors.brandPrimary, fontSize: fontSize.sm, fontWeight: "600", flex: 1 },
  otpRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xl, justifyContent: "space-between" },
  box: { width: 48, height: 60, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border, textAlign: "center", fontSize: 24, fontWeight: "700", color: colors.onSurface, backgroundColor: colors.surfaceSecondary },
  boxFilled: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.md, textAlign: "center" },
  resend: { color: colors.brandPrimary, fontSize: fontSize.md, fontWeight: "700", textAlign: "center" },
});
