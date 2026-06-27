import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/lib/api";
import { openWhatsApp, openTel } from "@/src/lib/links";

type Faq = { q: string; a: string };

export default function Profile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => { api.get<Faq[]>("/faqs").then(setFaqs).catch(() => {}); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        <Card>
          <View style={styles.profileRow}>
            <View style={styles.avatar}><Ionicons name="person" size={28} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.name || "Welcome"}</Text>
              <Text style={styles.contact}>{user?.mobile || user?.email}</Text>
              {user?.city && user?.state ? <Text style={styles.contact}>{user.city}, {user.state}</Text> : null}
            </View>
          </View>
        </Card>

        <View style={{ marginTop: spacing.lg }}>
          <Card>
            <Text style={styles.sectionTitle}>Your Relationship Manager</Text>
            <View style={styles.rmRow}>
              <View style={styles.rmAvatar}><Ionicons name="person-circle" size={48} color={colors.brandPrimary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rmName}>Priya Sharma</Text>
                <Text style={styles.rmTitle}>Senior Relationship Manager</Text>
                <Text style={styles.contact}>priya@splendidconsultants.in</Text>
              </View>
            </View>
            <View style={styles.rmActions}>
              <Pressable testID="profile-rm-call" style={[styles.rmAction, { backgroundColor: colors.brandPrimary }]} onPress={() => openTel("+919826739349")}>
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={[styles.rmActionText, { color: "#fff" }]}>Call</Text>
              </Pressable>
              <Pressable testID="profile-rm-whatsapp" style={[styles.rmAction, { backgroundColor: colors.whatsapp }]} onPress={() => openWhatsApp()}>
                <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                <Text style={[styles.rmActionText, { color: "#fff" }]}>WhatsApp</Text>
              </Pressable>
            </View>
          </Card>
        </View>

        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {[
            { id: "promise", label: "Our Promise", icon: "ribbon", route: "/promise" },
            { id: "emi", label: "EMI Calculator", icon: "calculator", route: "/emi-calculator" },
            { id: "compare", label: "Bank Comparison", icon: "git-compare", route: "/bank-compare" },
            { id: "refer", label: "Refer & Earn", icon: "gift", route: null },
          ].map((it) => (
            <Pressable key={it.id} testID={`profile-link-${it.id}`} style={styles.link} onPress={() => it.route ? router.push(it.route as any) : openWhatsApp("Hi, I want to refer a friend to BorrowRight.")}>
              <Ionicons name={it.icon as any} size={20} color={colors.brandPrimary} />
              <Text style={styles.linkText}>{it.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>FAQs</Text>
          {faqs.map((f, i) => (
            <Pressable key={i} testID={`faq-${i}`} onPress={() => setOpen(open === i ? null : i)} style={styles.faqItem}>
              <View style={styles.faqHead}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Ionicons name={open === i ? "chevron-up" : "chevron-down"} size={18} color={colors.onSurfaceMuted} />
              </View>
              {open === i && <Text style={styles.faqA}>{f.a}</Text>}
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button title="Sign Out" variant="outline" testID="profile-sign-out" onPress={async () => { await signOut(); router.replace("/welcome"); }} />
        </View>
        <Text style={styles.footer}>Splendid Consultants · BorrowRight v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5, marginBottom: spacing.lg },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  name: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurface },
  contact: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },

  sectionTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface, marginBottom: spacing.md, letterSpacing: -0.2 },
  rmRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rmAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  rmName: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurface },
  rmTitle: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },
  rmActions: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
  rmAction: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", height: 44, borderRadius: radii.md },
  rmActionText: { fontWeight: "700", fontSize: fontSize.md },

  link: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  linkText: { flex: 1, fontSize: fontSize.md, color: colors.onSurface, fontWeight: "600" },

  faqItem: { padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  faqHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  faqQ: { flex: 1, fontSize: fontSize.md, color: colors.onSurface, fontWeight: "700", paddingRight: spacing.md },
  faqA: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: spacing.sm, lineHeight: 20 },

  footer: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, textAlign: "center", marginTop: spacing.xl },
});
