import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { startGoogleAuth } from "@/src/lib/links";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Login() {
  const router = useRouter();
  const { signInWithGoogleSession } = useAuth();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Web cold-start: parse session_id or access_token
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;
    const params = window.location.hash || window.location.search;
    
    // Check for access_token first (direct Google OAuth2)
    const tokMatch = params.match(/[#?&]access_token=([^&]+)/);
    if (tokMatch && tokMatch[1]) {
      const token = decodeURIComponent(tokMatch[1]);
      window.history.replaceState(null, "", window.location.pathname);
      (async () => {
        try {
          await signInWithGoogleSession(token);
        } catch (e: any) {
          setError(e?.message || "Google sign-in failed");
        }
      })();
      return;
    }

    // Check for session_id (legacy/emergent flow)
    const m = params.match(/[#?&]session_id=([^&]+)/);
    if (m && m[1]) {
      const sid = decodeURIComponent(m[1]);
      window.history.replaceState(null, "", window.location.pathname);
      (async () => {
        try { await signInWithGoogleSession(sid); } catch (e: any) { setError(e?.message || "Google sign-in failed"); }
      })();
    }
  }, [signInWithGoogleSession]);

  const onContinue = () => {
    setError(null);
    if (!/^\d{10}$/.test(mobile)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    router.push({ pathname: "/auth/otp", params: { mobile: `+91${mobile}` } });
  };

  const onGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const sid = await startGoogleAuth();
      if (sid) await signInWithGoogleSession(sid);
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="auth-back-button">
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>

          <Text style={styles.eyebrow}>Welcome to BorrowRight</Text>
          <Text style={styles.title}>Let's get you started</Text>
          <Text style={styles.subtitle}>We'll send a 6-digit code to verify your number.</Text>

          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.mobileRow}>
              <View style={styles.cc}><Text style={styles.ccText}>+91</Text></View>
              <View style={{ flex: 1 }}>
                <Input
                  testID="login-mobile-input"
                  placeholder="98765 43210"
                  keyboardType="number-pad"
                  value={mobile}
                  onChangeText={(t) => setMobile(t.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                />
              </View>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Continue" onPress={onContinue} testID="login-continue-button" />
          </View>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>or continue with</Text>
            <View style={styles.line} />
          </View>

          <Button
            title="Continue with Google"
            variant="outline"
            loading={googleLoading}
            onPress={onGoogle}
            testID="login-google-button"
            icon={<Ionicons name="logo-google" size={18} color={colors.brandPrimary} />}
          />

          <Text style={styles.terms}>
            By continuing, you agree to our <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  backBtn: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary, marginBottom: spacing.lg },
  eyebrow: { color: colors.brandPrimary, fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
  title: { color: colors.onSurface, fontSize: 30, fontWeight: "800", letterSpacing: -0.5, marginTop: spacing.sm },
  subtitle: { color: colors.onSurfaceSubtle, fontSize: fontSize.md, marginTop: spacing.sm, lineHeight: 22 },
  label: { fontSize: fontSize.sm, color: colors.onSurfaceSubtle, marginBottom: spacing.sm, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  mobileRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  cc: { height: 56, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  ccText: { fontSize: fontSize.lg, color: colors.onSurface, fontWeight: "700" },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.xl, gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { fontSize: fontSize.sm, color: colors.onSurfaceMuted },
  terms: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, textAlign: "center", marginTop: spacing.xl, lineHeight: 20 },
  link: { color: colors.brandPrimary, fontWeight: "600" },
});
