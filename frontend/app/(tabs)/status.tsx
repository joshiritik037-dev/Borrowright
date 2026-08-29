import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";
import { inrShort } from "@/src/lib/finance";

type Application = {
  application_id: string;
  loan_type: string;
  loan_amount?: number;
  status: string;
  stage: string;
  created_at?: string;
};

export default function StatusTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get<Application[]>("/applications").then((list) => {
      setApps(list);
      if (list.length > 0) setSelected(list[0]);
    }).catch(() => {});
  }, []);

  if (!apps.length) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
        <View style={{ padding: spacing.xl }}>
          <Text style={styles.title}>Loan Status</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="document-text-outline" size={36} color={colors.brandPrimary} /></View>
          <Text style={styles.emptyTitle}>No applications yet</Text>
          <Text style={styles.emptyText}>Apply for a loan to start tracking its progress in real time.</Text>
          <View style={{ height: spacing.lg }} />
          <Button title="Apply for a Loan" testID="status-apply-button" onPress={() => router.push("/apply/select-type")} fullWidth={false} />
        </View>
      </SafeAreaView>
    );
  }

  const isApproved = selected?.status === "approved" || selected?.stage === "approved";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Loan Status</Text>
        <Text style={styles.sub}>Track your application status in real time.</Text>

        {apps.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}>
            {apps.map((a) => (
              <Pressable key={a.application_id} onPress={() => setSelected(a)} style={[styles.chip, selected?.application_id === a.application_id && styles.chipActive]}>
                <Text style={[styles.chipText, selected?.application_id === a.application_id && { color: "#fff" }]}>{a.loan_type.replace("_", " ").toUpperCase()}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {selected && (
          <Card>
            <View style={styles.headRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.appType}>{selected.loan_type.replace("_", " ").toUpperCase()} LOAN</Text>
                <Text style={styles.appAmount}>{selected.loan_amount ? inrShort(selected.loan_amount) : "Applied"}</Text>
                <Text style={styles.appId}>ID: {selected.application_id}</Text>
              </View>

              {/* 2 Statuses Only: Approved or Processing */}
              <View style={[styles.statusBadge, isApproved ? styles.badgeApproved : styles.badgeProcessing]}>
                <Ionicons name={isApproved ? "checkmark-circle" : "time"} size={16} color={isApproved ? "#065F46" : "#B45309"} />
                <Text style={[styles.statusBadgeText, isApproved ? { color: "#065F46" } : { color: "#B45309" }]}>
                  {isApproved ? "Approved" : "Processing"}
                </Text>
              </View>
            </View>

            {/* 2-Step Status Stepper */}
            <View style={styles.stepperWrap}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, styles.stepDotDone]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <Text style={styles.stepTextActive}>Processing</Text>
              </View>
              <View style={[styles.stepLine, isApproved && styles.stepLineDone]} />
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, isApproved ? styles.stepDotDone : styles.stepDotPending]}>
                  {isApproved ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.pendingDotNumber}>2</Text>}
                </View>
                <Text style={isApproved ? styles.stepTextActive : styles.stepTextPending}>Approved</Text>
              </View>
            </View>

            {/* Status Message Box */}
            <View style={[styles.msgBox, isApproved ? styles.msgBoxApproved : styles.msgBoxProcessing]}>
              <Ionicons name={isApproved ? "checkmark-circle-outline" : "hourglass-outline"} size={22} color={isApproved ? "#059669" : colors.goldDark} />
              <View style={{ flex: 1 }}>
                <Text style={styles.msgTitle}>{isApproved ? "Loan Application Approved 🎉" : "Application Under Processing ⏳"}</Text>
                <Text style={styles.msgDesc}>
                  {isApproved
                    ? "Congratulations! Your loan application has been approved. Our team will coordinate final disbursal details."
                    : "Your loan application information is received and is currently under processing. Our team & bank partners are verifying your application."}
                </Text>
              </View>
            </View>

            {/* Admin Action: Approve Application */}
            {!isApproved ? (
              <View style={{ marginTop: spacing.md }}>
                <Button
                  title="Approve Application (Admin Action)"
                  variant="primary"
                  testID="status-admin-approve-button"
                  onPress={async () => {
                    try {
                      const updated = await api.post<Application>(`/applications/${selected.application_id}/approve`);
                      setSelected(updated);
                      setApps((prev) => prev.map((a) => (a.application_id === updated.application_id ? updated : a)));
                    } catch {}
                  }}
                  icon={<Ionicons name="checkmark-circle" size={18} color="#fff" />}
                />
              </View>
            ) : null}
          </Card>
        )}

        <View style={{ marginTop: spacing.lg }}>
          <Card>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpText}>Your dedicated Contact Person is here to assist you 7 days a week.</Text>
            <View style={{ height: spacing.md }} />
            <Button title="Contact Us" variant="outline" testID="status-rm-button" onPress={() => router.push("/(tabs)/profile")} />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: fontSize.md, color: colors.onSurfaceMuted, marginTop: spacing.xs, marginBottom: spacing.lg },

  chip: { paddingHorizontal: spacing.lg, height: 36, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurface, fontWeight: "600", fontSize: fontSize.sm },

  headRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  appType: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 0.6 },
  appAmount: { fontSize: 24, fontWeight: "800", color: colors.onSurface, marginTop: 4 },
  appId: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, marginTop: 2, fontWeight: "600" },

  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill },
  badgeProcessing: { backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FCD34D" },
  badgeApproved: { backgroundColor: "#D1FAE5", borderWidth: 1, borderColor: "#6EE7B7" },
  statusBadgeText: { fontSize: fontSize.xs, fontWeight: "800", letterSpacing: 0.5 },

  stepperWrap: { flexDirection: "row", alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.lg, paddingHorizontal: spacing.md },
  stepItem: { alignItems: "center", gap: 6 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepDotDone: { backgroundColor: colors.brandPrimary },
  stepDotPending: { backgroundColor: colors.surfaceTertiary, borderWidth: 2, borderColor: colors.border },
  pendingDotNumber: { fontSize: 12, fontWeight: "700", color: colors.onSurfaceMuted },
  stepLine: { flex: 1, height: 3, backgroundColor: colors.border, marginHorizontal: spacing.md },
  stepLineDone: { backgroundColor: colors.brandPrimary },
  stepTextActive: { fontSize: fontSize.xs, fontWeight: "800", color: colors.onSurface },
  stepTextPending: { fontSize: fontSize.xs, fontWeight: "600", color: colors.onSurfaceMuted },

  msgBox: { flexDirection: "row", gap: spacing.md, padding: spacing.lg, borderRadius: radii.md, marginTop: spacing.sm, borderWidth: 1 },
  msgBoxProcessing: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  msgBoxApproved: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  msgTitle: { fontSize: fontSize.md, fontWeight: "800", color: colors.onSurface },
  msgDesc: { fontSize: fontSize.sm, color: colors.onSurfaceSubtle, marginTop: 4, lineHeight: 20 },

  empty: { padding: spacing.xl, alignItems: "center", justifyContent: "center", flex: 1, marginTop: -50 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.onSurface },
  emptyText: { fontSize: fontSize.md, color: colors.onSurfaceMuted, textAlign: "center", marginTop: spacing.sm, lineHeight: 22 },

  helpTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurface },
  helpText: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 4 },
});
