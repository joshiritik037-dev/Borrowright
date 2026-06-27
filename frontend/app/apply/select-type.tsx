import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, fontSize, radii, spacing } from "@/src/theme";
import { api } from "@/src/lib/api";

type LoanType = { id: string; name: string; icon: string; desc: string };
const ICONS: Record<string, any> = { home: "home", lap: "business", car: "car-sport", personal: "wallet", business: "briefcase", construction: "construct", working_capital: "trending-up", other: "ellipsis-horizontal-circle" };

export default function SelectType() {
  const [types, setTypes] = useState<LoanType[]>([]);
  const router = useRouter();
  useEffect(() => { api.get<LoanType[]>("/loan-types").then(setTypes).catch(() => {}); }, []);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back} testID="apply-back"><Ionicons name="chevron-back" size={22} color={colors.onSurface} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choose loan type</Text>
        <Text style={styles.sub}>What kind of loan are you looking for?</Text>
        <View style={styles.grid}>
          {types.map((t) => (
            <Pressable key={t.id} testID={`apply-type-${t.id}`} style={styles.card} onPress={() => router.push({ pathname: "/apply/requirement", params: { loan_type: t.id, name: t.name } })}>
              <View style={styles.iconWrap}><Ionicons name={ICONS[t.id] || "wallet"} size={24} color={colors.brandPrimary} /></View>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={styles.desc}>{t.desc}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  back: { width: 40, height: 40, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceTertiary },
  title: { fontSize: 28, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5, marginTop: spacing.lg },
  sub: { fontSize: fontSize.md, color: colors.onSurfaceMuted, marginTop: 4, marginBottom: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: { width: "47.7%", padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  name: { fontSize: fontSize.lg, fontWeight: "700", color: colors.onSurface },
  desc: { fontSize: fontSize.sm, color: colors.onSurfaceMuted, marginTop: 2 },
});
