import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { colors, radii, spacing, shadow } from "@/src/theme";

export function Card({ children, style, testID, dark }: { children: React.ReactNode; style?: ViewStyle; testID?: string; dark?: boolean }) {
  return (
    <View testID={testID} style={[styles.card, dark && styles.dark, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  dark: {
    backgroundColor: colors.surfaceInverse,
    borderColor: "rgba(255,255,255,0.08)",
  },
});
