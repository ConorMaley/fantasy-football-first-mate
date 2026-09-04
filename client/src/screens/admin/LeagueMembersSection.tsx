import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, List, Text, TextInput } from "react-native-paper";

import {
  createLeagueMember,
  deleteLeagueMember,
  type League,
  type LeagueMember,
  listLeagueMembers,
  listLeagues,
  updateLeagueMember,
} from "../../api/admin";
import { Dropdown } from "../../components/Dropdown";

export function LeagueMembersSection() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [teamName, setTeamName] = useState("");
  const [managerName, setManagerName] = useState("");

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editManagerName, setEditManagerName] = useState("");

  useEffect(() => {
    listLeagues().then((data) => {
      setLeagues(data);
      setSelectedLeagueId((current) => current ?? data[0]?.id ?? null);
    });
  }, []);

  const refreshMembers = useCallback(async (leagueId: string) => {
    const data = await listLeagueMembers(leagueId);
    setMembers(data);
  }, []);

  useEffect(() => {
    if (selectedLeagueId) {
      refreshMembers(selectedLeagueId);
    } else {
      setMembers([]);
    }
  }, [selectedLeagueId, refreshMembers]);

  async function handleAddMember() {
    setError(null);
    if (!selectedLeagueId) {
      setError("Add a league first.");
      return;
    }
    try {
      await createLeagueMember(selectedLeagueId, {
        teamName: teamName.trim() || undefined,
        externalDisplayName: managerName.trim() || undefined,
      });
      setTeamName("");
      setManagerName("");
      await refreshMembers(selectedLeagueId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    }
  }

  async function handleSaveEdit(memberId: string) {
    await updateLeagueMember(memberId, {
      teamName: editTeamName.trim() || undefined,
      externalDisplayName: editManagerName.trim() || undefined,
    });
    setEditingMemberId(null);
    if (selectedLeagueId) await refreshMembers(selectedLeagueId);
  }

  async function handleDeleteMember(memberId: string) {
    await deleteLeagueMember(memberId);
    if (selectedLeagueId) await refreshMembers(selectedLeagueId);
  }

  const selectedLeague = leagues.find((l) => l.id === selectedLeagueId);

  return (
    <View>
      <Text variant="titleLarge">League Members</Text>

      <View style={styles.pickerRow}>
        <Dropdown
          label="Choose a league"
          selectedLabel={selectedLeague ? `${selectedLeague.name} (${selectedLeague.season})` : undefined}
          options={leagues.map((l) => ({ id: l.id, label: `${l.name} (${l.season})` }))}
          onSelect={setSelectedLeagueId}
          emptyLabel="Add a league first"
        />
      </View>

      {selectedLeagueId ? (
        <>
          <List.Section title="Members">
            {members.map((member) =>
              editingMemberId === member.id ? (
                <View key={member.id} style={styles.editCard}>
                  <TextInput mode="outlined" label="Team name" value={editTeamName} onChangeText={setEditTeamName} />
                  <TextInput
                    mode="outlined"
                    label="Manager name"
                    value={editManagerName}
                    onChangeText={setEditManagerName}
                  />
                  <View style={styles.rowActions}>
                    <Button onPress={() => handleSaveEdit(member.id)}>Save</Button>
                    <Button onPress={() => setEditingMemberId(null)}>Cancel</Button>
                  </View>
                </View>
              ) : (
                <List.Item
                  key={member.id}
                  title={member.teamName ?? "Unnamed team"}
                  description={member.externalDisplayName ?? undefined}
                  right={() => (
                    <View style={styles.rowActions}>
                      <IconButton
                        icon="pencil"
                        onPress={() => {
                          setEditingMemberId(member.id);
                          setEditTeamName(member.teamName ?? "");
                          setEditManagerName(member.externalDisplayName ?? "");
                        }}
                      />
                      <IconButton icon="delete" onPress={() => handleDeleteMember(member.id)} />
                    </View>
                  )}
                />
              ),
            )}
          </List.Section>

          <View style={styles.form}>
            <Text variant="titleMedium">Add a member</Text>
            <TextInput mode="outlined" label="Team name" value={teamName} onChangeText={setTeamName} />
            <TextInput mode="outlined" label="Manager name" value={managerName} onChangeText={setManagerName} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button mode="contained" onPress={handleAddMember}>
              Add member
            </Button>
          </View>
        </>
      ) : (
        <Text style={styles.hint}>Add a league above to start tracking its members.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pickerRow: { paddingHorizontal: 16, paddingVertical: 8 },
  rowActions: { flexDirection: "row", alignItems: "center" },
  editCard: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  form: { gap: 8, marginTop: 16 },
  error: { color: "#B3261E" },
  hint: { paddingHorizontal: 16, opacity: 0.6 },
});
