import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, List, SegmentedButtons, Text, TextInput } from "react-native-paper";

import {
  createLeague,
  createLeagueGroup,
  deleteLeague,
  deleteLeagueGroup,
  type League,
  type LeagueGroup,
  listLeagueGroups,
  listLeagues,
  type Platform,
  renameLeagueGroup,
  updateLeague,
} from "../../api/admin";
import { Dropdown } from "../../components/Dropdown";

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "ESPN", label: "ESPN" },
  { value: "YAHOO", label: "Yahoo" },
  { value: "SLEEPER", label: "Sleeper" },
];

export function LeaguesSection() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [groups, setGroups] = useState<LeagueGroup[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [platform, setPlatform] = useState<Platform>("ESPN");
  const [externalLeagueId, setExternalLeagueId] = useState("");
  const [name, setName] = useState("");
  const [season, setSeason] = useState(String(new Date().getFullYear()));

  const [newGroupName, setNewGroupName] = useState("");

  const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSeason, setEditSeason] = useState("");

  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");

  const refresh = useCallback(async () => {
    const [leaguesData, groupsData] = await Promise.all([listLeagues(), listLeagueGroups()]);
    setLeagues(leaguesData);
    setGroups(groupsData);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAddLeague() {
    setError(null);
    const seasonNumber = Number(season);
    if (!externalLeagueId.trim() || !name.trim() || !Number.isInteger(seasonNumber)) {
      setError("Enter a league id, name, and a valid season.");
      return;
    }
    try {
      await createLeague({ platform, externalLeagueId: externalLeagueId.trim(), name: name.trim(), season: seasonNumber });
      setExternalLeagueId("");
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add league.");
    }
  }

  async function handleSaveEdit(leagueId: string) {
    const seasonNumber = Number(editSeason);
    if (!editName.trim() || !Number.isInteger(seasonNumber)) {
      setError("Enter a valid name and season.");
      return;
    }
    try {
      await updateLeague(leagueId, { name: editName.trim(), season: seasonNumber });
      setEditingLeagueId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update league.");
    }
  }

  async function handleDeleteLeague(leagueId: string) {
    await deleteLeague(leagueId);
    await refresh();
  }

  async function handleAssignGroup(leagueId: string, groupId: string | null) {
    await updateLeague(leagueId, { leagueGroupId: groupId });
    await refresh();
  }

  async function handleAddGroup() {
    if (!newGroupName.trim()) return;
    await createLeagueGroup(newGroupName.trim());
    setNewGroupName("");
    await refresh();
  }

  async function handleSaveGroupEdit(groupId: string) {
    if (!editGroupName.trim()) return;
    await renameLeagueGroup(groupId, editGroupName.trim());
    setEditingGroupId(null);
    await refresh();
  }

  async function handleDeleteGroup(groupId: string) {
    await deleteLeagueGroup(groupId);
    await refresh();
  }

  return (
    <View>
      <Text variant="titleLarge">Leagues & Groups</Text>

      <List.Section title="Groups">
        {groups.map((group) =>
          editingGroupId === group.id ? (
            <View key={group.id} style={styles.row}>
              <TextInput
                mode="outlined"
                style={styles.flex1}
                value={editGroupName}
                onChangeText={setEditGroupName}
              />
              <IconButton icon="check" onPress={() => handleSaveGroupEdit(group.id)} />
              <IconButton icon="close" onPress={() => setEditingGroupId(null)} />
            </View>
          ) : (
            <List.Item
              key={group.id}
              title={group.name}
              description={`${group.leagues?.length ?? 0} league(s)`}
              right={() => (
                <View style={styles.rowActions}>
                  <IconButton
                    icon="pencil"
                    onPress={() => {
                      setEditingGroupId(group.id);
                      setEditGroupName(group.name);
                    }}
                  />
                  <IconButton icon="delete" onPress={() => handleDeleteGroup(group.id)} />
                </View>
              )}
            />
          ),
        )}
        <View style={styles.row}>
          <TextInput
            mode="outlined"
            label="New group name"
            style={styles.flex1}
            value={newGroupName}
            onChangeText={setNewGroupName}
          />
          <Button mode="contained" onPress={handleAddGroup}>
            Add
          </Button>
        </View>
      </List.Section>

      <List.Section title="Your leagues">
        {leagues.map((league) =>
          editingLeagueId === league.id ? (
            <View key={league.id} style={styles.editCard}>
              <TextInput mode="outlined" label="Name" value={editName} onChangeText={setEditName} />
              <TextInput
                mode="outlined"
                label="Season"
                keyboardType="numeric"
                value={editSeason}
                onChangeText={setEditSeason}
              />
              <View style={styles.rowActions}>
                <Button onPress={() => handleSaveEdit(league.id)}>Save</Button>
                <Button onPress={() => setEditingLeagueId(null)}>Cancel</Button>
              </View>
            </View>
          ) : (
            <List.Item
              key={league.id}
              title={league.name}
              description={`${league.platform} · ${league.season} · ${league._count?.members ?? 0} member(s)${
                league.leagueGroup ? ` · ${league.leagueGroup.name}` : ""
              }`}
              right={() => (
                <View style={styles.rowActions}>
                  <Dropdown
                    label="Group"
                    options={[
                      { id: "__none__", label: "No group" },
                      ...groups.map((g) => ({ id: g.id, label: g.name })),
                    ]}
                    onSelect={(id) => handleAssignGroup(league.id, id === "__none__" ? null : id)}
                  />
                  <IconButton
                    icon="pencil"
                    onPress={() => {
                      setEditingLeagueId(league.id);
                      setEditName(league.name);
                      setEditSeason(String(league.season));
                    }}
                  />
                  <IconButton icon="delete" onPress={() => handleDeleteLeague(league.id)} />
                </View>
              )}
            />
          ),
        )}
      </List.Section>

      <View style={styles.form}>
        <Text variant="titleMedium">Add a league</Text>
        <SegmentedButtons
          value={platform}
          onValueChange={(value) => setPlatform(value as Platform)}
          buttons={PLATFORM_OPTIONS}
        />
        <TextInput mode="outlined" label="League name" value={name} onChangeText={setName} />
        <TextInput
          mode="outlined"
          label="External league id"
          value={externalLeagueId}
          onChangeText={setExternalLeagueId}
        />
        <TextInput mode="outlined" label="Season" keyboardType="numeric" value={season} onChangeText={setSeason} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button mode="contained" onPress={handleAddLeague}>
          Add league
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  rowActions: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  editCard: { gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  form: { gap: 8, marginTop: 16 },
  error: { color: "#B3261E" },
});
