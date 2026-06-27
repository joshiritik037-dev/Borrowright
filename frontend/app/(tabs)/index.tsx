import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Card } from "@/src/components/Card";
import { colors, fontSize, radii, spacing, shadow } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/lib/api";
import { openWhatsApp, openTel } from "@/src/lib/links";
import { inrShort } from "@/src/lib/finance";

type Application = {
  application_id: string;
  loan_type: string;
  loan_amount?: number;
  status: string;
  stage: string;
  rm?: { name?: string; phone?: string; whatsapp?: string; photo?: string; title?: string };
};

const QUICK = [
  { id: "apply", label: "Apply Loan", icon: "add-circle", route: "/apply/select-type" },
  { id: "emi", label: "EMI Calc", icon: "calculator", route: "/emi-calculator" },
  { id: "compare", label: "Compare Banks", icon: "git-compare", route: "/bank-compare" },
  { id: "refer", label: "Refer & Earn", icon: "gift", route: "/refer" },
];

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    api.get<Application[]>("/applications").then(setApps).catch(() => {});
  }, []);

  const active = apps[0];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greet}>Hello, {user?.name?.split(" ")[0] || "there"} 👋</Text>
            <Text style={styles.subgreet}>What can we help you finance today?</Text>
          </View>
          <Pressable style={styles.iconBtn} onPress={() => router.push("/(tabs)/profile")} testID="home-profile-button">
            <Ionicons name="person-circle" size={36} color={colors.brandPrimary} />
          </Pressable>
        </View>

        {/* 15% Cash Refund Hero */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1649861742672-20152f77c1f5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZ3JlZW4lMjBsdXh1cnklMjBhYnN0cmFjdCUyMGdyYWRpZW50JTIwdGV4dHVyZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgyNTc3MTExfDA&ixlib=rb-4.1.0&q=85" }}
            imageStyle={{ borderRadius: radii.lg }}
            style={styles.hero}
          >
            <LinearGradient colors={["rgba(10,59,42,0.55)", "rgba(10,59,42,0.95)"]} style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]} />
            <View style={styles.heroInner}>
              <View style={styles.heroBadge}>
                <Ionicons name="gift" size={12} color={colors.warning} />
                <Text style={styles.heroBadgeText}>EXCLUSIVE OFFER</Text>
              </View>
              <Text style={styles.heroTitle}>Min. 15% Cash Refund</Text>
              <Text style={styles.heroSub}>We share at least 15% of your loan cost savings back with you.</Text>
              <Pressable testID="home-promise-cta" onPress={() => router.push("/promise")} style={styles.heroCta}>
                <Text style={styles.heroCtaText}>How it works</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brandPrimary} />
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        {/* Quick actions */}
        <View style={styles.quickWrap}>
          {QUICK.map((q) => (
            <Pressable key={q.id} testID={`home-quick-${q.id}`} style={styles.quickItem} onPress={() => router.push(q.route as any)}>
              <View style={styles.quickIcon}><Ionicons name={q.icon as any} size={22} color={colors.brandPrimary} /></View>
              <Text style={styles.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Active application tracker */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <Text style={styles.sectionTitle}>Track Application</Text>
          {active ? (
            <Pressable testID="home-active-app" onPress={() => router.push("/(tabs)/status")}>
              <Card>
                <View style={styles.appRow}>
                  <View style={styles.appBadge}><Ionicons name="document-text" size={18} color={colors.brandPrimary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.appType}>{active.loan_type.replace("_", " ").toUpperCase()} LOAN</Text>
                    <Text style={styles.appAmount}>{active.loan_amount ? inrShort(active.loan_amount) : "Draft"}</Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>{active.stage.replace("_", " ")}</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${((stageIndex(active.stage) + 1) / 8) * 100}%` }]} />
                </View>
                <Text style={styles.trackHint}>Step {stageIndex(active.stage) + 1} of 8 · Tap to view details</Text>
              </Card>
            </Pressable>
          ) : (
            <Card>
              <Text style={styles.emptyTitle}>No active application yet</Text>
              <Text style={styles.emptyText}>Start your loan in under 3 minutes. Compare banks, pay less.</Text>
              <Pressable testID="home-start-apply" style={styles.applyBtn} onPress={() => router.push("/apply/select-type")}>
                <Text style={styles.applyBtnText}>Apply Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </Pressable>
            </Card>
          )}
        </View>

        {/* RM card */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>Your Relationship Manager</Text>
          <Card>
            <View style={styles.rmRow}>
              <Image source={{ uri: active?.rm?.photo || "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwcHJvZmVzc2lvbmFsJTIwYnVzaW5lc3MlMjB3b21hbiUyMGhlYWRzaG90JTIwc21pbGluZyUyMGNsZWFyJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODI1NzcxMTF8MA&ixlib=rb-4.1.0&q=85" }} style={styles.rmAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rmName}>{active?.rm?.name || "Priya Sharma"}</Text>
                <Text style={styles.rmTitle}>{active?.rm?.title || "Senior Relationship Manager"}</Text>
                <View style={styles.rmBadges}>
                  <View style={styles.rmBadge}><Ionicons name="star" size={11} color={colors.warning} /><Text style={styles.rmBadgeText}>4.9</Text></View>
                  <View style={styles.rmBadge}><Ionicons name="time" size={11} color={colors.brandPrimary} /><Text style={styles.rmBadgeText}>8+ yrs</Text></View>
                </View>
              </View>
            </View>
            <View style={styles.rmActions}>
              <Pressable testID="rm-call-button" style={[styles.rmAction, { backgroundColor: colors.brandPrimary }]} onPress={() => openTel(active?.rm?.phone || "+919826739349")}>
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={[styles.rmActionText, { color: "#fff" }]}>Call</Text>
              </Pressable>
              <Pressable testID="rm-whatsapp-button" style={[styles.rmAction, { backgroundColor: colors.whatsapp }]} onPress={() => openWhatsApp()}>
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                <Text style={[styles.rmActionText, { color: "#fff" }]}>WhatsApp</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function stageIndex(stage: string) {
  const order = ["submitted","documents_received","bank_login","legal_verification","valuation","approval","sanction_letter","disbursement"];
  return Math.max(0, order.indexOf(stage));
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  greet: { color: colors.onSurface, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  subgreet: { color: colors.onSurfaceMuted, fontSize: fontSize.sm, marginTop: 2 },
  iconBtn: { padding: 2 },

  hero: { height: 170, borderRadius: radii.lg, overflow: "hidden" },
  heroInner: { flex: 1, padding: spacing.lg, justifyContent: "flex-end" },
  heroBadge: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(212,175,55,0.20)", borderRadius: radii.pill, marginBottom: spacing.sm },
  heroBadgeText: { color: colors.warning, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: fontSize.sm, marginTop: 4 },
  heroCta: { alignSelf: "flex-start", marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 8, backgroundColor: "#fff", borderRadius: radii.pill, flexDirection: "row", alignItems: "center", gap: 6 },
  heroCtaText: { color: colors.brandPrimary, fontWeight: "700", fontSize: fontSize.sm },

  quickWrap: { flexDirection: "row", paddingHorizontal: spacing.xl, marginTop: spacing.xl, gap: spacing.md },
  quickItem: { flex: 1, alignItems: "center", padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  quickIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  quickLabel: { fontSize: fontSize.xs, color: colors.onSurface, fontWeight: "700", textAlign: "center" },

  sectionTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface, marginBottom: spacing.md, letterSpacing: -0.2 },

  appRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  appBadge: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  appType: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 0.6 },
  appAmount: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurface, marginTop: 2 },
  statusPill: { paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.brandTertiary, borderRadius: radii.pill },
  statusPillText: { color: colors.brandPrimary, fontWeight: "700", fontSize: fontSize.xs, textTransform: "capitalize" },
  progressTrack: { height: 6, backgroundColor: colors.divider, borderRadius: radii.pill, marginTop: spacing.lg, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brandPrimary, borderRadius: radii.pill },
  trackHint: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, marginTop: spacing.sm },

  emptyTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurface },
  emptyText: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 4, lineHeight: 20 },
  applyBtn: { flexDirection: "row", gap: 8, alignSelf: "flex-start", marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: 12, backgroundColor: colors.brandPrimary, borderRadius: radii.pill, alignItems: "center" },
  applyBtnText: { color: "#fff", fontWeight: "700" },

  rmRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rmAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surfaceTertiary },
  rmName: { fontSize: fontSize.lg, fontWeight: "800", color: colors.onSurface },
  rmTitle: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },
  rmBadges: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  rmBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.surfaceTertiary, borderRadius: radii.pill },
  rmBadgeText: { fontSize: fontSize.xs, color: colors.onSurface, fontWeight: "600" },
  rmActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  rmAction: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", height: 44, borderRadius: radii.md },
  rmActionText: { fontWeight: "700", fontSize: fontSize.md },
});
