import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card } from "@/src/components/Card";
import { Input } from "@/src/components/Input";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";
import { inr, inrShort } from "@/src/lib/finance";

type Bank = { id: string; name: string; initials: string; interest_rate: number; processing_fee_pct: number; max_tenure: number; processing_fee: number; estimated_emi: number; best_value: boolean };

export default function BankCompare() {
  const router = useRouter();
  const [amount, setAmount] = useState("5000000");
  const [years, setYears] = useState("20");
  const [banks, setBanks] = useState<Bank[]>([]);

  useEffect(() => {
    api.get<Bank[]>(`/banks?amount=${amount}&tenure=${years}`).then(setBanks).catch(() => {});
  }, [amount, years]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} testID="compare-back"><Ionicons name="chevron-back" size={22} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>Compare Banks</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <View style={{ flex: 1 }}><Input label="Amount (₹)" testID="compare-amount" value={amount} onChangeText={(v) => setAmount(v.replace(/\D/g, ""))} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Input label="Tenure (yrs)" testID="compare-tenure" value={years} onChangeText={(v) => setYears(v.replace(/\D/g, "").slice(0, 2))} keyboardType="number-pad" /></View>
        </View>

        <View style={{ gap: spacing.md }}>
          {banks.map((b) => (
            <View key={b.id} testID={`bank-card-${b.id}`}>
              <Card style={b.best_value ? styles.bestCard : undefined}>
                {b.best_value && <View style={styles.bestBadge}><Ionicons name="star" size={12} color={colors.warning} /><Text style={styles.bestBadgeText}>BEST VALUE</Text></View>}
                <View style={styles.bankRow}>
                  <View style={[styles.initials, b.best_value && { backgroundColor: colors.brandPrimary }]}><Text style={[styles.initialsText, b.best_value && { color: "#fff" }]}>{b.initials}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankName}>{b.name}</Text>
                    <Text style={styles.bankRate}>{b.interest_rate}% interest · {b.max_tenure}y max</Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statCol}><Text style={styles.statK}>Monthly EMI</Text><Text style={styles.statV}>{inr(b.estimated_emi)}</Text></View>
                  <View style={styles.statCol}><Text style={styles.statK}>Processing Fee</Text><Text style={styles.statV}>{inrShort(b.processing_fee)}</Text></View>
                  <View style={styles.statCol}><Text style={styles.statK}>Rate</Text><Text style={styles.statV}>{b.interest_rate}%</Text></View>
                </View>
              </Card>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  back: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  headerTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.onSurface },
  bestCard: { borderColor: colors.brandPrimary, borderWidth: 2 },
  bestBadge: { flexDirection: "row", alignSelf: "flex-start", gap: 6, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.warningSoft, borderRadius: radii.pill, marginBottom: spacing.md },
  bestBadgeText: { color: colors.goldDark, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  bankRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  initials: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  initialsText: { color: colors.brandPrimary, fontWeight: "800", fontSize: fontSize.sm, letterSpacing: 0.5 },
  bankName: { fontSize: fontSize.lg, fontWeight: "800", color: colors.onSurface },
  bankRate: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },
  statsRow: { flexDirection: "row", marginTop: spacing.md, gap: spacing.sm },
  statCol: { flex: 1, padding: spacing.sm, backgroundColor: colors.surfaceTertiary, borderRadius: radii.sm, alignItems: "center" },
  statK: { fontSize: 10, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  statV: { fontSize: fontSize.md, color: colors.onSurface, fontWeight: "800", marginTop: 2 },
});
