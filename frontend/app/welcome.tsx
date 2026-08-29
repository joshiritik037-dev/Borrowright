import React from "react";
import { View, Text, StyleSheet, ScrollView, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";

const FEATURES = [
  { icon: "shield-checkmark-outline", title: "Transparent Advisory", desc: "Zero cash policy" },
  { icon: "trending-down-outline", title: "Lower Loan Cost", desc: "Up to 1.25% savings" },
  { icon: "flash-outline", title: "Faster Processing", desc: "10 day disbursal" },
  { icon: "person-outline", title: "Dedicated RM", desc: "One expert. End-to-end." },
];

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: "#0A3B2A" }}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1649861742672-20152f77c1f5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZ3JlZW4lMjBsdXh1cnklMjBhYnN0cmFjdCUyMGdyYWRpZW50JTIwdGV4dHVyZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgyNTc3MTExfDA&ixlib=rb-4.1.0&q=85" }}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <LinearGradient colors={["rgba(10,59,42,0.20)", "rgba(10,59,42,0.92)", "#0A3B2A"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.brandRow}>
              <View style={styles.brandPill}>
                <Ionicons name="shield-checkmark" size={14} color={colors.warning} />
                <Text style={styles.brandPillText}>Splendid Consultants</Text>
              </View>
            </View>

            <View style={{ marginTop: spacing.xxxl }}>
              <Text style={styles.heroEyebrow}>India's Transparent Loan Platform</Text>
              <Text style={styles.heroTitle}>Get the Right Loan.</Text>
              <Text style={styles.heroTitleAccent}>Pay Less. Save More.</Text>
              <Text style={styles.heroSub}>Apply with complete transparency, faster approvals, and expert guidance — without brokers.</Text>
            </View>

            <View style={styles.grid}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.feature} testID={`welcome-feature-${i}`}>
                  <View style={styles.featIconBox}>
                    <Ionicons name={f.icon as any} size={20} color={colors.warning} />
                  </View>
                  <Text style={styles.featTitle}>{f.title}</Text>
                  <Text style={styles.featDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>

            <View style={styles.refundBanner}>
              <Ionicons name="gift" size={18} color={colors.warning} />
              <Text style={styles.refundText}>Minimum <Text style={{ color: colors.warning, fontWeight: "800" }}>15% Cash Refund</Text> on processing fees</Text>
            </View>
          </ScrollView>

          <View style={styles.ctaWrap}>
            <Button title="Get Started" testID="welcome-get-started-button" onPress={() => router.push("/auth/login")} />
            <View style={{ height: spacing.md }} />
            <Button title="I already have an account" variant="ghost" testID="welcome-login-button" onPress={() => router.push("/auth/login")} textStyle={{ color: "#fff" }} />
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: 0, flexGrow: 1 },
  brandRow: { alignItems: "flex-start" },
  brandPill: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: radii.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  brandPillText: { color: "#fff", fontSize: fontSize.xs, fontWeight: "700", letterSpacing: 0.5 },
  heroEyebrow: { color: colors.warning, fontSize: fontSize.sm, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 40, fontWeight: "800", letterSpacing: -1, marginTop: spacing.md, lineHeight: 46 },
  heroTitleAccent: { color: colors.warning, fontSize: 40, fontWeight: "800", letterSpacing: -1, lineHeight: 46 },
  heroSub: { color: "rgba(255,255,255,0.75)", fontSize: fontSize.lg, marginTop: spacing.lg, lineHeight: 24 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.xxl },
  feature: { width: "47.5%", padding: spacing.lg, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: radii.lg, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  featIconBox: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: "rgba(212,175,55,0.12)", alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  featTitle: { color: "#fff", fontSize: fontSize.lg, fontWeight: "700" },
  featDesc: { color: "rgba(255,255,255,0.65)", fontSize: fontSize.sm, marginTop: 4 },
  refundBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.md, backgroundColor: "rgba(212,175,55,0.08)", borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(212,175,55,0.25)" },
  refundText: { color: "#fff", fontSize: fontSize.md, flex: 1 },
  ctaWrap: { padding: spacing.xl, paddingTop: spacing.md },
});
