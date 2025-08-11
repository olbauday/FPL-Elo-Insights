// Utility to generate CSV file paths for FPL-Elo-Insights data
export type DataType = 'playerstats' | 'players' | 'teams' | 'matches' | 'fixtures' | 'playermatchstats';

interface CsvPathOptions {
  season?: string; // e.g. '2025-2026'
  gameweek?: number; // e.g. 1
  tournament?: string; // e.g. 'Premier League'
  dataType: DataType;
}

export function getCsvPath({ season = '2025-2026', gameweek, tournament, dataType }: CsvPathOptions): string {
  if (gameweek !== undefined) {
    // For 2024-2025 season, matches are organized differently
    if (season === '2024-2025' && dataType === 'matches') {
      return `/data/${season}/matches/GW${gameweek}/matches.csv`;
    }
    // By Gameweek (for 2025-2026 structure)
    return `/data/${season}/By Gameweek/GW${gameweek}/${dataType}.csv`;
  }
  if (tournament) {
    // By Tournament
    return `/data/${season}/By Tournament/${tournament}/${dataType}.csv`;
  }
  // Master file - handle different structures
  if (season === '2024-2025') {
    return `/data/${season}/${dataType}/${dataType}.csv`;
  }
  return `/data/${season}/${dataType}.csv`;
}
