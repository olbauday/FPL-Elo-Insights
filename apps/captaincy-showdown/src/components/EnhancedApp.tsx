import React, { useEffect, useMemo, useState } from 'react';
import { EnhancedPlayerCard } from './EnhancedPlayerCard';
import type { CaptainCandidate } from '../types';
import { getCaptainCandidates } from '../services/captaincyDataService';

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

  const positions = ['All', 'Forward', 'Midfielder', 'Defender'];
  const sortOptions = ['Score', 'Price', 'Ownership', 'Form'];

  const filteredAndSortedPlayers = useMemo(() => {
    let base = (players && players.length > 0) ? players : loadedPlayers;
    let filtered = [...base];

    if (selectedPosition !== 'All') {
      const code = Object.entries(POSITION_LABEL).find(([, label]) => label === selectedPosition)?.[0];
      if (code) filtered = filtered.filter((p) => p.position === code);
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
    else if (next.size < 3) next.add(playerId);
    setSelectedPlayers(next);
  };

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
          Compare Mode {isCompareMode && `(${selectedPlayers.size}/3)`}
        </button>
      </div>

      {isCompareMode && (
        <div className="text-center mb-6">
          <div className="inline-block bg-purple-500/20 border border-purple-400/30 rounded-xl px-4 py-2 backdrop-blur-sm">
            <span className="text-purple-300 font-medium">
              Click up to 3 players to compare • {selectedPlayers.size}/3 selected
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
        {filteredAndSortedPlayers.map((player) => (
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
