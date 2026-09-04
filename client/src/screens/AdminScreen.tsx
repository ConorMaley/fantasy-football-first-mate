import { Link } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import { Divider, Text } from "react-native-paper";

import { FriendsSection } from "./admin/FriendsSection";
import { LeagueMembersSection } from "./admin/LeagueMembersSection";
import { LeaguesSection } from "./admin/LeaguesSection";

export function AdminScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>
        Admin
      </Text>
      <LeaguesSection />
      <Divider style={styles.divider} />
      <LeagueMembersSection />
      <Divider style={styles.divider} />
      <FriendsSection />
      <Link href="/health" style={styles.devLink}>
        Dev: health check
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48, gap: 8 },
  header: { marginBottom: 8 },
  divider: { marginVertical: 16 },
  devLink: { marginTop: 24, textAlign: "center", opacity: 0.5 },
});
