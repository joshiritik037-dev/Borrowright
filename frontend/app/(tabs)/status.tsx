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

type Application = { application_id: string; loan_type: string; loan_amount?: number; status: string; stage: string };
type TimelineItem = { key: string; label: string; completed: boolean; active: boolean };

export default function StatusTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.get<Application[]>("/applications").then((list) => {
      setApps(list);
      const submitted = list.find((a) => a.status === "submitted") || list[0];
      if (submitted) setSelected(submitted);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selected) {
      api.get<TimelineItem[]>(`/applications/${selected.application_id}/timeline`).then(setTimeline).catch(() => {});
    }
  }, [selected]);

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

  const done = timeline.filter((t) => t.completed).length;
  const total = timeline.length || 8;
  const pct = Math.round((done / total) * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Loan Status</Text>
        <Text style={styles.sub}>Live updates from submission to disbursement.</Text>

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
                <Text style={styles.appAmount}>{selected.loan_amount ? inrShort(selected.loan_amount) : "Draft"}</Text>
              </View>
              <View style={styles.pctWrap}>
                <Text style={styles.pct}>{pct}%</Text>
                <Text style={styles.pctLabel}>complete</Text>
              </View>
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${pct}%` }]} /></View>
            <View style={{ marginTop: spacing.xl }}>
              {timeline.map((t, i) => {
                const isLast = i === timeline.length - 1;
                return (
                  <View key={t.key} style={styles.stepRow}>
                    <View style={styles.stepColLine}>
                      <View style={[styles.dot, t.completed && styles.dotDone, t.active && styles.dotActive]}>
                        {t.completed ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                      </View>
                      {!isLast && <View style={[styles.line, t.completed && styles.lineDone]} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: spacing.lg }}>
                      <Text style={[styles.stepLabel, (t.completed || t.active) && styles.stepLabelActive]}>{t.label}</Text>
                      <Text style={styles.stepSub}>{t.completed ? "Completed" : t.active ? "In progress" : "Pending"}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        <View style={{ marginTop: spacing.lg }}>
          <Card>
            <Text style={styles.helpTitle}>Need help?</Text>
            <Text style={styles.helpText}>Your dedicated Relationship Manager is here to assist you 7 days a week.</Text>
            <View style={{ height: spacing.md }} />
            <Button title="Contact RM" variant="outline" testID="status-rm-button" onPress={() => router.push("/(tabs)/profile")} />
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

  headRow: { flexDirection: "row", alignItems: "center" },
  appType: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 0.6 },
  appAmount: { fontSize: 24, fontWeight: "800", color: colors.onSurface, marginTop: 4 },
  pctWrap: { alignItems: "flex-end" },
  pct: { fontSize: 22, fontWeight: "800", color: colors.brandPrimary },
  pctLabel: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, fontWeight: "600" },
  progressTrack: { height: 6, backgroundColor: colors.divider, borderRadius: radii.pill, marginTop: spacing.md, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brandPrimary, borderRadius: radii.pill },

  stepRow: { flexDirection: "row", gap: spacing.md },
  stepColLine: { alignItems: "center", width: 24 },
  dot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.surfaceTertiary, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  dotDone: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  dotActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary },
  line: { flex: 1, width: 2, backgroundColor: colors.divider, marginVertical: 2 },
  lineDone: { backgroundColor: colors.brandPrimary },
  stepLabel: { fontSize: fontSize.md, color: colors.onSurfaceMuted, fontWeight: "600" },
  stepLabelActive: { color: colors.onSurface, fontWeight: "700" },
  stepSub: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, marginTop: 2 },

  empty: { padding: spacing.xl, alignItems: "center", justifyContent: "center", flex: 1, marginTop: -50 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.onSurface },
  emptyText: { fontSize: fontSize.md, color: colors.onSurfaceMuted, textAlign: "center", marginTop: spacing.sm, lineHeight: 22 },

  helpTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurface },
  helpText: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 4 },
});
