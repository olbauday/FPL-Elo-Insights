"""Quick manual data inspection tool for Captaincy Showdown.

Usage (PowerShell):
  python scripts/inspect_captain_data.py --season 2025-2026 --limit 15 --sort captain_score

What it does:
  1. Loads players.csv, teams.csv, playerstats.csv for a season (master or GW-specific).
  2. Merges to enrich stats with names, team short names, position.
  3. Derives the fields your mapper expects: form, now_cost, selected_by_percent, chance_of_playing_next_round,
     expected_goal_involvements_per_90 (reconstructed from expected_goals + expected_assists if per_90 not present).
  4. Computes a temporary captain_score using the documented formula so you can compare with UI values.
  5. Prints: schema diagnostics, null counts, top N rows (raw + computed), and basic distribution summaries.

This lets you quickly see whether low / zero values (e.g. form = 0, xGI/90 = 0) are genuinely in the CSV or caused by mapping issues.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import pandas as pd

CAPTAIN_FORMULA_COMMENT = """Captain Score = (Form * 0.4) + (Fixture * 0.3) + (xGI * 0.2) + (Minutes Certainty * 0.1) where:
  - Form normalized 0-10 (raw form *10 already ~0-10 in FPL feed?)
  - Fixture Difficulty currently placeholder (defaults to 3 here unless provided)
  - xGI/90 from expected_goal_involvements_per_90 (fallback: (xG + xA) per_90 rebuild)
  - Minutes Certainty = 100 - minutes_risk (minutes_risk derived from (100 - chance_of_playing_next_round))
"""

def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        print(f"[WARN] Missing file: {path}")
        return pd.DataFrame()
    try:
        return pd.read_csv(path)
    except Exception as e:
        print(f"[ERROR] Failed reading {path}: {e}")
        return pd.DataFrame()

def derive_dataset(season_dir: Path) -> pd.DataFrame:
    players = load_csv(season_dir / 'players.csv')
    teams = load_csv(season_dir / 'teams.csv')
    stats = load_csv(season_dir / 'playerstats.csv')

    if stats.empty:
        print("[FATAL] playerstats.csv empty - cannot proceed")
        return pd.DataFrame()

    # Merge players meta
    merged = stats.merge(players, left_on='id', right_on='player_id', how='left', suffixes=('', '_player'))
    merged = merged.merge(teams[['id','short_name','name']], left_on='team_code', right_on='id', how='left', suffixes=('', '_team'))

    # Derive expected_goal_involvements_per_90 if missing
    if 'expected_goal_involvements_per_90' not in merged.columns:
        # If per 90 components exist, compute; else set NaN
        if {'expected_goals_per_90','expected_assists_per_90'}.issubset(merged.columns):
            merged['expected_goal_involvements_per_90'] = merged['expected_goals_per_90'].fillna(0) + merged['expected_assists_per_90'].fillna(0)
        else:
            merged['expected_goal_involvements_per_90'] = pd.NA

    # Field normalizations / fallbacks
    merged['form_val'] = pd.to_numeric(merged.get('form'), errors='coerce')
    merged['ownership'] = pd.to_numeric(merged.get('selected_by_percent'), errors='coerce')
    merged['price_raw'] = pd.to_numeric(merged.get('now_cost'), errors='coerce')
    merged['chance_play_next'] = pd.to_numeric(merged.get('chance_of_playing_next_round'), errors='coerce')
    merged['minutes_risk'] = 100 - merged['chance_play_next'].fillna(100)  # if unknown assume risky
    merged['xgi_per_90'] = pd.to_numeric(merged.get('expected_goal_involvements_per_90'), errors='coerce')

    # Fixture difficulty placeholder (until real join implemented)
    merged['fixture_difficulty'] = 3

    # Compute captain score approximation
    # Normalize form to 0-100: assume raw form already 0-10 scale so *10
    merged['form_norm'] = merged['form_val'] * 10
    merged['fixture_score_norm'] = (6 - merged['fixture_difficulty']) * 20  # 1 easiest -> 100, 5 hardest -> 20
    merged['xgi_norm'] = (merged['xgi_per_90'] * 50).clip(upper=100)
    merged['minutes_certainty'] = 100 - merged['minutes_risk']

    merged['captain_score_calc'] = (
        merged['form_norm'] * 0.4 +
        merged['fixture_score_norm'] * 0.3 +
        merged['xgi_norm'] * 0.2 +
        merged['minutes_certainty'] * 0.1
    )

    return merged

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--season', default='2025-2026')
    parser.add_argument('--gameweek', type=int, help='If provided, use By Gameweek/GW#/playerstats.csv')
    parser.add_argument('--root', default='data')
    parser.add_argument('--limit', type=int, default=10)
    parser.add_argument('--sort', default=None, help='Column to sort descending before limiting (e.g. captain_score_calc, form_val, xgi_per_90)')
    args = parser.parse_args()

    if args.gameweek is not None:
        season_dir = Path(args.root) / args.season / 'By Gameweek' / f'GW{args.gameweek}'
    else:
        season_dir = Path(args.root) / args.season

    print(f"[INFO] Inspecting season directory: {season_dir}")
    df = derive_dataset(season_dir)
    if df.empty:
        return

    print("\n[SCHEMA] Columns loaded:")
    print(', '.join(df.columns))

    print("\n[NULL COUNTS] Key fields:")
    print(df[['id','web_name','short_name','position','form_val','xgi_per_90','chance_play_next']].isna().sum())

    print("\n[DESCRIPTIVE STATS] form/xGI per 90:")
    print(df[['form_val','xgi_per_90','minutes_risk','captain_score_calc']].describe())

    view = df.copy()
    if args.sort and args.sort in view.columns:
        view = view.sort_values(args.sort, ascending=False)
    print(f"\n[TOP {args.limit}] Preview (important fields):")
    cols = ['id','web_name','short_name','position','now_cost','selected_by_percent','form_val','xgi_per_90','minutes_risk','captain_score_calc']
    print(view[cols].head(args.limit).to_string(index=False))

    print("\n" + CAPTAIN_FORMULA_COMMENT)
    print("Done.")

if __name__ == '__main__':
    main()
