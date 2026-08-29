import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";
import { openWhatsApp } from "@/src/lib/links";
import { inr } from "@/src/lib/finance";

type Stats = {
  total_invites: number;
  signed_up: number;
  applied: number;
  disbursed: number;
  total_earned: number;
  pending_earned: number;
  reward_pct: number;
};
type Ref = {
  referral_id: string;
  status: "signed_up" | "applied" | "disbursed";
  reward_amount: number;
  disbursed_amount: number;
  referred_name: string;
  referred_mobile_mask?: string;
  created_at: string;
};
type Data = { referral_code: string; share_text: string; stats: Stats; referrals: Ref[] };

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  signed_up: { label: "Signed up", color: "#3B82F6", bg: "#DBEAFE" },
  applied: { label: "Applied", color: "#D97706", bg: "#FEF3C7" },
  disbursed: { label: "Disbursed", color: "#059669", bg: "#D1FAE5" },
};

export default function Refer() {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try { setData(await api.get<Data>("/me/referrals")); } catch {}
  };
  useEffect(() => { load(); }, []);

  const copy = async () => {
    if (!data) return;
    await Clipboard.setStringAsync(data.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const shareNative = async () => {
    if (!data) return;
    try { await Share.share({ message: data.share_text }); } catch {}
  };

  const shareWA = () => { if (data) openWhatsApp(data.share_text); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} testID="refer-back">
            <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
          </Pressable>
        </View>

        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1649861742672-20152f77c1f5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxkYXJrJTIwZ3JlZW4lMjBsdXh1cnklMjBhYnN0cmFjdCUyMGdyYWRpZW50JTIwdGV4dHVyZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgyNTc3MTExfDA&ixlib=rb-4.1.0&q=85" }}
          imageStyle={{ borderRadius: radii.lg }}
          style={styles.hero}
        >
          <LinearGradient colors={["rgba(10,59,42,0.45)", "rgba(10,59,42,0.97)"]} style={[StyleSheet.absoluteFill, { borderRadius: radii.lg }]} />
          <View style={styles.heroInner}>
            <View style={styles.badge}><Ionicons name="gift" size={12} color={colors.warning} /><Text style={styles.badgeText}>REFER & EARN</Text></View>
            <Text style={styles.heroTitle}>Earn 0.10% of every disbursed loan</Text>
            <Text style={styles.heroSub}>Share TrueBorrow with friends. Get paid when their loan gets disbursed. Uncapped.</Text>

            <View style={styles.codeRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>YOUR CODE</Text>
                <Text style={styles.code} testID="refer-code">{data?.referral_code || "—"}</Text>
              </View>
              <Pressable testID="refer-copy" onPress={copy} style={styles.copyBtn}>
                <Ionicons name={copied ? "checkmark" : "copy"} size={18} color={colors.brandPrimary} />
              </Pressable>
            </View>

            <View style={styles.shareRow}>
              <Pressable testID="refer-share-whatsapp" style={[styles.shareBtn, { backgroundColor: colors.whatsapp }]} onPress={shareWA}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.shareText}>WhatsApp</Text>
              </Pressable>
              <Pressable testID="refer-share-more" style={[styles.shareBtn, { backgroundColor: "#fff" }]} onPress={shareNative}>
                <Ionicons name="share-social" size={18} color={colors.brandPrimary} />
                <Text style={[styles.shareText, { color: colors.brandPrimary }]}>Share</Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>

        <View style={{ padding: spacing.xl }}>
          {/* Earnings */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statK}>Total Earned</Text>
              <Text style={styles.statV} testID="refer-total-earned">{inr(data?.stats.total_earned || 0)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statK}>Pending</Text>
              <Text style={[styles.statV, { color: colors.goldDark }]} testID="refer-pending-earned">{inr(data?.stats.pending_earned || 0)}</Text>
            </View>
          </View>

          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={{ marginTop: spacing.md, gap: spacing.md }}>
              {[
                { i: "share-social", t: "Share your code", d: "Send it to friends planning to take a loan" },
                { i: "person-add", t: "They sign up", d: "Using your code → instant tracked invite" },
                { i: "document-text", t: "They apply for a loan", d: "Submit application via TrueBorrow" },
                { i: "cash", t: "You earn 0.10% on disbursal", d: "Reward credited the day their loan is disbursed" },
              ].map((s, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepDot}><Text style={styles.stepNum}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name={s.i as any} size={14} color={colors.brandPrimary} />
                      <Text style={styles.stepT}>{s.t}</Text>
                    </View>
                    <Text style={styles.stepD}>{s.d}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Funnel summary */}
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg }}>
            <FunnelStat label="Invites" value={data?.stats.total_invites || 0} />
            <FunnelStat label="Applied" value={data?.stats.applied || 0} highlight />
            <FunnelStat label="Disbursed" value={data?.stats.disbursed || 0} highlight />
          </View>

          {/* List */}
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Your referrals</Text>
          {(!data || data.referrals.length === 0) ? (
            <Card style={{ marginTop: spacing.md }}>
              <View style={{ alignItems: "center", paddingVertical: spacing.lg }}>
                <View style={styles.emptyIcon}><Ionicons name="people" size={28} color={colors.brandPrimary} /></View>
                <Text style={styles.emptyTitle}>No referrals yet</Text>
                <Text style={styles.emptyText}>Share your code to start earning. Every disbursal pays you 0.10% — uncapped.</Text>
                <View style={{ height: spacing.md }} />
                <Button title="Invite on WhatsApp" variant="whatsapp" onPress={shareWA} icon={<Ionicons name="logo-whatsapp" size={18} color="#fff" />} testID="refer-empty-cta" fullWidth={false} />
              </View>
            </Card>
          ) : (
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              {data.referrals.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META.signed_up;
                return (
                  <View key={r.referral_id} testID={`refer-row-${r.referral_id}`} style={styles.row}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{(r.referred_name || "?").slice(0, 1).toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{r.referred_name}</Text>
                      <Text style={styles.rowMobile}>{r.referred_mobile_mask || ""}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <View style={[styles.pill, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.pillText, { color: meta.color }]}>{meta.label}</Text>
                      </View>
                      {r.status === "disbursed" && (
                        <Text style={styles.earned}>+ {inr(r.reward_amount)}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FunnelStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View style={[styles.funnel, highlight && { backgroundColor: colors.brandTertiary }]}>
      <Text style={styles.funnelVal}>{value}</Text>
      <Text style={styles.funnelLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md },
  back: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  hero: { marginHorizontal: spacing.xl, borderRadius: radii.lg, overflow: "hidden" },
  heroInner: { padding: spacing.lg },
  badge: { flexDirection: "row", alignSelf: "flex-start", gap: 6, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "rgba(212,175,55,0.20)", borderRadius: radii.pill, marginBottom: spacing.md },
  badgeText: { color: colors.warning, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  heroTitle: { color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.5, lineHeight: 30 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontSize: fontSize.sm, marginTop: spacing.sm, lineHeight: 20 },
  codeRow: { flexDirection: "row", alignItems: "stretch", gap: spacing.sm, marginTop: spacing.lg },
  codeBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.10)", borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", borderStyle: "dashed" },
  codeLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, letterSpacing: 1.5, fontWeight: "700" },
  code: { color: "#fff", fontSize: 22, fontWeight: "800", letterSpacing: 1.2, marginTop: 4 },
  copyBtn: { width: 56, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: radii.md },
  shareRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  shareBtn: { flex: 1, height: 44, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: radii.md },
  shareText: { color: "#fff", fontSize: fontSize.md, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: spacing.md },
  statCard: { flex: 1, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  statK: { fontSize: 10, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  statV: { fontSize: 24, fontWeight: "800", color: colors.brandPrimary, marginTop: 4 },

  sectionTitle: { fontSize: fontSize.lg, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.3 },
  stepRow: { flexDirection: "row", gap: spacing.md, alignItems: "flex-start" },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  stepNum: { color: colors.brandPrimary, fontWeight: "800", fontSize: 13 },
  stepT: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface },
  stepD: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },

  funnel: { flex: 1, padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  funnelVal: { fontSize: 22, fontWeight: "800", color: colors.onSurface },
  funnelLabel: { fontSize: 10, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 2 },

  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: "800", color: colors.onSurface },
  emptyText: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, textAlign: "center", marginTop: spacing.xs, paddingHorizontal: spacing.lg, lineHeight: 20 },

  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: fontSize.md },
  rowName: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface },
  rowMobile: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  pillText: { fontSize: fontSize.xs, fontWeight: "800", letterSpacing: 0.4 },
  earned: { fontSize: fontSize.sm, color: colors.success, fontWeight: "800", marginTop: 4 },
});
