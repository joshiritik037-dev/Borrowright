import React, { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Login() {
  const router = useRouter();
  const { startSession } = useAuth();
  
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    setError(null);
    if (!/^\d{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    
    setLoading(true);
    try {
      await startSession(name.trim() || "User", mobile);
      // Let root layout logic handle redirection directly to /(tabs)
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg === "Failed to fetch" || msg.includes("Network")) {
        setError("Cannot connect to server. Please make sure the backend is running (run-backend.bat).");
      } else {
        setError(e?.response?.data?.detail || msg || "Failed to start session");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="auth-back-button">
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>

          <Text style={styles.eyebrow}>Welcome to TrueBorrow</Text>
          <Text style={styles.title}>Let's get you started</Text>
          <Text style={styles.subtitle}>Enter your mobile number to log in. All your saved profile details and applications are linked to your mobile number.</Text>

          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.label}>Your Name (Optional)</Text>
            <View style={{ marginBottom: spacing.md }}>
              <Input
                testID="login-name-input"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChangeText={setName}
              />
            </View>

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
            <Button title="Continue" onPress={onContinue} loading={loading} testID="login-continue-button" />
          </View>

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
  mobileRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.md },
  cc: { height: 56, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  ccText: { fontSize: fontSize.lg, color: colors.onSurface, fontWeight: "700" },
  error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.md },
  terms: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, textAlign: "center", marginTop: spacing.xl, lineHeight: 20 },
  link: { color: colors.brandPrimary, fontWeight: "600" },
});
