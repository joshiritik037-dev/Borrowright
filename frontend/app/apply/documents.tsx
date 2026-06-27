import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";
import { openWhatsApp } from "@/src/lib/links";

const DOCS = [
  { id: "pan", label: "PAN Card", icon: "card", required: true },
  { id: "aadhaar", label: "Aadhaar", icon: "id-card", required: true },
  { id: "income", label: "Income Proof", icon: "trending-up" },
  { id: "bank", label: "Bank Statements (6m)", icon: "document-text" },
  { id: "itr", label: "ITR (2 yrs)", icon: "document" },
  { id: "salary", label: "Salary Slips (3m)", icon: "receipt" },
  { id: "property", label: "Property Papers", icon: "home" },
  { id: "sale", label: "Sale Agreement", icon: "create" },
  { id: "electricity", label: "Electricity Bill", icon: "flash" },
  { id: "photo", label: "Passport Photo", icon: "person" },
  { id: "other", label: "Other Documents", icon: "folder" },
];

export default function Documents() {
  const { application_id } = useLocalSearchParams<{ application_id: string }>();
  const router = useRouter();
  const [uploaded, setUploaded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!application_id) return;
    api.get<any[]>(`/applications/${application_id}/documents`).then((items) => {
      setUploaded(new Set(items.map((i) => i.doc_type)));
    }).catch(() => {});
  }, [application_id]);

  const markUploaded = async (doc_type: string) => {
    // Simulate upload — we send a tiny base64 placeholder so flow works in mobile preview
    try {
      await api.post(`/applications/${application_id}/documents`, {
        doc_type,
        filename: `${doc_type}-${Date.now()}.txt`,
        mime_type: "text/plain",
        base64_data: "data:text/plain;base64,VVBMT0FERUQ=",
      });
      setUploaded((s) => new Set([...s, doc_type]));
    } catch {}
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} testID="docs-back"><Ionicons name="chevron-back" size={22} color={colors.onSurface} /></Pressable>
        <View style={styles.progressBar}><View style={[styles.progressFill, { width: "66%" }]} /></View>
        <Text style={styles.step}>Step 2 of 3 · Documents</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Upload your documents</Text>
        <View style={styles.secureRow}>
          <Ionicons name="lock-closed" size={14} color={colors.success} />
          <Text style={styles.secureText}>Secure Upload · Encrypted Storage</Text>
        </View>

        <View style={styles.whatsappCard} testID="whatsapp-share-card">
          <View style={styles.whatsappIcon}><Ionicons name="logo-whatsapp" size={28} color={colors.whatsapp} /></View>
          <Text style={styles.whatsappTitle}>Share Your Documents Easily</Text>
          <Text style={styles.whatsappSub}>Don't have all your documents right now? Simply send them on WhatsApp. Your RM will organize and verify everything for you.</Text>
          <View style={styles.checks}>
            {["No Email", "No Visits", "Quick Verify", "Secure"].map((c) => (
              <View key={c} style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={14} color={colors.whatsapp} />
                <Text style={styles.checkText}>{c}</Text>
              </View>
            ))}
          </View>
          <Button title="Share on WhatsApp" variant="whatsapp" onPress={() => openWhatsApp(`Hi, please find my documents for application ${application_id}.`)} icon={<Ionicons name="logo-whatsapp" size={18} color="#fff" />} testID="documents-whatsapp-button" />
        </View>

        <Text style={styles.section}>Upload here</Text>
        <View style={{ gap: spacing.sm }}>
          {DOCS.map((d) => {
            const done = uploaded.has(d.id);
            return (
              <Pressable key={d.id} testID={`doc-${d.id}`} style={styles.docRow} onPress={() => markUploaded(d.id)}>
                <View style={[styles.docIcon, done && { backgroundColor: colors.success }]}>
                  <Ionicons name={done ? "checkmark" : (d.icon as any)} size={18} color={done ? "#fff" : colors.brandPrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docLabel}>{d.label}{d.required ? <Text style={{ color: colors.error }}> *</Text> : null}</Text>
                  <Text style={styles.docHint}>{done ? "Uploaded" : "Tap to upload (Gallery / Camera / Files)"}</Text>
                </View>
                <Ionicons name="cloud-upload" size={18} color={done ? colors.success : colors.onSurfaceMuted} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.ctaWrap}>
        <Button title={`Continue (${uploaded.size} uploaded)`} onPress={() => router.push({ pathname: "/apply/review", params: { application_id } })} testID="docs-continue-button" />
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
  title: { fontSize: 26, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  secureRow: { flexDirection: "row", gap: 6, alignItems: "center", marginTop: spacing.xs, marginBottom: spacing.lg },
  secureText: { fontSize: fontSize.sm, color: colors.success, fontWeight: "600" },
  whatsappCard: { padding: spacing.lg, backgroundColor: "#F0FDF4", borderRadius: radii.lg, borderWidth: 1, borderColor: "#BBF7D0", marginBottom: spacing.lg },
  whatsappIcon: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  whatsappTitle: { fontSize: fontSize.lg, fontWeight: "800", color: colors.onSurface },
  whatsappSub: { fontSize: fontSize.sm, color: colors.onSurfaceSubtle, marginTop: 4, lineHeight: 20 },
  checks: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md, marginBottom: spacing.md },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  checkText: { fontSize: fontSize.xs, color: colors.onSurfaceSubtle, fontWeight: "600" },
  section: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface, marginVertical: spacing.md },
  docRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  docIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  docLabel: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface },
  docHint: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, marginTop: 2 },
  ctaWrap: { padding: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
