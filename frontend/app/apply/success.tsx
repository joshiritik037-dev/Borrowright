import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/src/components/Button";
import { colors, fontSize, radii, spacing } from "@/src/theme";

export default function Success() {
  const router = useRouter();
  const { application_id } = useLocalSearchParams<{ application_id: string }>();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={["top", "bottom"]}>
      <View style={styles.body}>
        <View style={styles.iconWrap}><Ionicons name="checkmark-circle" size={72} color={colors.success} /></View>
        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.sub}>Your loan application has been received. Your dedicated Relationship Manager will reach out within 24 hours.</Text>
        <View style={styles.appIdBox}>
          <Text style={styles.appIdLabel}>Application ID</Text>
          <Text style={styles.appId}>{application_id}</Text>
        </View>

        <View style={styles.stepsBox}>
          <Text style={styles.stepsTitle}>What's next?</Text>
          {["RM will call within 24 hours", "Document verification", "Bank login & legal", "Sanction & disbursement"].map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepDot}><Text style={styles.stepDotText}>{i + 1}</Text></View>
              <Text style={styles.stepLabel}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.ctaWrap}>
        <Button title="Track My Application" onPress={() => router.replace("/(tabs)/status")} testID="success-track-button" />
        <View style={{ height: spacing.sm }} />
        <Button title="Back to Home" variant="ghost" onPress={() => router.replace("/(tabs)")} testID="success-home-button" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center" },
  iconWrap: { marginBottom: spacing.lg },
  title: { fontSize: 30, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5, textAlign: "center" },
  sub: { fontSize: fontSize.md, color: colors.onSurfaceMuted, textAlign: "center", marginTop: spacing.sm, lineHeight: 22 },
  appIdBox: { marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.brandTertiary, borderRadius: radii.md, alignItems: "center" },
  appIdLabel: { fontSize: fontSize.xs, color: colors.brandPrimary, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  appId: { fontSize: fontSize.md, color: colors.brandPrimary, fontWeight: "800", marginTop: 4 },
  stepsBox: { marginTop: spacing.xl, alignSelf: "stretch", padding: spacing.lg, backgroundColor: colors.surfaceSecondary, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  stepsTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.onSurface, marginBottom: spacing.md },
  stepRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.sm },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brandPrimary, alignItems: "center", justifyContent: "center" },
  stepDotText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepLabel: { fontSize: fontSize.md, color: colors.onSurface, flex: 1 },
  ctaWrap: { padding: spacing.xl },
});
