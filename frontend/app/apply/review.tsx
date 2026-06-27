import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";
import { inrShort } from "@/src/lib/finance";

export default function Review() {
  const { application_id } = useLocalSearchParams<{ application_id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!application_id) return;
    api.get(`/applications/${application_id}`).then(setApp).catch(() => {});
    api.get<any[]>(`/applications/${application_id}/documents`).then(setDocs).catch(() => {});
  }, [application_id]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/applications/${application_id}/submit`);
      router.replace({ pathname: "/apply/success", params: { application_id } });
    } catch {} finally { setSubmitting(false); }
  };

  if (!app) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]} />;

  const rows = [
    ["Loan Type", String(app.loan_type || "").replace("_", " ").toUpperCase()],
    ["Amount", app.loan_amount ? inrShort(app.loan_amount) : "—"],
    ["Purpose", app.purpose || "—"],
    ["Property Value", app.property_value ? inrShort(app.property_value) : "—"],
    ["Property Type", app.property_type || "—"],
    ["Preferred Bank", app.preferred_bank || "Any"],
    ["Required By", app.loan_required_by || "—"],
    ["City", `${app.city || ""}${app.city && app.state ? ", " : ""}${app.state || ""}`],
    ["PIN", app.pin_code || "—"],
    ["WhatsApp", app.whatsapp_number || "—"],
    ["Channel", app.preferred_communication || "—"],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} testID="rev-back"><Ionicons name="chevron-back" size={22} color={colors.onSurface} /></Pressable>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: "100%" }]} /></View>
        <Text style={styles.step}>Step 3 of 3 · Review</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Almost done!</Text>
        <Text style={styles.sub}>Review your details below and submit.</Text>

        <Card>
          <Text style={styles.section}>Loan Details</Text>
          {rows.map(([k, v]) => (
            <View key={k} style={styles.row}>
              <Text style={styles.k}>{k}</Text>
              <Text style={styles.v}>{v}</Text>
            </View>
          ))}
        </Card>
        <View style={{ height: spacing.md }} />
        <Card>
          <Text style={styles.section}>Documents</Text>
          {docs.length === 0 ? <Text style={styles.k}>None uploaded yet — your RM can collect via WhatsApp.</Text> : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {docs.map((d) => (
                <View key={d.document_id} style={styles.docPill}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                  <Text style={styles.docPillText}>{String(d.doc_type).toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
      <View style={styles.ctaWrap}>
        <Button title="Submit Application" loading={submitting} onPress={submit} testID="review-submit-button" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  back: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary, marginBottom: spacing.md },
  progressBar: { height: 6, backgroundColor: colors.surfaceTertiary, borderRadius: radii.pill, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brandPrimary, borderRadius: radii.pill },
  step: { color: colors.onSurfaceSubtle, fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: fontSize.md, color: colors.onSurfaceMuted, marginTop: 4, marginBottom: spacing.lg },
  section: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface, marginBottom: spacing.md },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider, gap: spacing.md },
  k: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, fontWeight: "600" },
  v: { fontSize: fontSize.md, color: colors.onSurface, fontWeight: "700", textAlign: "right", flex: 1, marginLeft: spacing.md },
  docPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.brandTertiary, borderRadius: radii.pill },
  docPillText: { fontSize: fontSize.xs, color: colors.brandPrimary, fontWeight: "700" },
  ctaWrap: { padding: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
