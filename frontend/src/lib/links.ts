import React from "react";
import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as ExpoLinking from "expo-linking";

export const RM_WHATSAPP = "919826739349"; // without '+'

export function openWhatsApp(message?: string) {
  const text = message ? encodeURIComponent(message) : "Hi%20Splendid%20Consultants%2C%20I%20would%20like%20to%20share%20my%20loan%20documents.";
  const url = `https://wa.me/${RM_WHATSAPP}?text=${text}`;
  Linking.openURL(url).catch(() => {});
}

export function openTel(phone: string) {
  Linking.openURL(`tel:${phone}`).catch(() => {});
}

export function buildAuthRedirect() {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") return window.location.origin + "/";
    return "";
  }
  return ExpoLinking.createURL("auth");
}

export async function startGoogleAuth(): Promise<string | null> {
  const redirect = buildAuthRedirect();
  const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.location.href = authUrl;
    return null;
  }
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirect);
  if (result.type !== "success" || !result.url) return null;
  // Parse session_id from hash or query
  const url = result.url;
  const hashMatch = url.match(/[#&]session_id=([^&]+)/);
  const queryMatch = url.match(/[?&]session_id=([^&]+)/);
  return decodeURIComponent((hashMatch || queryMatch)?.[1] || "") || null;
}
