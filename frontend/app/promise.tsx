import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";
import { openWhatsApp } from "@/src/lib/links";

const DIFF_ICONS: Record<string, any> = { "check-circle": "checkmark-circle", "lightning-bolt": "flash", "user": "person", "shield-check": "shield-checkmark", "currency-rupee": "cash" };

export default function Promise() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();
  useEffect(() => { api.get("/promise").then(setData).catch(() => {}); }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} testID="promise-back"><Ionicons name="chevron-back" size={22} color={colors.onSurface} /></Pressable>
        </View>

        <ImageBackground source={{ uri: "https://images.unsplash.com/photo-1649861742672-20152f77c1f5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZ3JlZW4lMjBsdXh1cnklMjBhYnN0cmFjdCUyMGdyYWRpZW50JTIwdGV4dHVyZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgyNTc3MTExfDA&ixlib=rb-4.1.0&q=85" }} style={styles.hero} imageStyle={{ borderRadius: radii.lg }}>
          <LinearGradient colors={["rgba(10,59,42,0.45)", "rgba(10,59,42,0.95)"]} style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]} />
          <View style={styles.heroInner}>
            <View style={styles.badge}><Ionicons name="gift" size={12} color={colors.warning} /><Text style={styles.badgeText}>OUR PROMISE</Text></View>
            <Text style={styles.heroTitle}>Min. 15% Cash Refund</Text>
            <Text style={styles.heroSub}>If we save costs during your loan process, we return at least 15% of the total cost involved as a cash refund — making your borrowing rewarding.</Text>
          </View>
        </ImageBackground>

        <View style={{ padding: spacing.xl }}>
          <Text style={styles.sectionTitle}>The Problem</Text>
          <Text style={styles.sub}>India's borrowers face:</Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {data?.problems?.map((p: string, i: number) => (
              <View key={i} style={styles.problem}>
                <Ionicons name="close-circle" size={16} color={colors.error} />
                <Text style={styles.problemText}>{p}</Text>
              </View>
            ))}
          </View>
          <Card style={{ marginTop: spacing.lg, borderColor: colors.warning }}>
            <Text style={styles.compareLabel}>You may be paying</Text>
            <View style={styles.compareRow}>
              <View style={styles.compareCol}>
                <Text style={styles.compareBad}>{data?.cost_comparison?.market}</Text>
                <Text style={styles.compareSub}>Market cost</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.onSurfaceMuted} />
              <View style={styles.compareCol}>
                <Text style={styles.compareGood}>{data?.cost_comparison?.ours}</Text>
                <Text style={styles.compareSub}>With BorrowRight</Text>
              </View>
            </View>
          </Card>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>How We Solve It</Text>
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {data?.solutions?.map((p: string, i: number) => (
              <View key={i} style={styles.solution}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.solutionText}>{p}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Why Splendid Consultants</Text>
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {data?.differentiators?.map((d: any, i: number) => (
              <Card key={i}>
                <View style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
                  <View style={styles.diffIcon}><Ionicons name={(DIFF_ICONS[d.icon] || "checkmark")} size={20} color={colors.brandPrimary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.diffTitle}>{d.title}</Text>
                    <Text style={styles.diffDesc}>{d.desc}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </View>

          <View style={{ marginTop: spacing.xl }}>
            <Button title="Talk to Your RM on WhatsApp" variant="whatsapp" onPress={() => openWhatsApp()} icon={<Ionicons name="logo-whatsapp" size={18} color="#fff" />} testID="promise-whatsapp-button" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  back: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  hero: { marginHorizontal: spacing.xl, height: 220, borderRadius: radii.lg, overflow: "hidden" },
  heroInner: { flex: 1, padding: spacing.lg, justifyContent: "flex-end" },
  badge: { flexDirection: "row", alignSelf: "flex-start", gap: 6, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(212,175,55,0.20)", borderRadius: radii.pill, marginBottom: spacing.sm },
  badgeText: { color: colors.warning, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: "#fff", fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.3 },
  sub: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 4 },
  problem: { flexDirection: "row", gap: spacing.sm, alignItems: "center", padding: spacing.md, backgroundColor: "#FEF2F2", borderRadius: radii.md },
  problemText: { fontSize: fontSize.md, color: colors.onSurface, flex: 1 },
  solution: { flexDirection: "row", gap: spacing.sm, alignItems: "center", padding: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radii.md },
  solutionText: { fontSize: fontSize.md, color: colors.onSurface, flex: 1, fontWeight: "600" },
  compareLabel: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", textAlign: "center" },
  compareRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: spacing.md },
  compareCol: { alignItems: "center" },
  compareBad: { fontSize: 30, fontWeight: "800", color: colors.error, letterSpacing: -1 },
  compareGood: { fontSize: 30, fontWeight: "800", color: colors.success, letterSpacing: -1 },
  compareSub: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, marginTop: 2 },
  diffIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  diffTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface },
  diffDesc: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },
});
