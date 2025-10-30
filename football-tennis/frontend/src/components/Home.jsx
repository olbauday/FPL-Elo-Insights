import { useState, useEffect } from 'react';
import apiService from '../services/api';

function Home({ user, onUserLogin, onStartMatch, onViewLeaderboard }) {
  const [username, setUsername] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [availableMatches, setAvailableMatches] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadAvailableMatches();
    }
  }, [user]);

  const loadAvailableMatches = async () => {
    try {
      const matches = await apiService.listMatches();
      setAvailableMatches(matches);
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoggingIn(true);
    setError(null);

    try {
      const userId = crypto.randomUUID();
      const response = await apiService.registerUser(userId, username.trim());

      onUserLogin({
        userId,
        username: username.trim(),
        elo: response.user.elo
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCreateMatch = async () => {
    try {
      const response = await apiService.createMatch(user.userId, user.username);
      onStartMatch(response.match.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinMatch = async (matchId) => {
    try {
      await apiService.joinMatch(matchId, user.userId, user.username);
      onStartMatch(matchId);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 text-tennis-green text-shadow">
              ⚽ 🎾
            </h1>
            <h1 className="text-4xl font-bold mb-2">Football Knowledge Tennis</h1>
            <p className="text-slate-400">Rally facts. Score points. Win the match.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Choose a username</label>
              <input
                type="text"
                className="input-field w-full"
                placeholder="Enter username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoggingIn}
                maxLength={20}
              />
            </div>

            {error && (
              <div className="bg-court-red/20 border border-court-red rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isLoggingIn || !username.trim()}
            >
              {isLoggingIn ? 'Joining...' : 'Start Playing'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={onViewLeaderboard}
              className="text-court-blue hover:text-blue-400 text-sm font-medium"
            >
              View Leaderboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-1">Welcome, {user.username}!</h1>
              <p className="text-slate-400">ELO: {user.elo || 1200}</p>
            </div>
            <button
              onClick={onViewLeaderboard}
              className="btn-secondary"
            >
              Leaderboard
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <button
            onClick={handleCreateMatch}
            className="card hover:glow-green transition-all cursor-pointer text-center p-8"
          >
            <div className="text-5xl mb-4">🆕</div>
            <h2 className="text-2xl font-bold mb-2">Create New Match</h2>
            <p className="text-slate-400">Start a new game and wait for an opponent</p>
          </button>

          <div className="card p-8">
            <div className="text-5xl mb-4 text-center">🎮</div>
            <h2 className="text-2xl font-bold mb-4 text-center">Quick Match</h2>
            <button
              onClick={() => availableMatches.length > 0 && handleJoinMatch(availableMatches[0].id)}
              className="btn-primary w-full"
              disabled={availableMatches.length === 0}
            >
              {availableMatches.length > 0 ? 'Join Random Match' : 'No matches available'}
            </button>
          </div>
        </div>

        {/* Available Matches */}
        {availableMatches.length > 0 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Available Matches</h2>
            <div className="space-y-3">
              {availableMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-slate-700 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{match.player1_info?.username || 'Unknown'}</p>
                    <p className="text-sm text-slate-400">
                      ELO: {match.player1_info?.elo || 1200}
                    </p>
                  </div>
                  <button
                    onClick={() => handleJoinMatch(match.id)}
                    className="btn-primary"
                  >
                    Join Match
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="card bg-court-red/20 border-court-red mt-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* How to Play */}
        <div className="card mt-6">
          <h2 className="text-2xl font-bold mb-4">How to Play</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-3xl mb-2">1️⃣</div>
              <h3 className="font-bold mb-1">Answer Questions</h3>
              <p className="text-slate-400">Name players/clubs that fit the category</p>
            </div>
            <div>
              <div className="text-3xl mb-2">2️⃣</div>
              <h3 className="font-bold mb-1">Rally Back & Forth</h3>
              <p className="text-slate-400">Take turns until someone fails</p>
            </div>
            <div>
              <div className="text-3xl mb-2">3️⃣</div>
              <h3 className="font-bold mb-1">Win the Match</h3>
              <p className="text-slate-400">Tennis scoring: 15-30-40-Game</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
