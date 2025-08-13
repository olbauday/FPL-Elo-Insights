import os
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# --- Configuration ---
SEASON = "2025-2026"
TOURNAMENT_NAME_MAP = {
    'friendly': 'Friendlies',
    'premier-league': 'Premier League',
    'champions-league': 'Champions League',
    'prem': 'Premier League',
    'community-shield': 'Community Shield',
    'uefa-super-cup' : 'Uefa Super Cup'
}

# --- Setup: Load Environment Variables and Connect to Supabase ---
load_dotenv()
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("FATAL ERROR: SUPABASE_URL and SUPABASE_KEY must be set in your environment or a .env file.")
    exit()

supabase: Client = create_client(url, key)

# --- Helper Functions ---

def create_directory(path: str):
    Path(path).mkdir(parents=True, exist_ok=True)

def get_tournament_name_from_id(match_id: str, name_map: dict) -> str:
    """Finds the correct tournament name from a match_id string."""
    # Sort keys by length, descending, to match 'premier-league' before 'league'
    for slug, name in sorted(name_map.items(), key=lambda item: len(item[0]), reverse=True):
        if slug in match_id:
            return name
    # Fallback if no match is found
    return "Other"

def fetch_all_records(table_name: str) -> pd.DataFrame:
    """Fetches all records from a table without any filters."""
    print(f"Fetching all records from master table: '{table_name}'...")
    try:
        # A larger page size can be used for bulk fetching
        response = supabase.table(table_name).select('*', count='exact').execute()
        df = pd.DataFrame(response.data)
        print(f"  > Fetched {len(df)} total rows from '{table_name}'.")
        return df
    except Exception as e:
        print(f"  ERROR fetching from '{table_name}': {e}")
        return pd.DataFrame()

def get_latest_finished_gameweek() -> int:
    print("Querying database for the latest finished gameweek...")
    try:
        response = supabase.table('matches').select('gameweek').eq('finished', True).execute()
        if not response.data:
            print("  > No finished gameweeks found. Starting fresh from Gameweek 1.")
            return 1
        finished_gameweeks = [item['gameweek'] for item in response.data if item.get('gameweek') is not None]
        if not finished_gameweeks:
            print("  > No valid gameweeks in finished matches. Starting from Gameweek 1.")
            return 1
        latest_gw = max(finished_gameweeks)
        print(f"  > Latest finished gameweek found: {latest_gw}. Processing from this week onwards.")
        return latest_gw
    except Exception as e:
        print(f"  ERROR: Could not fetch latest gameweek: {e}. Defaulting to Gameweek 1.")
        return 1

def fetch_data_since_gameweek(table_name: str, start_gameweek: int, gameweek_col: str = 'gameweek') -> pd.DataFrame:
    print(f"Fetching data from '{table_name}' for GW{start_gameweek} onwards...")
    try:
        response = supabase.table(table_name).select('*').gte(gameweek_col, start_gameweek).execute()
        df = pd.DataFrame(response.data)
        print(f"  > Fetched {len(df)} rows from '{table_name}'.")
        return df
    except Exception as e:
        print(f"  ERROR fetching from '{table_name}': {e}")
        return pd.DataFrame()

def fetch_data_by_ids(table_name: str, column: str, ids: list) -> pd.DataFrame:
    if not ids: return pd.DataFrame()
    print(f"Fetching {len(ids)} related records from '{table_name}' using '{column}'...")
    all_data = []
    chunk_size = 500
    for i in range(0, len(ids), chunk_size):
        chunk_ids = ids[i:i + chunk_size]
        try:
            response = supabase.table(table_name).select('*').in_(column, chunk_ids).execute()
            all_data.extend(response.data)
        except Exception as e:
            print(f"  ERROR fetching chunk from '{table_name}': {e}")
    df = pd.DataFrame(all_data)
    print(f"  > Fetched {len(df)} total rows from '{table_name}'.")
    return df

def update_csv(df: pd.DataFrame, file_path: str, unique_cols: list):
    if df.empty: return
    create_directory(os.path.dirname(file_path))
    if os.path.exists(file_path):
        existing_df = pd.read_csv(file_path)
        combined_df = pd.concat([existing_df, df])
    else:
        combined_df = df
    updated_df = combined_df.drop_duplicates(subset=unique_cols, keep='last')
    updated_df.to_csv(file_path, index=False)


def main():
    """Main function to run the entire data export and processing pipeline."""
    season_path = os.path.join('data', SEASON)
    print(f"--- Starting Automated Data Update for Season {SEASON} ---")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")

    # --- Fetch ALL master data first. ---
    all_players_df = fetch_all_records('players')
    all_teams_df = fetch_all_records('teams')
    all_player_stats_df = fetch_all_records('playerstats')

    # --- Determine recent gameweeks and fetch ALL recent matches (finished and not finished) ---
    start_gameweek = get_latest_finished_gameweek()
    matches_df = fetch_data_since_gameweek('matches', start_gameweek)
    
    # NEW: Remove unwanted columns right after fetching
    matches_df = matches_df.drop(columns=['match_url', 'fotmob_id'], errors='ignore')

    # Exit early if there are no matches at all to process.
    if matches_df.empty:
        print("\nNo recent match data found (neither finished nor upcoming). Updating master files only.")
        update_csv(all_players_df, os.path.join(season_path, 'players.csv'), unique_cols=['player_id'])
        update_csv(all_teams_df, os.path.join(season_path, 'teams.csv'), unique_cols=['id'])
        update_csv(all_player_stats_df, os.path.join(season_path, 'playerstats.csv'), unique_cols=['id', 'gw'])
        print("\n--- Master files updated. Process complete. ---")
        return

    print("\n--- Pre-processing data for saving ---")

    # Use the helper function to correctly assign the full tournament name
    matches_df['tournament'] = matches_df['match_id'].apply(lambda mid: get_tournament_name_from_id(mid, TOURNAMENT_NAME_MAP))

    # Split matches into finished and fixtures (unfinished)
    finished_matches_df = matches_df[matches_df['finished'] == True].copy()
    fixtures_df = matches_df[matches_df['finished'] == False].copy()

    print(f"  > Found {len(finished_matches_df)} newly finished matches to process.")
    print(f"  > Found {len(fixtures_df)} upcoming fixtures to record.")

    # Fetch player-match stats only for the finished matches.
    relevant_match_ids = finished_matches_df['match_id'].unique().tolist()
    player_match_stats_df = fetch_data_by_ids('playermatchstats', 'match_id', relevant_match_ids)

    # Add helper columns to player stats
    if not player_match_stats_df.empty:
        # Create a map for tournament names from the main matches_df for efficiency
        match_id_to_tourn_map = matches_df.set_index('match_id')['tournament'].to_dict()
        player_match_stats_df['gameweek'] = player_match_stats_df['match_id'].map(finished_matches_df.set_index('match_id')['gameweek'])
        player_match_stats_df['tournament'] = player_match_stats_df['match_id'].map(match_id_to_tourn_map)

    print("\n--- Saving data into directory structures ---")

    # --- 1. Save data into the 'By Gameweek' structure ---
    # Loop over all gameweeks present in the fetched data, not just finished ones.
    all_gws = sorted(matches_df['gameweek'].dropna().unique())
    for gw in all_gws:
        gw = int(gw)
        gw_dir = os.path.join(season_path, "By Gameweek", f"GW{gw}")

        # Filter event-based data for this specific gameweek
        gw_matches = finished_matches_df[finished_matches_df['gameweek'] == gw]
        gw_pms = player_match_stats_df[player_match_stats_df['gameweek'] == gw]
        gw_player_stats = all_player_stats_df[all_player_stats_df['gw'] == gw]
        gw_fixtures = fixtures_df[fixtures_df['gameweek'] == gw]

        # Save filtered event data
        update_csv(gw_matches.drop(columns=['tournament'], errors='ignore'), os.path.join(gw_dir, "matches.csv"), unique_cols=['match_id'])
        update_csv(gw_pms.drop(columns=['gameweek', 'tournament'], errors='ignore'), os.path.join(gw_dir, "playermatchstats.csv"), unique_cols=['player_id', 'match_id'])
        update_csv(gw_player_stats, os.path.join(gw_dir, "playerstats.csv"), unique_cols=['id', 'gw'])
        update_csv(gw_fixtures.drop(columns=['tournament'], errors='ignore'), os.path.join(gw_dir, "fixtures.csv"), unique_cols=['match_id'])

        # Save the COMPLETE master lists for players and teams for full context
        update_csv(all_players_df, os.path.join(gw_dir, "players.csv"), unique_cols=['player_id'])
        update_csv(all_teams_df, os.path.join(gw_dir, "teams.csv"), unique_cols=['id'])

    print("  > Processed all data into 'By Gameweek' structure.")

    # --- 2. Save data into the 'By Tournament' structure ---
    # Group by the main matches_df to include folders for gameweeks that only have fixtures.
    for (gw, tourn), group in matches_df.groupby(['gameweek', 'tournament']):
        gw, tourn = int(gw), str(tourn)
        tourn_dir = os.path.join(season_path, "By Tournament", tourn, f"GW{gw}")

        # Filter event-based data for this specific tournament-gameweek slice
        tourn_finished_matches = group[group['finished'] == True]
        tourn_fixtures = group[group['finished'] == False]

        tourn_match_ids = tourn_finished_matches['match_id'].unique()
        tourn_pms = player_match_stats_df[player_match_stats_df['match_id'].isin(tourn_match_ids)]

        tourn_player_ids = tourn_pms['player_id'].unique()
        tourn_player_stats = all_player_stats_df[(all_player_stats_df['id'].isin(tourn_player_ids)) & (all_player_stats_df['gw'] == gw)]

        # Save filtered event data
        update_csv(tourn_finished_matches.drop(columns=['tournament'], errors='ignore'), os.path.join(tourn_dir, "matches.csv"), unique_cols=['match_id'])
        update_csv(tourn_pms.drop(columns=['gameweek', 'tournament'], errors='ignore'), os.path.join(tourn_dir, "playermatchstats.csv"), unique_cols=['player_id', 'match_id'])
        update_csv(tourn_player_stats, os.path.join(tourn_dir, "playerstats.csv"), unique_cols=['id', 'gw'])
        update_csv(tourn_fixtures.drop(columns=['tournament'], errors='ignore'), os.path.join(tourn_dir, "fixtures.csv"), unique_cols=['match_id'])

        # Save the COMPLETE master lists for players and teams for full context
        update_csv(all_players_df, os.path.join(tourn_dir, "players.csv"), unique_cols=['player_id'])
        update_csv(all_teams_df, os.path.join(tourn_dir, "teams.csv"), unique_cols=['id'])

    print("  > Processed all data into 'By Tournament' structure.")

    # --- 3. Update Master Files in the root season folder ---
    print("\n--- Updating master data files ---")
    update_csv(all_players_df, os.path.join(season_path, 'players.csv'), unique_cols=['player_id'])
    print("  > Master 'players.csv' updated.")

    update_csv(all_teams_df, os.path.join(season_path, 'teams.csv'), unique_cols=['id'])
    print("  > Master 'teams.csv' updated.")

    update_csv(all_player_stats_df, os.path.join(season_path, 'playerstats.csv'), unique_cols=['id', 'gw'])
    print("  > Master 'playerstats.csv' updated.")

    print("\n--- Automated data update process completed successfully! ---")


if __name__ == "__main__":
    main()
