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
    // Gameweek-scoped files
    if (dataType === 'matches' || dataType === 'fixtures') {
      // 2024-2025 uses /matches/GW#/matches.csv
      if (season === '2024-2025') {
        return `/data/${season}/matches/GW${gameweek}/matches.csv`;
      }
      // 2025-2026 uses /By Gameweek/GW#/fixtures.csv
      return `/data/${season}/By Gameweek/GW${gameweek}/fixtures.csv`;
    }
    // Other By Gameweek datasets
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
