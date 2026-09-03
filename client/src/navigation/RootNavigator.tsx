import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useSession } from "../auth/SessionContext";
import { OnboardingNameScreen } from "../auth/screens/OnboardingNameScreen";
import { OtpEntryScreen } from "../auth/screens/OtpEntryScreen";
import { PasswordEntryScreen } from "../auth/screens/PasswordEntryScreen";
import { WelcomeScreen } from "../auth/screens/WelcomeScreen";
import type { AuthStackParamList } from "../auth/types";
import { AppStack } from "./AppStack";

const Stack = createNativeStackNavigator<AuthStackParamList>();

function AuthStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="OtpEntry" component={OtpEntryScreen} />
      <Stack.Screen name="PasswordEntry" component={PasswordEntryScreen} />
    </Stack.Navigator>
  );
}

export function RootNavigator() {
  const { status, user } = useSession();

  let content;
  if (status === "loading") {
    content = (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  } else if (status === "unauthenticated") {
    content = <AuthStackNavigator />;
  } else if (user && !user.displayName) {
    content = <OnboardingNameScreen />;
  } else {
    content = <AppStack />;
  }

  return <NavigationContainer>{content}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
});
