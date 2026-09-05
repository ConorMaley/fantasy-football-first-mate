import { DataTable, Text } from "react-native-paper";

import type { StandingRow } from "../api/types";

function teamLabel(row: StandingRow): string {
  return row.teamName ?? row.externalDisplayName ?? "Unnamed team";
}

export function StandingsTable({ standings }: { standings: StandingRow[] }) {
  return (
    <DataTable>
      <DataTable.Header>
        <DataTable.Title style={{ flex: 0.3 }}>#</DataTable.Title>
        <DataTable.Title>Team</DataTable.Title>
        <DataTable.Title numeric>W-L-T</DataTable.Title>
        <DataTable.Title numeric>PF</DataTable.Title>
        <DataTable.Title numeric>PA</DataTable.Title>
      </DataTable.Header>
      {standings.map((row) => (
        <DataTable.Row key={row.leagueMemberId}>
          <DataTable.Cell style={{ flex: 0.3 }}>{row.rank ?? "—"}</DataTable.Cell>
          <DataTable.Cell>
            <Text numberOfLines={1}>{teamLabel(row)}</Text>
          </DataTable.Cell>
          <DataTable.Cell numeric>
            {row.wins}-{row.losses}-{row.ties}
          </DataTable.Cell>
          <DataTable.Cell numeric>{row.pointsFor.toFixed(1)}</DataTable.Cell>
          <DataTable.Cell numeric>{row.pointsAgainst.toFixed(1)}</DataTable.Cell>
        </DataTable.Row>
      ))}
    </DataTable>
  );
}
