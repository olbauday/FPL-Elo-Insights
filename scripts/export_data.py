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
    
    # Exit early if there are no matches at all to process.
    if matches_df.empty:
        print("\nNo recent match data found (neither finished nor upcoming). Updating master files only.")
        update_csv(all_players_df, os.path.join(season_path, 'players.csv'), unique_cols=['player_id'])
        update_csv(all_teams_df, os.path.join(season_path, 'teams.csv'), unique_cols=['id'])
        update_csv(all_player_stats_df, os.path.join(season_path, 'playerstats.csv'), unique_cols=['id', 'gw'])
        print("\n--- Master files updated. Process complete. ---")
        return

    print("\n--- Pre-processing data for saving ---")
    
    # --- MODIFIED: Add helper columns to the main matches_df first ---
    match_to_tournament_map = {row['match_id']: TOURNAMENT_NAME_MAP.get(row['match_id'].split('-')[2], row['match_id'].split('-')[2]) for _, row in matches_df.iterrows()}
    matches_df['tournament'] = matches_df['match_id'].map(match_to_tournament_map)
    
    # --- MODIFIED: Split matches into finished and fixtures (unfinished) ---
    finished_matches_df = matches_df[matches_df['finished'] == True].copy()
    fixtures_df = matches_df[matches_df['finished'] == False].copy() # NEW
    
    print(f"  > Found {len(finished_matches_df)} newly finished matches to process.")
    print(f"  > Found {len(fixtures_df)} upcoming fixtures to record.") # NEW

    # Fetch player-match stats only for the finished matches.
    relevant_match_ids = finished_matches_df['match_id'].unique().tolist()
    player_match_stats_df = fetch_data_by_ids('playermatchstats', 'match_id', relevant_match_ids)
    
    # Add helper columns to player stats
    if not player_match_stats_df.empty:
        player_match_stats_df['gameweek'] = player_match_stats_df['match_id'].map(finished_matches_df.set_index('match_id')['gameweek'])
        player_match_stats_df['tournament'] = player_match_stats_df['match_id'].map(match_to_tournament_map)
    
    print("\n--- Saving data into directory structures ---")

    # --- 1. Save data into the 'By Gameweek' structure ---
    # MODIFIED: Loop over all gameweeks present in the fetched data, not just finished ones.
    all_gws = sorted(matches_df['gameweek'].dropna().unique())
    for gw in all_gws:
        gw = int(gw)
        gw_dir = os.path.join(season_path, "By Gameweek", f"GW{gw}")
        
        # Filter event-based data for this specific gameweek
        gw_matches = finished_matches_df[finished_matches_df['gameweek'] == gw]
        gw_pms = player_match_stats_df[player_match_stats_df['gameweek'] == gw]
        gw_player_stats = all_player_stats_df[all_player_stats_df['gw'] == gw]
        gw_fixtures = fixtures_df[fixtures_df['gameweek'] == gw] # NEW

        # Save filtered event data
        update_csv(gw_matches.drop(columns=['tournament'], errors='ignore'), os.path.join(gw_dir, "matches.csv"), unique_cols=['match_id'])
        update_csv(gw_pms.drop(columns=['gameweek', 'tournament'], errors='ignore'), os.path.join(gw_dir, "playermatchstats.csv"), unique_cols=['player_id', 'match_id'])
        update_csv(gw_player_stats, os.path.join(gw_dir, "playerstats.csv"), unique_cols=['id', 'gw'])
        update_csv(gw_fixtures.drop(columns=['tournament'], errors='ignore'), os.path.join(gw_dir, "fixtures.csv"), unique_cols=['match_id']) # NEW

        # Save the COMPLETE master lists for players and teams for full context
        update_csv(all_players_df, os.path.join(gw_dir, "players.csv"), unique_cols=['player_id'])
        update_csv(all_teams_df, os.path.join(gw_dir, "teams.csv"), unique_cols=['id'])
        
    print("  > Processed all data into 'By Gameweek' structure.")

    # --- 2. Save data into the 'By Tournament' structure ---
    # MODIFIED: Group by the main matches_df to include folders for gameweeks that only have fixtures.
    for (gw, tourn), group in matches_df.groupby(['gameweek', 'tournament']):
        gw, tourn = int(gw), str(tourn)
        tourn_dir = os.path.join(season_path, "By Tournament", tourn, f"GW{gw}")
        
        # Filter event-based data for this specific tournament-gameweek slice
        tourn_finished_matches = group[group['finished'] == True]
        tourn_fixtures = group[group['finished'] == False] # NEW
        
        tourn_match_ids = tourn_finished_matches['match_id'].unique()
        tourn_pms = player_match_stats_df[player_match_stats_df['match_id'].isin(tourn_match_ids)]
        
        tourn_player_ids = tourn_pms['player_id'].unique()
        tourn_player_stats = all_player_stats_df[(all_player_stats_df['id'].isin(tourn_player_ids)) & (all_player_stats_df['gw'] == gw)]

        # Save filtered event data
        update_csv(tourn_finished_matches.drop(columns=['tournament'], errors='ignore'), os.path.join(tourn_dir, "matches.csv"), unique_cols=['match_id'])
        update_csv(tourn_pms.drop(columns=['gameweek', 'tournament'], errors='ignore'), os.path.join(tourn_dir, "playermatchstats.csv"), unique_cols=['player_id', 'match_id'])
        update_csv(tourn_player_stats, os.path.join(tourn_dir, "playerstats.csv"), unique_cols=['id', 'gw'])
        update_csv(tourn_fixtures.drop(columns=['tournament'], errors='ignore'), os.path.join(tourn_dir, "fixtures.csv"), unique_cols=['match_id']) # NEW

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
