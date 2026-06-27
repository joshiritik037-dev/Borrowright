import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";
import { colors, fontSize, spacing } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (!user) router.replace("/welcome");
      else if (!user.onboarded) router.replace("/onboarding");
      else router.replace("/(tabs)");
    }, 900);
    return () => clearTimeout(t);
  }, [user, loading, router]);

  return (
    <View style={styles.container} testID="splash-screen">
      <View style={styles.logoWrap}>
        <View style={styles.logo}>
          <Ionicons name="shield-checkmark" size={44} color="#fff" />
        </View>
        <Text style={styles.brand}>Splendid Consultants</Text>
        <Text style={styles.product}>BorrowRight</Text>
        <Text style={styles.tagline}>Making Retail Finance Transparent, Fast & Affordable</Text>
      </View>
      <View style={styles.bottom}>
        <ActivityIndicator color={colors.brandPrimary} />
        <Text style={styles.trust}>Trusted by borrowers for ethical and transparent loan advisory.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A3B2A", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  logoWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: {
    width: 96, height: 96, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center", marginBottom: spacing.xl,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)"
  },
  brand: { color: "rgba(255,255,255,0.7)", fontSize: fontSize.sm, letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.sm },
  product: { color: "#fff", fontSize: 38, fontWeight: "800", letterSpacing: -0.5 },
  tagline: { color: "rgba(255,255,255,0.7)", fontSize: fontSize.md, textAlign: "center", marginTop: spacing.md, paddingHorizontal: spacing.xl },
  bottom: { alignItems: "center", gap: spacing.md, paddingBottom: spacing.xl },
  trust: { color: "rgba(255,255,255,0.6)", fontSize: fontSize.sm, textAlign: "center" },
});
