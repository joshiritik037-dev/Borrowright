import React from "react";
import { TextInput, View, Text, StyleSheet, TextInputProps } from "react-native";
import { colors, radii, spacing, fontSize } from "@/src/theme";

export function Input({
  label,
  error,
  testID,
  ...props
}: TextInputProps & { label?: string; error?: string; testID?: string }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        testID={testID}
        placeholderTextColor={colors.onSurfaceMuted}
        style={[styles.input, error ? styles.inputError : null]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.sm, color: colors.onSurfaceSubtle, marginBottom: spacing.sm, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  input: {
    height: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.lg,
    color: colors.onSurface,
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: fontSize.sm, marginTop: spacing.xs },
});
