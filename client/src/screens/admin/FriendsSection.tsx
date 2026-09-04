import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Chip, IconButton, List, Text, TextInput } from "react-native-paper";

import {
  createCrewmate,
  type Crewmate,
  deleteCrewmate,
  type League,
  type LeagueMember,
  listCrewmates,
  listLeagueMembers,
  listLeagues,
  searchUsers,
  tagLeagueMember,
  untagLeagueMember,
  updateCrewmate,
  type UserSummary,
} from "../../api/admin";
import { Dropdown } from "../../components/Dropdown";

type LeagueMemberWithLeague = LeagueMember & { league: League };

export function FriendsSection() {
  const [crewmates, setCrewmates] = useState<Crewmate[]>([]);
  const [allLeagueMembers, setAllLeagueMembers] = useState<LeagueMemberWithLeague[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSummary[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<UserSummary | null>(null);

  const [editingCrewmateId, setEditingCrewmateId] = useState<string | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");

  const [expandedCrewmateId, setExpandedCrewmateId] = useState<string | null>(null);

  const refreshCrewmates = useCallback(async () => {
    const data = await listCrewmates();
    setCrewmates(data);
  }, []);

  const refreshLeagueMembers = useCallback(async () => {
    const leagues = await listLeagues();
    const membersByLeague = await Promise.all(
      leagues.map(async (league) => {
        const members = await listLeagueMembers(league.id);
        return members.map((member) => ({ ...member, league }));
      }),
    );
    setAllLeagueMembers(membersByLeague.flat());
  }, []);

  useEffect(() => {
    refreshCrewmates();
    refreshLeagueMembers();
  }, [refreshCrewmates, refreshLeagueMembers]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchUsers(query)
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  async function handleAddCrewmate() {
    setError(null);
    if (!displayName.trim()) {
      setError("Enter a friend's name.");
      return;
    }
    try {
      await createCrewmate({ displayName: displayName.trim(), userId: selectedMatch?.id ?? null });
      setDisplayName("");
      setSearchQuery("");
      setSelectedMatch(null);
      setSearchResults([]);
      await refreshCrewmates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add friend.");
    }
  }

  async function handleSaveEdit(crewmateId: string) {
    if (!editDisplayName.trim()) return;
    await updateCrewmate(crewmateId, { displayName: editDisplayName.trim() });
    setEditingCrewmateId(null);
    await refreshCrewmates();
  }

  async function handleDeleteCrewmate(crewmateId: string) {
    await deleteCrewmate(crewmateId);
    await refreshCrewmates();
  }

  async function handleTag(crewmateId: string, leagueMemberId: string) {
    await tagLeagueMember(crewmateId, leagueMemberId);
    await refreshCrewmates();
  }

  async function handleUntag(crewmateId: string, leagueMemberId: string) {
    await untagLeagueMember(crewmateId, leagueMemberId);
    await refreshCrewmates();
  }

  return (
    <View>
      <Text variant="titleLarge">Friends</Text>

      <List.Section title="Your crewmates">
        {crewmates.map((crewmate) => {
          const taggedIds = new Set(crewmate.leagueMembers.map((link) => link.leagueMemberId));
          const untaggedMembers = allLeagueMembers.filter((member) => !taggedIds.has(member.id));
          const expanded = expandedCrewmateId === crewmate.id;

          return (
            <View key={crewmate.id}>
              {editingCrewmateId === crewmate.id ? (
                <View style={styles.row}>
                  <TextInput
                    mode="outlined"
                    style={styles.flex1}
                    value={editDisplayName}
                    onChangeText={setEditDisplayName}
                  />
                  <IconButton icon="check" onPress={() => handleSaveEdit(crewmate.id)} />
                  <IconButton icon="close" onPress={() => setEditingCrewmateId(null)} />
                </View>
              ) : (
                <List.Item
                  title={crewmate.displayName}
                  description={crewmate.user ? `Matched to ${crewmate.user.displayName}` : "Not matched to an account"}
                  onPress={() => setExpandedCrewmateId(expanded ? null : crewmate.id)}
                  right={() => (
                    <View style={styles.rowActions}>
                      <IconButton
                        icon="pencil"
                        onPress={() => {
                          setEditingCrewmateId(crewmate.id);
                          setEditDisplayName(crewmate.displayName);
                        }}
                      />
                      <IconButton icon="delete" onPress={() => handleDeleteCrewmate(crewmate.id)} />
                    </View>
                  )}
                />
              )}

              {expanded ? (
                <View style={styles.expanded}>
                  <Text variant="labelLarge">Assigned teams</Text>
                  <View style={styles.chipRow}>
                    {crewmate.leagueMembers.length === 0 ? (
                      <Text style={styles.hint}>No teams tagged yet.</Text>
                    ) : (
                      crewmate.leagueMembers.map((link) => (
                        <Chip
                          key={link.id}
                          onClose={() => handleUntag(crewmate.id, link.leagueMemberId)}
                          style={styles.chip}
                        >
                          {(link.leagueMember.teamName ?? "Unnamed team") +
                            ` · ${link.leagueMember.league.name} (${link.leagueMember.league.season})`}
                        </Chip>
                      ))
                    )}
                  </View>
                  <Dropdown
                    label="Tag a team"
                    options={untaggedMembers.map((member) => ({
                      id: member.id,
                      label: `${member.teamName ?? "Unnamed team"} · ${member.league.name} (${member.league.season})`,
                    }))}
                    onSelect={(memberId) => handleTag(crewmate.id, memberId)}
                    emptyLabel="No more teams to tag"
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </List.Section>

      <View style={styles.form}>
        <Text variant="titleMedium">Add a friend</Text>
        <TextInput mode="outlined" label="Friend's name" value={displayName} onChangeText={setDisplayName} />
        <TextInput
          mode="outlined"
          label="Match to an existing First Mate user (optional)"
          value={selectedMatch ? selectedMatch.displayName : searchQuery}
          onChangeText={(text) => {
            setSelectedMatch(null);
            setSearchQuery(text);
          }}
        />
        {searchResults.length > 0 && !selectedMatch ? (
          <View style={styles.searchResults}>
            {searchResults.map((user) => (
              <List.Item
                key={user.id}
                title={user.displayName}
                description={user.email}
                onPress={() => {
                  setSelectedMatch(user);
                  setSearchResults([]);
                }}
              />
            ))}
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button mode="contained" onPress={handleAddCrewmate}>
          Add friend
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  rowActions: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  expanded: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { marginBottom: 4 },
  form: { gap: 8, marginTop: 16 },
  error: { color: "#B3261E" },
  hint: { opacity: 0.6 },
  searchResults: { borderWidth: StyleSheet.hairlineWidth, borderColor: "#ccc", borderRadius: 4 },
});
