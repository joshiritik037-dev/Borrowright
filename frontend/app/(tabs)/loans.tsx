import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "@/src/components/Card";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";

type LoanType = { id: string; name: string; icon: string; desc: string };

const ICONS: Record<string, any> = {
  home: "home", lap: "business", car: "car-sport", personal: "wallet",
  business: "briefcase", construction: "construct", working_capital: "trending-up", other: "ellipsis-horizontal-circle",
};

export default function Loans() {
  const [types, setTypes] = useState<LoanType[]>([]);
  const router = useRouter();

  useEffect(() => { api.get<LoanType[]>("/loan-types").then(setTypes).catch(() => {}); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Explore Loans</Text>
        <Text style={styles.sub}>Pick a category to apply, calculate, or compare banks.</Text>

        <View style={styles.grid}>
          {types.map((t) => (
            <Pressable
              key={t.id}
              testID={`loan-type-${t.id}`}
              style={styles.card}
              onPress={() => router.push({ pathname: "/apply/requirement", params: { loan_type: t.id, name: t.name } })}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={ICONS[t.id] || "wallet"} size={26} color={colors.brandPrimary} />
              </View>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={styles.desc}>{t.desc}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={[styles.iconWrap, { backgroundColor: colors.warningSoft }]}>
                <Ionicons name="calculator" size={22} color={colors.goldDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calcTitle}>EMI Calculator</Text>
                <Text style={styles.desc}>Estimate your monthly payment in seconds</Text>
              </View>
            </View>
            <View style={{ height: spacing.md }} />
            <Button title="Open Calculator" testID="open-emi-calculator" onPress={() => router.push("/emi-calculator")} />
          </Card>
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View style={[styles.iconWrap, { backgroundColor: colors.brandTertiary }]}>
                <Ionicons name="git-compare" size={22} color={colors.brandPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calcTitle}>Compare Banks</Text>
                <Text style={styles.desc}>See rates, fees & EMI side-by-side</Text>
              </View>
            </View>
            <View style={{ height: spacing.md }} />
            <Button title="View Comparison" variant="outline" testID="open-bank-compare" onPress={() => router.push("/bank-compare")} />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  sub: { fontSize: fontSize.md, color: colors.onSurfaceMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: "47.7%", padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  name: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurface },
  desc: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2, lineHeight: 18 },
  calcTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurface },
});
