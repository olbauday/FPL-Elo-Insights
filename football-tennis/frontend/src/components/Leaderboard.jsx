import { useState, useEffect } from 'react';
import apiService from '../services/api';

function Leaderboard({ user, onBack }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('elo');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLeaderboard(sortBy, 50);
      setLeaderboard(data);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">🏆 Leaderboard</h1>
          <button onClick={onBack} className="btn-secondary">
            ← Back
          </button>
        </div>

        {/* Sort Options */}
        <div className="card mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSortBy('elo')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'elo'
                  ? 'bg-tennis-green text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              ELO Rating
            </button>
            <button
              onClick={() => setSortBy('wins')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'wins'
                  ? 'bg-tennis-green text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Total Wins
            </button>
            <button
              onClick={() => setSortBy('streak')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                sortBy === 'streak'
                  ? 'bg-tennis-green text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Current Streak
            </button>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse-slow text-4xl mb-2">⚽</div>
              <p className="text-slate-400">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🏜️</div>
              <p className="text-slate-400">No players yet. Be the first!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-700">
                  <tr className="text-left text-slate-400 text-sm">
                    <th className="pb-3 pr-4">#</th>
                    <th className="pb-3 pr-4">Player</th>
                    <th className="pb-3 pr-4">ELO</th>
                    <th className="pb-3 pr-4">Matches</th>
                    <th className="pb-3 pr-4">Wins</th>
                    <th className="pb-3 pr-4">Win Rate</th>
                    <th className="pb-3">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((player) => {
                    const isCurrentUser = user && player.user_id === user.userId;

                    return (
                      <tr
                        key={player.user_id}
                        className={`border-b border-slate-700/50 ${
                          isCurrentUser ? 'bg-court-blue/20' : ''
                        }`}
                      >
                        <td className="py-3 pr-4 font-bold text-slate-400">
                          {player.rank}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">
                            {player.username}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-court-blue px-2 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-bold text-tennis-green">
                            {player.elo}
                          </span>
                        </td>
                        <td className="py-3 pr-4">{player.matches_played}</td>
                        <td className="py-3 pr-4">{player.matches_won}</td>
                        <td className="py-3 pr-4">{player.win_rate}%</td>
                        <td className="py-3">
                          {player.current_streak > 0 ? (
                            <span className="text-orange-400 font-bold">
                              🔥 {player.current_streak}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Stats */}
        {user && (
          <div className="card mt-6">
            <h2 className="text-xl font-bold mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-tennis-green">
                  {user.elo || 1200}
                </div>
                <div className="text-sm text-slate-400">ELO</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-slate-400">Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-sm text-slate-400">Wins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">0</div>
                <div className="text-sm text-slate-400">Streak</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
