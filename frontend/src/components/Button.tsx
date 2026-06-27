import React from "react";
import { Pressable, Text, View, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { colors, radii, spacing, fontSize, shadow } from "@/src/theme";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "whatsapp" | "dark";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  testID,
  style,
  textStyle,
  fullWidth = true,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  testID?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}) {
  const isDisabled = disabled || loading;
  const containerStyle: ViewStyle[] = [styles.base, fullWidth ? styles.full : styles.auto];
  let textColor = "#fff";
  if (variant === "primary") containerStyle.push(styles.primary);
  if (variant === "secondary") { containerStyle.push(styles.secondary); textColor = colors.brandPrimary; }
  if (variant === "ghost") { containerStyle.push(styles.ghost); textColor = colors.brandPrimary; }
  if (variant === "outline") { containerStyle.push(styles.outline); textColor = colors.brandPrimary; }
  if (variant === "whatsapp") containerStyle.push(styles.whatsapp);
  if (variant === "dark") containerStyle.push(styles.dark);
  if (isDisabled) containerStyle.push(styles.disabled);
  if (style) containerStyle.push(style);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={{ color: "rgba(255,255,255,0.15)" }}
      style={({ pressed }) => [...containerStyle, pressed && !isDisabled && { transform: [{ scale: 0.985 }] }]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : (
        <View style={styles.row}>
          {icon ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    ...shadow.cta,
  },
  full: { alignSelf: "stretch" },
  auto: { alignSelf: "flex-start" },
  row: { flexDirection: "row", alignItems: "center" },
  text: { fontSize: fontSize.lg, fontWeight: "700", letterSpacing: 0.2 },
  primary: { backgroundColor: colors.brandPrimary },
  secondary: { backgroundColor: colors.brandTertiary, shadowOpacity: 0 },
  ghost: { backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
  outline: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.brandPrimary, shadowOpacity: 0, elevation: 0 },
  whatsapp: { backgroundColor: colors.whatsapp },
  dark: { backgroundColor: colors.surfaceInverse },
  disabled: { opacity: 0.5 },
});
