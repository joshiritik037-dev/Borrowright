import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
import { Input } from "@/src/components/Input";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/lib/api";
import { openWhatsApp, openTel } from "@/src/lib/links";
import { inr } from "@/src/lib/finance";

type Faq = { q: string; a: string };

const EMPLOYMENT_TYPES = ["Salaried", "Self-Employed", "Business Owner", "Other"];

export default function Profile() {
  const { user, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    city: user?.city || "",
    state: user?.state || "",
    pan: user?.pan || "",
    aadhaar: user?.aadhaar || "",
    monthly_income: user?.monthly_income?.toString() || "",
    company_name: user?.company_name || "",
    employment_type: user?.employment_type || "",
  });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    api.get<Faq[]>("/faqs").then(setFaqs).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        city: user.city || "",
        state: user.state || "",
        pan: user.pan || "",
        aadhaar: user.aadhaar || "",
        monthly_income: user.monthly_income?.toString() || "",
        company_name: user.company_name || "",
        employment_type: user.employment_type || "",
      });
    }
  }, [user]);

  const setField = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const saveProfile = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);
    try {
      const patch: any = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          patch[k] = v;
        }
      });
      if (patch.monthly_income) patch.monthly_income = Number(patch.monthly_income);
      await updateProfile(patch);
      setEditing(false);
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg(e?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Profile</Text>

          {/* User Badge */}
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

          {successMsg ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {/* Personal Info Card (View & Edit) */}
          <View style={{ marginTop: spacing.lg }}>
            <Card>
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Ionicons name="card" size={20} color={colors.brandPrimary} />
                  <Text style={styles.cardHeaderTitle}>{editing ? "Edit Personal Info" : "Personal Info"}</Text>
                </View>
                {!editing ? (
                  <Pressable testID="profile-edit-button" onPress={() => setEditing(true)} style={styles.editBtn}>
                    <Ionicons name="pencil" size={15} color={colors.brandPrimary} />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setEditing(false)} style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>
                )}
              </View>

              {!editing ? (
                <View style={styles.infoGrid}>
                  <InfoItem label="Full Name" value={user?.name || "Not set"} />
                  <InfoItem label="Mobile Number" value={user?.mobile || "Not set"} />
                  <InfoItem label="Email" value={user?.email || "Not set"} />
                  <InfoItem label="PAN Card" value={user?.pan ? user.pan.toUpperCase() : "Not set"} />
                  <InfoItem label="Aadhaar Number" value={user?.aadhaar || "Not set"} />
                  <InfoItem label="City & State" value={user?.city || user?.state ? `${user?.city || "—"}, ${user?.state || "—"}` : "Not set"} />
                  <InfoItem label="Employment Type" value={user?.employment_type || "Not set"} />
                  <InfoItem label="Monthly Income" value={user?.monthly_income ? inr(user.monthly_income) : "Not set"} />
                  <InfoItem label="Company Name" value={user?.company_name || "Not set"} />
                </View>
              ) : (
                <View style={{ marginTop: spacing.md }}>
                  <Input label="Full Name" value={form.name} onChangeText={(v) => setField("name", v)} placeholder="e.g. Rahul Sharma" testID="edit-name" />
                  <Input label="Email Address" value={form.email} onChangeText={(v) => setField("email", v)} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" testID="edit-email" />
                  
                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Input label="PAN Card" value={form.pan} onChangeText={(v) => setField("pan", v.toUpperCase().slice(0, 10))} placeholder="ABCDE1234F" autoCapitalize="characters" testID="edit-pan" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="Aadhaar Number" value={form.aadhaar} onChangeText={(v) => setField("aadhaar", v.replace(/\D/g, "").slice(0, 12))} placeholder="123456789012" keyboardType="number-pad" testID="edit-aadhaar" />
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", gap: spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Input label="City" value={form.city} onChangeText={(v) => setField("city", v)} placeholder="Mumbai" testID="edit-city" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input label="State" value={form.state} onChangeText={(v) => setField("state", v)} placeholder="MH" testID="edit-state" />
                    </View>
                  </View>

                  <Input label="Monthly Income (₹)" value={form.monthly_income} onChangeText={(v) => setField("monthly_income", v.replace(/\D/g, ""))} placeholder="e.g. 75000" keyboardType="number-pad" testID="edit-income" />
                  <Input label="Company / Business Name" value={form.company_name} onChangeText={(v) => setField("company_name", v)} placeholder="e.g. TCS / Self" testID="edit-company" />

                  <Text style={styles.chipLabel}>Employment Type</Text>
                  <View style={styles.chipRow}>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <Pressable key={t} onPress={() => setField("employment_type", t)} style={[styles.chip, form.employment_type === t && styles.chipActive]} testID={`edit-emp-${t.toLowerCase().replace(/\s+/g, '-')}`}>
                        <Text style={[styles.chipText, form.employment_type === t && { color: "#fff" }]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                  <View style={{ marginTop: spacing.lg }}>
                    <Button title="Save Changes" loading={saving} onPress={saveProfile} testID="edit-save-button" />
                  </View>
                </View>
              )}
            </Card>
          </View>

          {/* Contact Persons */}
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionTitle}>Your Contact Persons</Text>
            <View style={{ gap: spacing.md }}>
              {[
                {
                  id: "ritik",
                  name: "Ritik Joshi",
                  title: "Contact Person",
                  phone: "+919826739349",
                  whatsapp: "+919826739349",
                  email: "ritik@splendidconsultants.in",
                },
                {
                  id: "koushiki",
                  name: "Koushiki Khandelwal",
                  title: "Contact Person",
                  phone: "+919301931777",
                  whatsapp: "+919301931777",
                  email: "koushiki@splendidconsultants.in",
                },
              ].map((rm) => (
                <Card key={rm.id}>
                  <View style={styles.rmRow}>
                    <View style={styles.rmAvatar}><Ionicons name="person-circle" size={48} color={colors.brandPrimary} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rmName}>{rm.name}</Text>
                      <Text style={styles.rmTitle}>{rm.title}</Text>
                      <Text style={styles.contact}>{rm.email}</Text>
                    </View>
                  </View>
                  <View style={styles.rmActions}>
                    <Pressable testID={`profile-rm-call-${rm.id}`} style={[styles.rmAction, { backgroundColor: colors.brandPrimary }]} onPress={() => openTel(rm.phone)}>
                      <Ionicons name="call" size={16} color="#fff" />
                      <Text style={[styles.rmActionText, { color: "#fff" }]}>Call</Text>
                    </Pressable>
                    <Pressable testID={`profile-rm-whatsapp-${rm.id}`} style={[styles.rmAction, { backgroundColor: colors.whatsapp }]} onPress={() => openWhatsApp("Hi TrueBorrow Team!", rm.whatsapp)}>
                      <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                      <Text style={[styles.rmActionText, { color: "#fff" }]}>WhatsApp</Text>
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          </View>

          {/* Links */}
          <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
            {[
              { id: "refer", label: "Refer & Earn", icon: "gift", route: "/refer" },
              { id: "promise", label: "Our Promise", icon: "ribbon", route: "/promise" },
              { id: "emi", label: "EMI Calculator", icon: "calculator", route: "/emi-calculator" },
            ].map((it) => (
              <Pressable key={it.id} testID={`profile-link-${it.id}`} style={styles.link} onPress={() => router.push(it.route as any)}>
                <Ionicons name={it.icon as any} size={20} color={colors.brandPrimary} />
                <Text style={styles.linkText}>{it.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.onSurfaceMuted} />
              </Pressable>
            ))}
          </View>

          {/* FAQs */}
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

          {/* Sign Out */}
          <View style={{ marginTop: spacing.xl }}>
            <Button title="Sign Out" variant="outline" testID="profile-sign-out" onPress={async () => { await signOut(); router.replace("/welcome"); }} />
          </View>
          <Text style={styles.footer}>Splendid Consultants · TrueBorrow v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5, marginBottom: spacing.lg },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  name: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurface },
  contact: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },

  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardHeaderTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, backgroundColor: colors.brandTertiary },
  editBtnText: { fontSize: fontSize.xs, fontWeight: "700", color: colors.brandPrimary },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  cancelBtnText: { fontSize: fontSize.xs, fontWeight: "700", color: colors.onSurfaceMuted },

  infoGrid: { gap: spacing.sm },
  infoItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.surfaceTertiary },
  infoLabel: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, fontWeight: "600" },
  infoValue: { fontSize: fontSize.sm, color: colors.onSurface, fontWeight: "700" },

  chipLabel: { fontSize: fontSize.xs, color: colors.onSurfaceSubtle, marginTop: spacing.md, marginBottom: spacing.xs, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.3 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurface, fontSize: fontSize.xs, fontWeight: "600" },

  successBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, backgroundColor: "#D1FAE5", borderRadius: radii.md, borderWidth: 1, borderColor: "#6EE7B7" },
  successText: { fontSize: fontSize.sm, color: "#065F46", fontWeight: "700" },
  errorText: { fontSize: fontSize.sm, color: colors.error, marginTop: spacing.md, fontWeight: "600" },

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
