import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
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
  { id: "refer", label: "Refer & Earn", icon: "gift", route: "/refer" },
];

const RMS = [
  {
    id: "ritik",
    name: "Ritik Joshi",
    title: "Contact Person",
    phone: "+919826739349",
    whatsapp: "+919826739349",
  },
  {
    id: "koushiki",
    name: "Koushiki Khandelwal",
    title: "Contact Person",
    phone: "+919301931777",
    whatsapp: "+919301931777",
  },
];


export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ show_offer?: string }>();
  const [apps, setApps] = useState<Application[]>([]);
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    api.get<Application[]>("/applications").then(setApps).catch(() => {});
  }, []);

  useEffect(() => {
    if (params?.show_offer === "true") {
      setShowOfferModal(true);
    }
  }, [params?.show_offer]);

  const active = apps[0];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Exclusive Offer Modal Popup */}
      <Modal visible={showOfferModal} animationType="slide" transparent={false} onRequestClose={() => setShowOfferModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
          <View style={modalStyles.header}>
            <View style={modalStyles.badge}>
              <Ionicons name="sparkles" size={14} color={colors.warning} />
              <Text style={modalStyles.badgeText}>EXCLUSIVE OFFER</Text>
            </View>
            <Pressable testID="offer-popup-skip-top" onPress={() => setShowOfferModal(false)} style={modalStyles.skipBtn}>
              <Text style={modalStyles.skipBtnText}>Skip</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.brandPrimary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
            <ImageBackground source={{ uri: "https://images.unsplash.com/photo-1649861742672-20152f77c1f5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZ3JlZW4lMjBsdXh1cnklMjBhYnN0cmFjdCUyMGdyYWRpZW50JTIwdGV4dHVyZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgyNTc3MTExfDA&ixlib=rb-4.1.0&q=85" }} style={modalStyles.hero} imageStyle={{ borderRadius: radii.lg }}>
              <LinearGradient colors={["rgba(10,59,42,0.45)", "rgba(10,59,42,0.95)"]} style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]} />
              <View style={modalStyles.heroInner}>
                <Text style={modalStyles.heroTitle}>Min. 15% Cash Refund</Text>
                <Text style={modalStyles.heroSub}>If we save costs during your loan process, we return at least 15% of the processing fees involved as a cash refund — making your borrowing rewarding.</Text>
              </View>
            </ImageBackground>

            <View style={{ marginTop: spacing.xl }}>
              <Text style={modalStyles.sectionTitle}>Why Choose TrueBorrow?</Text>
              <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                <View style={modalStyles.featureRow}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                  <Text style={modalStyles.featureText}>100% Transparent process — zero hidden charges</Text>
                </View>
                <View style={modalStyles.featureRow}>
                  <Ionicons name="flash" size={22} color={colors.brandPrimary} />
                  <Text style={modalStyles.featureText}>Direct bank tie-ups for fastest 10-day disbursals</Text>
                </View>
                <View style={modalStyles.featureRow}>
                  <Ionicons name="gift" size={22} color={colors.warning} />
                  <Text style={modalStyles.featureText}>Minimum 15% refund directly on your loan processing fees</Text>
                </View>
                <View style={modalStyles.featureRow}>
                  <Ionicons name="person" size={22} color={colors.brandPrimary} />
                  <Text style={modalStyles.featureText}>Dedicated Contact Person assigned end-to-end</Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
              <Button title="Talk on WhatsApp" variant="whatsapp" onPress={() => openWhatsApp()} icon={<Ionicons name="logo-whatsapp" size={18} color="#fff" />} testID="offer-popup-whatsapp" />
              <Button title="Skip & Continue to Home" variant="outline" onPress={() => setShowOfferModal(false)} icon={<Ionicons name="arrow-forward" size={18} color={colors.brandPrimary} />} testID="offer-popup-skip-bottom" />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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

        {/* 15% Cash Refund Hero (Highlighted & Expanded) */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1649861742672-20152f77c1f5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZ3JlZW4lMjBsdXh1cnklMjBhYnN0cmFjdCUyMGdyYWRpZW50JTIwdGV4dHVyZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgyNTc3MTExfDA&ixlib=rb-4.1.0&q=85" }}
            imageStyle={{ borderRadius: radii.xl }}
            style={styles.hero}
          >
            <LinearGradient
              colors={["rgba(10,59,42,0.40)", "rgba(10,59,42,0.92)", "#06261B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: radii.xl }]}
            />
            {/* Background Decorative Icon */}
            <View style={styles.heroWatermark}>
              <Ionicons name="gift" size={160} color="rgba(212,175,55,0.08)" />
            </View>
            <View style={styles.heroInner}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={14} color="#0A3B2A" />
                <Text style={styles.heroBadgeText}>EXCLUSIVE OFFER</Text>
              </View>
              <Text style={styles.heroTitle}>Min. 15% Cash Refund</Text>
              <Text style={styles.heroSub}>We share at least 15% of your processing fees directly back with you.</Text>
              <Pressable testID="home-promise-cta" onPress={() => setShowOfferModal(true)} style={styles.heroCta}>
                <Text style={styles.heroCtaText}>How it works</Text>
                <Ionicons name="arrow-forward" size={16} color="#0A3B2A" />
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
                    <Text style={styles.appAmount}>{active.loan_amount ? inrShort(active.loan_amount) : "Applied"}</Text>
                  </View>
                  <View style={[styles.statusPill, (active.status === "approved" || active.stage === "approved") && { backgroundColor: "#D1FAE5" }]}>
                    <Text style={[styles.statusPillText, (active.status === "approved" || active.stage === "approved") && { color: "#065F46" }]}>
                      {(active.status === "approved" || active.stage === "approved") ? "Approved 🎉" : "Processing ⏳"}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: (active.status === "approved" || active.stage === "approved") ? "100%" : "50%" }]} />
                </View>
                <Text style={styles.trackHint}>
                  {(active.status === "approved" || active.stage === "approved") ? "Status: Approved · Tap to view details" : "Status: Processing · Tap to view details"}
                </Text>
              </Card>
            </Pressable>
          ) : (
            <Card>
              <Text style={styles.emptyTitle}>No active application yet</Text>
              <Text style={styles.emptyText}>Start your loan in under 3 minutes. Pay less, save more.</Text>
              <Pressable testID="home-start-apply" style={styles.applyBtn} onPress={() => router.push("/apply/select-type")}>
                <Text style={styles.applyBtnText}>Apply Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </Pressable>
            </Card>
          )}
        </View>

        {/* RM cards */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>Your Contact Persons</Text>
          <View style={{ gap: spacing.md }}>
            {RMS.map((rm) => (
              <Card key={rm.id}>
                <View style={styles.rmRow}>
                  <View style={styles.rmAvatar}><Ionicons name="person-circle" size={48} color={colors.brandPrimary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rmName}>{rm.name}</Text>
                    <Text style={styles.rmTitle}>{rm.title}</Text>
                  </View>
                </View>
                <View style={styles.rmActions}>
                  <Pressable testID={`rm-call-button-${rm.id}`} style={[styles.rmAction, { backgroundColor: colors.brandPrimary }]} onPress={() => openTel(rm.phone)}>
                    <Ionicons name="call" size={16} color="#fff" />
                    <Text style={[styles.rmActionText, { color: "#fff" }]}>Call</Text>
                  </Pressable>
                  <Pressable testID={`rm-whatsapp-button-${rm.id}`} style={[styles.rmAction, { backgroundColor: colors.whatsapp }]} onPress={() => openWhatsApp("Hi TrueBorrow Team!", rm.whatsapp)}>
                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                    <Text style={[styles.rmActionText, { color: "#fff" }]}>WhatsApp</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg },
  greet: { color: colors.onSurface, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  subgreet: { color: colors.onSurfaceMuted, fontSize: fontSize.sm, marginTop: 2 },
  iconBtn: { padding: 2 },

  hero: {
    height: 250,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.7)",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroWatermark: {
    position: "absolute",
    right: -25,
    bottom: -30,
    transform: [{ rotate: "-15deg" }],
  },
  heroInner: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  heroBadge: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.gold,
    borderRadius: radii.pill,
    marginBottom: spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  heroBadgeText: { color: "#0A3B2A", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  heroTitle: { color: "#fff", fontSize: 34, fontWeight: "900", letterSpacing: -0.8, marginTop: 6, textShadowColor: "rgba(0,0,0,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  heroSub: { color: "rgba(255,255,255,0.92)", fontSize: fontSize.md, marginTop: 6, lineHeight: 22, maxWidth: 520 },
  heroCta: {
    alignSelf: "flex-start",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: 11,
    backgroundColor: "#fff",
    borderRadius: radii.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCtaText: { color: "#0A3B2A", fontWeight: "800", fontSize: fontSize.md },

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
  rmAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  rmName: { fontSize: fontSize.lg, fontWeight: "800", color: colors.onSurface },
  rmTitle: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },
  rmBadges: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  rmBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.surfaceTertiary, borderRadius: radii.pill },
  rmBadgeText: { fontSize: fontSize.xs, color: colors.onSurface, fontWeight: "600" },
  rmActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  rmAction: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", height: 44, borderRadius: radii.md },
  rmActionText: { fontWeight: "700", fontSize: fontSize.md },
});

const modalStyles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.brandTertiary, borderRadius: radii.pill },
  badgeText: { color: colors.warning, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  skipBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, height: 38, borderRadius: radii.pill, backgroundColor: colors.brandTertiary, borderWidth: 1, borderColor: colors.border },
  skipBtnText: { color: colors.brandPrimary, fontWeight: "700", fontSize: fontSize.sm },
  hero: { height: 200, borderRadius: radii.lg, overflow: "hidden" },
  heroInner: { flex: 1, padding: spacing.lg, justifyContent: "flex-end" },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm, marginTop: spacing.xs, lineHeight: 20 },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.3 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  featureText: { flex: 1, fontSize: fontSize.md, fontWeight: "600", color: colors.onSurface },
});
