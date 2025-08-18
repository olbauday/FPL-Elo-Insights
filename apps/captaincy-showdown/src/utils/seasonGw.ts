import { getCsvPath } from './csvPathConfig';
import { loadCSVData } from './dataLoader';

/**
 * Lightweight existence check for a public asset.
 * Uses HEAD when possible, falls back to GET. Returns true if response.ok.
 */
export async function fileExists(url: string): Promise<boolean> {
  try {
    // Try HEAD first
    const head = await fetch(url, { method: 'HEAD' as any });
    if ((head as any)?.ok) return true;
  } catch (_) {
    // Ignore and try GET below
  }
  try {
    const resp = await fetch(url, { method: 'GET' });
    return resp.ok;
  } catch (_) {
    return false;
  }
}

type Manifest = {
  seasons?: Array<{ id: string; gameweeks?: number }>;
};

/**
 * Attempts to load /data/manifest.json to discover seasons.
 * Falls back to probing a small set of likely seasons present in the repo.
 */
export async function getAvailableSeasons(): Promise<string[]> {
  // 1) Try manifest
  try {
    const resp = await fetch('/data/manifest.json');
    if (resp.ok) {
      const manifest = (await resp.json()) as Manifest;
      const seasons = (manifest.seasons || []).map((s) => s.id).filter(Boolean);
      if (seasons.length) return seasons;
    }
  } catch (_) {
    // ignore
  }

  // 2) Probe known patterns (adjust list if repo grows)
  const candidates = ['2025-2026', '2024-2025'];
  const found: string[] = [];
  for (const season of candidates) {
    const playersPath = getCsvPath({ season, dataType: 'players' });
    // If players file exists, consider the season available
    if (await fileExists(playersPath)) found.push(season);
  }
  return found;
}

/**
 * Detects the next upcoming GW for a season by scanning for existing GW files.
 * Heuristic: returns (lastExistingGW + 1), clamped to [1, 38]. If no GW files exist, returns 1.
 * For a fully completed season, returns 38.
 */
export async function detectNextUpcomingGw(season: string, maxGw: number = 38): Promise<number> {
  let lastExisting = 0;
  for (let gw = 1; gw <= maxGw; gw++) {
    const matchesPath = getCsvPath({ season, gameweek: gw, dataType: 'matches' });
    if (await fileExists(matchesPath)) {
      lastExisting = gw;
    } else {
      // first missing GW implies next upcoming is this one
      return Math.min(Math.max(gw, 1), maxGw);
    }
  }
  // All up to maxGw exist – clamp to max (completed season)
  return Math.min(Math.max(lastExisting, 1), maxGw);
}

/**
 * Optionally parse kickoff times from a GW to refine selection; unused for now.
 * Left here for future enhancement.
 */
export async function readKickoffTimes(season: string, gameweek: number): Promise<Date[] | null> {
  try {
    const path = getCsvPath({ season, gameweek, dataType: 'matches' });
    const rows = await loadCSVData<Record<string, string>>(path);
    const dates = rows
      .map((r) => r.kickoff_time || r.kickoff || r.date)
      .filter((v): v is string => !!v)
      .map((v) => new Date(v));
    return dates.length ? dates : null;
  } catch {
    return null;
  }
}
