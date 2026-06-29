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
    if (typeof window !== "undefined") return window.location.origin + "/auth/login";
    return "";
  }
  return ExpoLinking.createURL("auth");
}

export async function startGoogleAuth(): Promise<string | null> {
  const clientID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientID) {
    console.log("No EXPO_PUBLIC_GOOGLE_CLIENT_ID found, using mock auth.");
    return "mock_google_session";
  }

  const redirect = buildAuthRedirect();
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientID)}&redirect_uri=${encodeURIComponent(redirect)}&response_type=token&scope=${encodeURIComponent("openid email profile")}`;
  
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.location.href = authUrl;
    return null;
  }
  
  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirect);
  if (result.type !== "success" || !result.url) return null;
  
  const url = result.url;
  const match = url.match(/[#&]access_token=([^&]+)/);
  return decodeURIComponent(match?.[1] || "") || null;
}
