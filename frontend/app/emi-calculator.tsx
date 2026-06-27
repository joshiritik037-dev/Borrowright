import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Card } from "@/src/components/Card";
import { Input } from "@/src/components/Input";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { computeEmi, inr, inrShort } from "@/src/lib/finance";

export default function EmiCalculator() {
  const router = useRouter();
  const [amount, setAmount] = useState("5000000");
  const [rate, setRate] = useState("8.5");
  const [years, setYears] = useState("20");

  const out = useMemo(() => {
    const a = Number(amount) || 0;
    const r = Number(rate) || 0;
    const y = Number(years) || 0;
    return computeEmi(a, r, y);
  }, [amount, rate, years]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} testID="emi-back"><Ionicons name="chevron-back" size={22} color={colors.onSurface} /></Pressable>
        <Text style={styles.headerTitle}>EMI Calculator</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.label}>Monthly EMI</Text>
          <Text style={styles.emi}>{inr(out.emi)}</Text>
          <View style={styles.row}>
            <View style={styles.col}><Text style={styles.k}>Interest</Text><Text style={styles.v}>{inrShort(out.interest)}</Text></View>
            <View style={styles.col}><Text style={styles.k}>Total Payable</Text><Text style={styles.v}>{inrShort(out.total)}</Text></View>
          </View>
        </Card>

        <View style={{ height: spacing.lg }} />

        <Input label="Loan Amount (₹)" testID="emi-amount" value={amount} onChangeText={(v) => setAmount(v.replace(/\D/g, ""))} keyboardType="number-pad" />
        <Input label="Interest Rate (% p.a.)" testID="emi-rate" value={rate} onChangeText={(v) => setRate(v.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" />
        <Input label="Tenure (Years)" testID="emi-tenure" value={years} onChangeText={(v) => setYears(v.replace(/\D/g, "").slice(0, 2))} keyboardType="number-pad" />

        <View style={styles.chipRow}>
          {[10, 15, 20, 25, 30].map((y) => (
            <Pressable key={y} onPress={() => setYears(String(y))} testID={`emi-yr-${y}`} style={[styles.chip, Number(years) === y && styles.chipActive]}>
              <Text style={[styles.chipText, Number(years) === y && { color: "#fff" }]}>{y}y</Text>
            </Pressable>
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
  label: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  emi: { fontSize: 42, fontWeight: "800", color: colors.brandPrimary, letterSpacing: -1, marginTop: spacing.xs },
  row: { flexDirection: "row", marginTop: spacing.lg, gap: spacing.lg },
  col: { flex: 1, padding: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radii.md },
  k: { fontSize: fontSize.xs, color: colors.brandPrimary, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  v: { fontSize: fontSize.lg, color: colors.onSurface, fontWeight: "800", marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, height: 36, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceSecondary },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.onSurface, fontWeight: "600", fontSize: fontSize.sm },
});
