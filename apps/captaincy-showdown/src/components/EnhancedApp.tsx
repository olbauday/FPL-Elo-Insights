import React, { useEffect, useMemo, useState } from 'react';
import { EnhancedPlayerCard } from './EnhancedPlayerCard';
import type { CaptainCandidate } from '../types';
import { getCaptainCandidates, getTopCandidates } from '../services/captaincyDataService';

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
  season = '2024-2025',
}) => {
  const defaultGw = typeof gameweek === 'number' ? gameweek : 23;
  const [loadedPlayers, setLoadedPlayers] = useState<CaptainCandidate[]>(players ?? []);
  const [resolvedGw, setResolvedGw] = useState<number>(defaultGw);
  const [resolvedLastUpdated, setResolvedLastUpdated] = useState<string>(lastUpdated ?? 'Just now');

  // If no players were provided, load them via the data service
  useEffect(() => {
    let active = true;
    if (!players || players.length === 0) {
      (async () => {
        const data = await getCaptainCandidates(defaultGw, season);
        if (!active) return;
        setLoadedPlayers(data);
        setResolvedLastUpdated(new Date().toLocaleTimeString());
        // resolved GW may change if service falls back to latest GW
        // We can't know it directly without service returning gw; keep requested gw for now
        setResolvedGw(defaultGw);
      })();
    }
    return () => { active = false; };
  }, [players, defaultGw, season]);

  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('Score');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<number>>(new Set());
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [search, setSearch] = useState<string>('');
  const [topFive, setTopFive] = useState<CaptainCandidate[]>([]);

  const positions = ['All', 'Forward', 'Midfielder', 'Defender'];
  const sortOptions = ['Score', 'Price', 'Ownership', 'Form'];

  const filteredAndSortedPlayers = useMemo(() => {
    let base = (players && players.length > 0) ? players : loadedPlayers;
    let filtered = [...base];

    if (selectedPosition !== 'All') {
      const code = Object.entries(POSITION_LABEL).find(([, label]) => label === selectedPosition)?.[0];
      if (code) filtered = filtered.filter((p) => p.position === code);
    }

    // Apply search by player name or team (case-insensitive)
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
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
  }, [players, loadedPlayers, selectedPosition, sortBy, search]);

  const handlePlayerSelect = (playerId: number) => {
    if (!isCompareMode) return;
    const next = new Set(selectedPlayers);
    if (next.has(playerId)) next.delete(playerId);
  else if (next.size < 2) next.add(playerId);
    setSelectedPlayers(next);
  };

  // Load Top 5 quick-select once data is available
  useEffect(() => {
    (async () => {
      const gw = typeof gameweek === 'number' ? gameweek : resolvedGw;
      const top = await getTopCandidates(5, gw, season);
      setTopFive(top);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedGw, season]);

  // URL state persistence: read on mount after first load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pos = params.get('pos');
    const sort = params.get('sort');
    const compare = params.get('compare');
    const a = params.get('a');
    const b = params.get('b');
    const q = params.get('q');

    if (pos) setSelectedPosition(pos);
    if (sort) setSortBy(sort);
    if (q) setSearch(q);
    if (compare === '1') setIsCompareMode(true);

    // Defer selection until players list is present
    if ((a || b)) {
      const ids = [a, b].filter(Boolean).map(v => Number(v));
      if (ids.length) {
        setSelectedPlayers(new Set(ids.slice(0, 2)));
      }
    }
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync URL params on key state changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('pos', selectedPosition);
    params.set('sort', sortBy);
    if (search.trim()) params.set('q', search); else params.delete('q');
    if (isCompareMode) params.set('compare', '1'); else params.delete('compare');
    const ids = Array.from(selectedPlayers.values());
    if (ids[0] != null) params.set('a', String(ids[0])); else params.delete('a');
    if (ids[1] != null) params.set('b', String(ids[1])); else params.delete('b');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedPosition, sortBy, isCompareMode, selectedPlayers, search]);

  return (
    <div className="min-h-screen text-white p-5">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-black mb-3 bg-gradient-to-r from-brand-coral to-brand-gold bg-clip-text text-transparent">
          Captaincy Showdown
        </h1>
        <p className="text-gray-300 text-lg font-medium">
          GW{typeof gameweek === 'number' ? gameweek : resolvedGw} Captain Candidates • Last Updated: {lastUpdated ?? resolvedLastUpdated}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Search */}
        <div className="flex items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or team"
            className="px-4 py-2 rounded-xl bg-white/10 text-gray-100 placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-brand-green"
            aria-label="Search players"
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

      {/* Quick Select Top 5 */}
      {topFive.length > 0 && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <span className="text-gray-300">Quick Select:</span>
            {topFive.map(p => (
              <button
                key={p.player_id}
                onClick={() => {
                  if (!isCompareMode) setIsCompareMode(true);
                  handlePlayerSelect(p.player_id);
                }}
                className={`px-3 py-1 rounded-full border transition ${selectedPlayers.has(p.player_id) ? 'bg-brand-coral text-white border-brand-coral' : 'bg-white/10 text-gray-200 border-white/20 hover:bg-white/20'}`}
                aria-pressed={selectedPlayers.has(p.player_id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isCompareMode && (
        <div className="text-center mb-6">
          <div className="inline-block bg-purple-500/20 border border-purple-400/30 rounded-xl px-4 py-2 backdrop-blur-sm">
            <span className="text-purple-300 font-medium">
              Click up to 2 players to compare • {selectedPlayers.size}/2 selected
            </span>
          </div>
        </div>
      )}

      {/* Cards grid; show all until 2 selected, then filter to the selected pair */}
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

      <div className="text-center mt-12 text-gray-400">
        <p className="text-sm">Powered by FPL-Elo-Insights • Built for Bendito Fantasy</p>
      </div>
    </div>
  );
};

export default EnhancedApp;
