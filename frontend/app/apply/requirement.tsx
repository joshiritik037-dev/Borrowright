import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@/src/components/Input";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";

const PURPOSES = ["Purchase", "Construction", "Renovation", "Business Expansion", "Working Capital", "Balance Transfer"];
const PROPTYPES = ["Residential", "Commercial", "Industrial", "Agricultural"];
const TIMELINE = [["7d", "Within 7 Days"], ["15d", "15 Days"], ["30d", "30 Days"], ["60d", "60 Days"]];
const CONTACT_TIMES = ["Morning", "Afternoon", "Evening"];
const CHANNELS = ["Phone", "WhatsApp", "Email"];

export default function Requirement() {
  const { loan_type, name } = useLocalSearchParams<{ loan_type: string; name: string }>();
  const router = useRouter();
  const [f, setF] = useState<any>({
    loan_amount: "", purpose: "", property_value: "", property_address: "", property_type: "",
    existing_loan: false, current_emi: "", preferred_bank: "", loan_required_by: "", remarks: "",
    full_address: "", pin_code: "", city: "", state: "", whatsapp_number: "", alternate_mobile: "", email: "",
    preferred_contact_time: "", preferred_communication: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }));

  const Chip = ({ active, onPress, label, testID }: any) => (
    <Pressable onPress={onPress} testID={testID} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );

  const submit = async () => {
    setError(null);
    if (!f.loan_amount || !f.purpose || !f.full_address || !f.pin_code || !f.city || !f.state) { setError("Please fill all required fields"); return; }
    setSaving(true);
    try {
      const cleaned: any = { loan_type };
      Object.entries(f).forEach(([k, v]) => {
        if (v === "" || v === null || v === undefined) return;
        cleaned[k] = v;
      });
      if (cleaned.loan_amount) cleaned.loan_amount = Number(cleaned.loan_amount);
      if (cleaned.property_value) cleaned.property_value = Number(cleaned.property_value);
      if (cleaned.current_emi) cleaned.current_emi = Number(cleaned.current_emi);
      const app = await api.post<any>("/applications", cleaned);
      router.push({ pathname: "/apply/documents", params: { application_id: app.application_id } });
    } catch (e: any) {
      setError(e?.message || "Could not save");
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} testID="req-back"><Ionicons name="chevron-back" size={22} color={colors.onSurface} /></Pressable>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: "33%" }]} /></View>
          <Text style={styles.step}>Step 1 of 3 · {name || loan_type}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Loan Requirement</Text>
          <Input label="Loan Amount Required *" testID="req-amount" value={f.loan_amount} onChangeText={(v) => set("loan_amount", v.replace(/\D/g, ""))} placeholder="e.g., 5000000" keyboardType="number-pad" />

          <Text style={styles.label}>Purpose *</Text>
          <View style={styles.chipRow}>{PURPOSES.map((p) => <Chip key={p} label={p} active={f.purpose === p} onPress={() => set("purpose", p)} testID={`req-purpose-${p.replace(/\W/g,'-').toLowerCase()}`} />)}</View>

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}><Input label="Property Value" testID="req-propval" value={f.property_value} onChangeText={(v) => set("property_value", v.replace(/\D/g, ""))} placeholder="₹" keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Input label="Current EMI" testID="req-emi" value={f.current_emi} onChangeText={(v) => set("current_emi", v.replace(/\D/g, ""))} placeholder="₹" keyboardType="number-pad" /></View>
          </View>
          <Input label="Property Address" testID="req-propaddr" value={f.property_address} onChangeText={(v) => set("property_address", v)} placeholder="Full property address" />

          <Text style={styles.label}>Property Type</Text>
          <View style={styles.chipRow}>{PROPTYPES.map((p) => <Chip key={p} label={p} active={f.property_type === p} onPress={() => set("property_type", p)} testID={`req-proptype-${p.toLowerCase()}`} />)}</View>

          <Input label="Preferred Bank" testID="req-bank" value={f.preferred_bank} onChangeText={(v) => set("preferred_bank", v)} placeholder="HDFC / SBI / Any" />

          <Text style={styles.label}>Loan Required By</Text>
          <View style={styles.chipRow}>{TIMELINE.map(([k, l]) => <Chip key={k} label={l} active={f.loan_required_by === k} onPress={() => set("loan_required_by", k)} testID={`req-timeline-${k}`} />)}</View>

          <Input label="Remarks" testID="req-remarks" value={f.remarks} onChangeText={(v) => set("remarks", v)} placeholder="Anything else we should know?" multiline />

          <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>Contact & Location</Text><View style={styles.line} /></View>

          <Input label="Full Address *" testID="req-address" value={f.full_address} onChangeText={(v) => set("full_address", v)} placeholder="House, Street, Area" />
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}><Input label="PIN *" testID="req-pin" value={f.pin_code} onChangeText={(v) => set("pin_code", v.replace(/\D/g, "").slice(0, 6))} placeholder="400001" keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Input label="City *" testID="req-city" value={f.city} onChangeText={(v) => set("city", v)} placeholder="Mumbai" /></View>
            <View style={{ flex: 1 }}><Input label="State *" testID="req-state" value={f.state} onChangeText={(v) => set("state", v)} placeholder="MH" /></View>
          </View>
          <Input label="WhatsApp Number" testID="req-whatsapp" value={f.whatsapp_number} onChangeText={(v) => set("whatsapp_number", v.replace(/\D/g, "").slice(0, 10))} placeholder="9876543210" keyboardType="number-pad" />
          <Input label="Alternate Mobile" testID="req-altmob" value={f.alternate_mobile} onChangeText={(v) => set("alternate_mobile", v.replace(/\D/g, "").slice(0, 10))} placeholder="Optional" keyboardType="number-pad" />
          <Input label="Email" testID="req-email" value={f.email} onChangeText={(v) => set("email", v)} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Preferred Contact Time</Text>
          <View style={styles.chipRow}>{CONTACT_TIMES.map((p) => <Chip key={p} label={p} active={f.preferred_contact_time === p} onPress={() => set("preferred_contact_time", p)} testID={`req-time-${p.toLowerCase()}`} />)}</View>

          <Text style={styles.label}>Preferred Channel</Text>
          <View style={styles.chipRow}>{CHANNELS.map((p) => <Chip key={p} label={p} active={f.preferred_communication === p} onPress={() => set("preferred_communication", p)} testID={`req-channel-${p.toLowerCase()}`} />)}</View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>
        <View style={styles.ctaWrap}>
          <Button title="Continue to Documents" loading={saving} onPress={submit} testID="req-continue-button" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.divider },
  back: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary, marginBottom: spacing.md },
  progressBar: { height: 6, backgroundColor: colors.surfaceTertiary, borderRadius: radii.pill, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.brandPrimary, borderRadius: radii.pill },
  step: { color: colors.onSurfaceSubtle, fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: "600" },
  title: { fontSize: 26, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5, marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, color: colors.onSurfaceSubtle, marginBottom: spacing.sm, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingHorizontal: spacing.lg, height: 40, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurface, fontWeight: "600", fontSize: fontSize.sm },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.xl, gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: fontSize.xs, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.md },
  ctaWrap: { padding: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
