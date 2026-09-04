import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Banner } from "react-native-paper";

import { useSession } from "./SessionContext";

const AUTH_ROUTES = new Set(["welcome", "otp", "password"]);
const ONBOARDING_ROUTE = "onboarding-name";

/**
 * Owns the Auth vs. App routing decision for the whole app: redirects an
 * unauthenticated visitor to /welcome, a freshly-signed-up user with no
 * displayName to /onboarding-name, and a fully authenticated user away from
 * either back to the app. Renders the dismissible "verify your email" nag
 * above every authenticated route, per the auth PRD.
 */
export function AuthGate() {
  const { status, user } = useSession();
  const segments = useSegments();
  const router = useRouter();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const currentRoute = segments[0];
  const inAuthRoute = currentRoute !== undefined && AUTH_ROUTES.has(currentRoute);
  const inOnboarding = currentRoute === ONBOARDING_ROUTE;

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      if (!inAuthRoute) {
        router.replace("/welcome");
      }
      return;
    }

    if (!user?.displayName) {
      if (!inOnboarding) {
        router.replace(`/${ONBOARDING_ROUTE}`);
      }
      return;
    }

    if (inAuthRoute || inOnboarding) {
      router.replace("/");
    }
  }, [status, user, inAuthRoute, inOnboarding, router]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  const showVerifyBanner = status === "authenticated" && user && !user.emailVerified && !bannerDismissed;

  return (
    <>
      {showVerifyBanner ? (
        <Banner
          visible
          actions={[{ label: "Dismiss", onPress: () => setBannerDismissed(true) }]}
        >
          Verify your email — check your inbox for a link.
        </Banner>
      ) : null}
      <Stack />
    </>
  );
}
