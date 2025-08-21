import React, { useEffect, useMemo, useState } from 'react';
import { EnhancedPlayerCard } from './EnhancedPlayerCard';
import type { CaptainCandidate } from '../types';
import { getCaptainCandidates } from '../services/captaincyDataService';
import { detectNextUpcomingGw, getAvailableSeasons } from '../utils/seasonGw';

interface EnhancedAppProps {
  players?: CaptainCandidate[];
  gameweek?: number;
  lastUpdated?: string;
  season?: string;
}

const POSITION_LABEL: Record<string, string> = {
  GKP: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
};

export const EnhancedApp: React.FC<EnhancedAppProps> = ({
  players,
  gameweek,
  lastUpdated,
  season,
}) => {
  const [loadedPlayers, setLoadedPlayers] = useState<CaptainCandidate[]>(players ?? []);
  const [availableSeasons, setAvailableSeasons] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string | undefined>(season);
  const [selectedGw, setSelectedGw] = useState<number | undefined>(gameweek);
  const [resolvedLastUpdated, setResolvedLastUpdated] = useState<string>(lastUpdated ?? 'Just now');
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If no players were provided, load them via the data service
  useEffect(() => {
    let active = true;
    (async () => {
      // 1) Determine initial season/GW from URL or props or detection
      const params = new URLSearchParams(window.location.search);
      const urlSeason = params.get('season') || undefined;
      const urlGw = params.get('gw');
      const urlGwNum = urlGw ? Number(urlGw) : undefined;

      // Discover seasons in repo (best-effort)
      const seasonsList = await getAvailableSeasons().catch(() => [] as string[]);
      if (!active) return;
      setAvailableSeasons(seasonsList);

      const initialSeason = season || urlSeason || seasonsList[0] || '2025-2026';
      setSelectedSeason(initialSeason);

      // Prefer next upcoming GW unless URL explicitly pins one
      let initialGw: number | undefined = typeof urlGwNum === 'number' && !Number.isNaN(urlGwNum)
        ? urlGwNum
        : (typeof gameweek === 'number' ? gameweek : undefined);
      if (!initialGw) {
        const detected = await detectNextUpcomingGw(initialSeason).catch(() => 1);
        if (!active) return;
        initialGw = detected || 1;
      }
      setSelectedGw(initialGw);

      // 2) Update URL with chosen season/GW
      const newParams = new URLSearchParams(window.location.search);
      newParams.set('season', initialSeason);
      newParams.set('gw', String(initialGw));
      window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);

      // 3) Load data if needed
      if (!players || players.length === 0) {
        setIsLoading(true);
        const data = await getCaptainCandidates(initialGw, initialSeason);
        if (!active) return;
        setLoadedPlayers(data);
        setResolvedLastUpdated(new Date().toLocaleTimeString());
        setIsLoading(false);
      }

      setBootstrapped(true);
    })();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload players when season/GW changes (after bootstrap) and players are not provided via props
  useEffect(() => {
    let active = true;
    if (!bootstrapped) return;
    if (players && players.length > 0) return;
    if (!selectedSeason || typeof selectedGw !== 'number') return;
    (async () => {
      setIsLoading(true);
      const data = await getCaptainCandidates(selectedGw!, selectedSeason!);
      if (!active) return;
      setLoadedPlayers(data);
      setResolvedLastUpdated(new Date().toLocaleTimeString());
      setIsLoading(false);
    })();
    return () => { active = false; };
  }, [bootstrapped, players, selectedSeason, selectedGw]);

  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Score');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [query, setQuery] = useState<string>('');

  const positions = ['All', 'Forward', 'Midfielder', 'Defender'];
  const sortOptions = ['Score', 'Price', 'Ownership', 'Form'];

  const filteredAndSortedPlayers = useMemo(() => {
  let base = (players && players.length > 0) ? players : loadedPlayers;
    let filtered = [...base];

    if (selectedPosition !== 'All') {
      const code = Object.entries(POSITION_LABEL).find(([, label]) => label === selectedPosition)?.[0];
      if (code) filtered = filtered.filter((p) => p.position === code);
    }

    if (query.trim().length > 0) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) || (p.team || '').toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Score':
          return b.captain_score - a.captain_score;
        case 'Price':
          return b.price - a.price;
        case 'Ownership':
          return b.ownership - a.ownership;
        case 'Form':
          return b.form_score - a.form_score;
        default:
          return b.captain_score - a.captain_score;
      }
    });

    return filtered;
  }, [players, loadedPlayers, selectedPosition, sortBy]);

  const handlePlayerSelect = (playerId: number) => {
    if (!isCompareMode) return;
    const next = new Set(selectedPlayers);
    if (next.has(playerId)) next.delete(playerId);
  else if (next.size < 2) next.add(playerId);
    setSelectedPlayers(next);
  };

  return (
    <div className="min-h-screen text-white p-5">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-brand-coral to-brand-gold bg-clip-text text-transparent">
          Captaincy Showdown
        </h1>
        <p className="text-gray-300 text-lg font-medium">
          {selectedSeason || '2025-2026'} • GW{typeof selectedGw === 'number' ? selectedGw : 1} Captain Candidates • Last Updated: {lastUpdated ?? resolvedLastUpdated}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
  {/* Season & GW selectors */}
    <div className="flex gap-2 items-center">
          <label className="text-gray-300">Season</label>
          <select
      className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-gray-200"
            value={selectedSeason || ''}
            onChange={async (e) => {
              const newSeason = e.target.value;
              setSelectedSeason(newSeason);
              // Update URL param
              const params = new URLSearchParams(window.location.search);
              params.set('season', newSeason);
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
              // Choose next upcoming GW for this season
              const nextGw = await detectNextUpcomingGw(newSeason).catch(() => 1);
              setSelectedGw(nextGw || 1);
              const params2 = new URLSearchParams(window.location.search);
              params2.set('season', newSeason);
              params2.set('gw', String(nextGw || 1));
              window.history.pushState({}, '', `${window.location.pathname}?${params2.toString()}`);
            }}
          >
            {(availableSeasons.length ? availableSeasons : ['2025-2026', '2024-2025']).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label className="text-gray-300 ml-4">GW</label>
          <select
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-gray-200"
            value={typeof selectedGw === 'number' ? selectedGw : 1}
            onChange={(e) => {
              const gw = Number(e.target.value);
              setSelectedGw(gw);
              const params = new URLSearchParams(window.location.search);
              params.set('gw', String(gw));
              window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
            }}
          >
            {Array.from({ length: 38 }, (_, i) => i + 1).map((gw) => (
              <option key={gw} value={gw}>GW{gw}</option>
            ))}
          </select>
        </div>

        {/* Quick: jump to next upcoming GW */}
        <button
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-gray-200 hover:bg-white/20"
          onClick={() => {
            // Move to the next GW relative to current selection
            const current = typeof selectedGw === 'number' ? selectedGw : 1;
            const next = Math.min(current + 1, 38);
            setSelectedGw(next);
            const params = new URLSearchParams(window.location.search);
            params.set('gw', String(next));
            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
          }}
        >Next</button>

        {/* Search */}
        <div className="flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players or teams..."
            className="min-w-[260px] bg-white/10 border border-white/20 rounded-full px-4 py-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-coral"
          />
        </div>

        <div className="flex gap-2">
          {positions.map((position) => (
            <button
              key={position}
              onClick={() => setSelectedPosition(position)}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 backdrop-blur-sm ${
                selectedPosition === position
                  ? 'bg-brand-coral text-white shadow-lg'
                  : 'bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20'
              }`}
            >
              {position}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {sortOptions.map((option) => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 backdrop-blur-sm ${
                sortBy === option
                  ? 'bg-brand-green text-gray-900 shadow-lg'
                  : 'bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20'
              }`}
            >
              Sort by {option}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setIsCompareMode(!isCompareMode);
            setSelectedPlayers(new Set());
          }}
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-200 backdrop-blur-sm ${
            isCompareMode
              ? 'bg-purple-500 text-white shadow-lg'
              : 'bg-white/10 text-gray-200 border border-white/20 hover:bg-white/20'
          }`}
        >
          Compare Mode {isCompareMode && `(${selectedPlayers.size}/2)`}
        </button>
      </div>

      {isCompareMode && (
        <div className="text-center mb-6">
          <div className="inline-block bg-purple-500/20 border border-purple-400/30 rounded-xl px-4 py-2 backdrop-blur-sm">
            <span className="text-purple-300 font-medium">
              Click up to 2 players to compare • {selectedPlayers.size}/2 selected
            </span>
          </div>
        </div>
      )}

      {/* Loading / Empty / Cards */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64 text-gray-300">Loading candidates…</div>
      ) : filteredAndSortedPlayers.length === 0 ? (
        <div className="flex flex-col items-center h-64 text-gray-300 gap-2">
          <div>No candidates found.</div>
          <button
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-gray-200 hover:bg-white/20"
            onClick={() => {
              if (selectedSeason && typeof selectedGw === 'number') {
                setIsLoading(true);
                getCaptainCandidates(selectedGw, selectedSeason).then((data) => {
                  setLoadedPlayers(data);
                  setResolvedLastUpdated(new Date().toLocaleTimeString());
                }).finally(() => setIsLoading(false));
              }
            }}
          >Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {(isCompareMode && selectedPlayers.size === 2
            ? filteredAndSortedPlayers.filter(p => selectedPlayers.has(p.player_id))
            : filteredAndSortedPlayers
          ).map((player) => (
            <EnhancedPlayerCard
              key={player.player_id}
              player={player}
              isSelected={selectedPlayers.has(player.player_id)}
              onClick={() => handlePlayerSelect(player.player_id)}
            />
          ))}
        </div>
      )}

      <div className="text-center mt-12 text-gray-400">
        <p className="text-sm">Powered by FPL-Elo-Insights • Built for Bendito Fantasy</p>
      </div>
    </div>
  );
};

export default EnhancedApp;
