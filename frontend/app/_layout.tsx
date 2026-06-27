import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
import { api } from "@/src/lib/api";

LogBox.ignoreAllLogs(true);
SplashScreen.preventAutoHideAsync();

// --- Push notifications (module scope) ---
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    } as any),
  });
}
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
  });
}

async function registerForPush(user_id: string) {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const tokenResp = await Notifications.getDevicePushTokenAsync();
    await api.post("/register-push", {
      user_id,
      platform: Platform.OS,
      device_token: tokenResp.data,
    });
  } catch {
    // non-blocking
  }
}

function RootGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const first = segments[0] ?? "";
    const inAuth = first === "auth";
    // Pages that require an authenticated AND onboarded user
    const inProtected = first === "(tabs)" || first === "apply" || first === "onboarding";

    if (!user) {
      if (inProtected) router.replace("/welcome");
    } else if (!user.onboarded && first === "(tabs)") {
      router.replace("/onboarding");
    } else if (user.onboarded && (inAuth || first === "welcome" || first === "")) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments, router]);

  useEffect(() => {
    if (user?.user_id) registerForPush(user.user_id);
  }, [user?.user_id]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useIconFonts();
  const router = useRouter();

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data as any) || {};
      const url = data.deeplink || data.action_url;
      if (!url) return;
      if (typeof url === "string" && url.startsWith("http")) Linking.openURL(url);
      else if (typeof url === "string") router.push(url as any);
    });
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = (response.notification.request.content.data as any) || {};
      const url = data.deeplink || data.action_url;
      if (!url) return;
      if (typeof url === "string" && url.startsWith("http")) Linking.openURL(url);
      else if (typeof url === "string") router.push(url as any);
    });
    return () => { tapSub.remove(); };
  }, [router]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootGate />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FAFAFA" } }} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
