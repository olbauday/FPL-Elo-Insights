// Recent performance enrichment utility.
// Reads playermatchstats for the last few finished gameweeks
// and computes rolling xGI/90, recent starts, and avg minutes.

import { getCsvPath } from './csvPathConfig';
import { loadCSVData } from './dataLoader';

export type PlayerStats = Record<string, any>;

type Agg = {
	sumXG: number;
	sumXA: number;
	sumMinutes: number;
	matches: number;
	starts: number;
};

type AggMap = Map<number, Agg>; // player_id -> agg

const cache: Map<string, AggMap> = new Map(); // key = `${season}#${gameweek}`
// Track in-flight builds to avoid duplicate work when many rows call this concurrently
const inflight: Map<string, Promise<AggMap>> = new Map();

async function tryLoadPmsCsv(path: string): Promise<any[]> {
	try {
		return await loadCSVData<any>(path);
	} catch {
		return [];
	}
}

async function buildAggMap(season: string, gameweek: number, lookback: number = 3): Promise<AggMap> {
	const key = `${season}#${gameweek}`;
	if (cache.has(key)) return cache.get(key)!;
	if (inflight.has(key)) return inflight.get(key)!;

	const buildPromise = (async () => {
	const map: AggMap = new Map();
	// Consider current GW and up to `lookback` previous GWs
	const gws: number[] = [];
	if (gameweek >= 1) gws.push(gameweek);
	for (let i = 1; i <= lookback; i++) {
		const gw = gameweek - i;
		if (gw >= 1) gws.push(gw);
	}

	for (const gw of gws) {
		// Primary path via csvPathConfig (By Gameweek)
		let path = getCsvPath({ season, gameweek: gw, dataType: 'playermatchstats' as any });
		let rows = await tryLoadPmsCsv(path);

		// Fallback for legacy 2024-2025 structure
		if ((!rows || rows.length === 0) && season === '2024-2025') {
			path = `/data/${season}/playermatchstats/GW${gw}/playermatchstats.csv`;
			rows = await tryLoadPmsCsv(path);
		}

		if (!rows || rows.length === 0) continue;

		for (const r of rows) {
			const pid = Number(r.player_id ?? r.id);
			const minutes = Number(r.minutes_played ?? r.minutes ?? 0) || 0;
			const xg = Number(r.xg ?? 0) || 0;
			const xa = Number(r.xa ?? 0) || 0;
			const startMin = Number(r.start_min ?? (minutes > 0 ? 0 : 1));
			if (!Number.isFinite(pid) || pid <= 0) continue;

			let agg = map.get(pid);
			if (!agg) {
				agg = { sumXG: 0, sumXA: 0, sumMinutes: 0, matches: 0, starts: 0 };
				map.set(pid, agg);
			}
			agg.sumXG += xg;
			agg.sumXA += xa;
			if (minutes > 0) {
				agg.sumMinutes += minutes;
				agg.matches += 1;
			}
			if (startMin === 0) agg.starts += 1;
		}
	}
	cache.set(key, map);
	return map;
	})();

	inflight.set(key, buildPromise);
	try {
		const result = await buildPromise;
		return result;
	} finally {
		inflight.delete(key);
	}
}

export async function enrichWithRecentPerformance(
	stats: PlayerStats,
	season: string,
	gameweek: number,
	prebuilt?: Map<number, any>
): Promise<PlayerStats> {
	const pid = Number(stats.id ?? stats.player_id);
	if (!Number.isFinite(pid) || pid <= 0) return stats;
	const map = prebuilt ?? (await buildAggMap(season, gameweek, 3));
	const agg = map.get(pid);
	if (!agg) return stats;

	const totalXgi = agg.sumXG + agg.sumXA;
	const rolling_xgi_per_90 = agg.sumMinutes > 0 ? (totalXgi / agg.sumMinutes) * 90 : 0;
	const recent_minutes_avg = agg.matches > 0 ? agg.sumMinutes / agg.matches : 0;

	return {
		...stats,
		rolling_xgi_per_90,
		recent_starts: agg.starts,
		recent_minutes_avg,
		recent_minutes_total: agg.sumMinutes,
		recent_matches: agg.matches,
	};
}

export default enrichWithRecentPerformance;
export { buildAggMap };
