import { IconButton } from "react-native-paper";

import { useSession } from "./SessionContext";

export function LogoutButton() {
  const { logout } = useSession();
  return <IconButton icon="logout" accessibilityLabel="Log out" onPress={() => logout()} />;
}
