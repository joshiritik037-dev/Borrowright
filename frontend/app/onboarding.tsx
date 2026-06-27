import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";

const GENDERS = ["Male", "Female", "Other"];
const MARITAL = ["Single", "Married", "Other"];
const EMPLOYMENT = ["Salaried", "Self-Employed", "Business Owner", "Other"];

export default function Onboarding() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    city: user?.city || "",
    state: user?.state || "",
    dob: user?.dob || "",
    gender: user?.gender || "",
    pan: user?.pan || "",
    aadhaar: user?.aadhaar || "",
    monthly_income: user?.monthly_income?.toString() || "",
    company_name: user?.company_name || "",
    marital_status: user?.marital_status || "",
    employment_type: user?.employment_type || "",
    existing_loan: user?.existing_loan || false,
    cibil_score: user?.cibil_score?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.name || !form.city || !form.state || !form.dob || !form.pan) {
      setError("Please fill all required fields"); return;
    }
    setSaving(true);
    try {
      await updateProfile({
        ...form,
        monthly_income: form.monthly_income ? Number(form.monthly_income) : undefined,
        cibil_score: form.cibil_score ? Number(form.cibil_score) : undefined,
        onboarded: true,
      } as any);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const Chip = ({ active, onPress, label, testID }: any) => (
    <Pressable onPress={onPress} testID={testID} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.progressBar}><View style={styles.progressFill} /></View>
          <Text style={styles.step}>Step 1 of 1 · Complete your profile</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Tell us about you</Text>
          <Text style={styles.subtitle}>This helps us recommend the right loan & best banks for you.</Text>

          <View style={{ marginTop: spacing.xl }}>
            <Input label="Full Name *" testID="ob-name" value={form.name} onChangeText={(v) => set("name", v)} placeholder="As per PAN" />
            <Input label="Email" testID="ob-email" value={form.email} onChangeText={(v) => set("email", v)} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1 }}><Input label="City *" testID="ob-city" value={form.city} onChangeText={(v) => set("city", v)} placeholder="Mumbai" /></View>
              <View style={{ flex: 1 }}><Input label="State *" testID="ob-state" value={form.state} onChangeText={(v) => set("state", v)} placeholder="MH" /></View>
            </View>
            <Input label="Date of Birth *" testID="ob-dob" value={form.dob} onChangeText={(v) => set("dob", v)} placeholder="DD/MM/YYYY" />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => <Chip key={g} label={g} active={form.gender === g} onPress={() => set("gender", g)} testID={`ob-gender-${g.toLowerCase()}`} />)}
            </View>

            <Input label="PAN *" testID="ob-pan" value={form.pan} onChangeText={(v) => set("pan", v.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} autoCapitalize="characters" />
            <Input label="Aadhaar (last 4)" testID="ob-aadhaar" value={form.aadhaar} onChangeText={(v) => set("aadhaar", v.replace(/\D/g, "").slice(0, 12))} placeholder="XXXX-XXXX-XXXX" keyboardType="number-pad" />
            <Input label="Monthly Income (₹)" testID="ob-income" value={form.monthly_income} onChangeText={(v) => set("monthly_income", v.replace(/\D/g, ""))} placeholder="80000" keyboardType="number-pad" />

            <Text style={styles.label}>Employment Type</Text>
            <View style={styles.chipRow}>
              {EMPLOYMENT.map((g) => <Chip key={g} label={g} active={form.employment_type === g} onPress={() => set("employment_type", g)} testID={`ob-emp-${g.toLowerCase().replace(/\W/g,'-')}`} />)}
            </View>

            <Input label="Company / Business Name" testID="ob-company" value={form.company_name} onChangeText={(v) => set("company_name", v)} placeholder="Optional" />

            <Text style={styles.label}>Marital Status</Text>
            <View style={styles.chipRow}>
              {MARITAL.map((g) => <Chip key={g} label={g} active={form.marital_status === g} onPress={() => set("marital_status", g)} testID={`ob-marital-${g.toLowerCase()}`} />)}
            </View>

            <Input label="CIBIL Score (optional)" testID="ob-cibil" value={form.cibil_score} onChangeText={(v) => set("cibil_score", v.replace(/\D/g, "").slice(0, 3))} placeholder="750" keyboardType="number-pad" />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.ctaWrap}>
          <Button title="Continue" loading={saving} onPress={submit} testID="ob-submit-button" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  progressBar: { height: 6, backgroundColor: colors.surfaceTertiary, borderRadius: radii.pill, overflow: "hidden" },
  progressFill: { height: "100%", width: "60%", backgroundColor: colors.brandPrimary, borderRadius: radii.pill },
  step: { color: colors.onSurfaceSubtle, fontSize: fontSize.sm, marginTop: spacing.sm, fontWeight: "600" },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title: { color: colors.onSurface, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { color: colors.onSurfaceSubtle, fontSize: fontSize.md, marginTop: spacing.sm, lineHeight: 22 },
  label: { fontSize: fontSize.sm, color: colors.onSurfaceSubtle, marginBottom: spacing.sm, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  chip: { paddingHorizontal: spacing.lg, height: 40, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurface, fontWeight: "600", fontSize: fontSize.base },
  chipTextActive: { color: "#fff" },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.md },
  ctaWrap: { padding: spacing.xl, paddingTop: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
});
