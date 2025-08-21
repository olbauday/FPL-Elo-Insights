// Lightweight performance enrichment utility.
// For now this is a no-op that simply returns the original stats,
// but it provides a stable API so imports don’t fail and can be enhanced later.

export type PlayerStats = Record<string, any>;

export async function enrichWithRecentPerformance(
	stats: PlayerStats,
	_season: string,
	_gameweek: number
): Promise<PlayerStats> {
	// In a future enhancement, read playermatchstats for recent GWs and
	// compute rolling form/xGI. For now, pass through untouched.
	return stats;
}

export default enrichWithRecentPerformance;
