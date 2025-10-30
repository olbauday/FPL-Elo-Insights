import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socket';
import apiService from '../services/api';
import Scoreboard from './Scoreboard';
import AnswerInput from './AnswerInput';
import AnswerHistory from './AnswerHistory';
import Timer from './Timer';

function Game({ user, matchId, onLeaveMatch }) {
  const [match, setMatch] = useState(null);
  const [rally, setRally] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameState, setGameState] = useState('waiting'); // waiting, active, completed
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    // Connect socket and authenticate
    socketService.connect();
    socketService.authenticate(user.userId, user.username);

    // Load match data
    loadMatch();

    // Join match room
    socketService.joinMatch(matchId, user.userId);

    // Setup socket listeners
    setupSocketListeners();

    return () => {
      socketService.removeAllListeners();
    };
  }, [matchId, user]);

  const loadMatch = async () => {
    try {
      const matchData = await apiService.getMatch(matchId);
      setMatch(matchData);

      if (matchData.status === 'active') {
        setGameState('active');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('match_update', (data) => {
      setMatch(data);
      if (data.status === 'active') {
        setGameState('active');
      }
    });

    socketService.on('new_rally', (data) => {
      setRally(data);
      setAnswers([]);
      setIsMyTurn(data.currentTurn === user.userId);
      setTimeLeft(10);
      setLastResult(null);
    });

    socketService.on('answer_result', (data) => {
      setLastResult(data);
      setAnswers(prev => [...prev, data]);

      // Auto-scroll to bottom of answers
      setTimeout(() => {
        const answersContainer = document.getElementById('answers-container');
        if (answersContainer) {
          answersContainer.scrollTop = answersContainer.scrollHeight;
        }
      }, 100);
    });

    socketService.on('turn_change', (data) => {
      setIsMyTurn(data.nextTurn === user.userId);
      setTimeLeft(10);
    });

    socketService.on('point_update', (data) => {
      if (rally) {
        setRally({
          ...rally,
          p1Points: data.p1Points,
          p2Points: data.p2Points,
          deuce: data.deuce
        });
      }
    });

    socketService.on('game_won', (data) => {
      if (match) {
        setMatch({
          ...match,
          score_p1: data.score.p1,
          score_p2: data.score.p2
        });
      }
    });

    socketService.on('match_complete', (data) => {
      setGameState('completed');
      setMatch(prev => ({
        ...prev,
        winner: data.winnerUserId,
        status: 'completed'
      }));
    });

    socketService.on('error', (data) => {
      setError(data.message);
    });
  };

  const handleSubmitAnswer = useCallback((answer) => {
    if (!isMyTurn || !rally) return;

    socketService.submitAnswer(matchId, rally.rallyId, user.userId, answer);
    setIsMyTurn(false); // Disable input immediately
  }, [isMyTurn, rally, matchId, user.userId]);

  const handleTimeout = useCallback(() => {
    if (!isMyTurn || !rally) return;

    socketService.sendTimeout(matchId, rally.rallyId, user.userId);
    setIsMyTurn(false);
  }, [isMyTurn, rally, matchId, user.userId]);

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse-slow text-6xl mb-4">⚽</div>
          <p className="text-xl text-slate-400">Loading match...</p>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="animate-bounce-subtle text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold mb-2">Waiting for opponent...</h2>
          <p className="text-slate-400 mb-6">Share this match to start playing</p>
          <div className="bg-slate-700 rounded-lg p-3 mb-6 font-mono text-sm">
            {matchId}
          </div>
          <button onClick={onLeaveMatch} className="btn-secondary">
            Cancel Match
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'completed') {
    const didIWin = match.winner === user.userId;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className={`text-6xl mb-4 ${didIWin ? 'animate-bounce-subtle' : ''}`}>
            {didIWin ? '🏆' : '😔'}
          </div>
          <h2 className="text-3xl font-bold mb-2">
            {didIWin ? 'You Won!' : 'You Lost'}
          </h2>
          <p className="text-slate-400 mb-6">
            Final Score: {match.score_p1} - {match.score_p2}
          </p>
          <button onClick={onLeaveMatch} className="btn-primary w-full">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Football Knowledge Tennis</h1>
          <button onClick={onLeaveMatch} className="btn-secondary">
            Leave Match
          </button>
        </div>

        {/* Main Game Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Scoreboard */}
          <div className="lg:col-span-1">
            <Scoreboard
              match={match}
              rally={rally}
              currentUserId={user.userId}
            />
          </div>

          {/* Right Column - Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category */}
            {rally && (
              <div className="card">
                <div className="text-center">
                  <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-2">
                    Category
                  </h3>
                  <h2 className="text-2xl font-bold text-tennis-green mb-2">
                    {rally.category?.title}
                  </h2>
                  <p className="text-sm text-slate-400">
                    Example: {rally.category?.example_answer}
                  </p>
                </div>
              </div>
            )}

            {/* Timer & Answer Input */}
            {rally && (
              <div className="card">
                <Timer
                  timeLeft={timeLeft}
                  isMyTurn={isMyTurn}
                  onTimeout={handleTimeout}
                  setTimeLeft={setTimeLeft}
                />

                <div className="mt-4">
                  <AnswerInput
                    isMyTurn={isMyTurn}
                    onSubmit={handleSubmitAnswer}
                    lastResult={lastResult}
                  />
                </div>
              </div>
            )}

            {/* Answer History */}
            <div className="card">
              <h3 className="text-lg font-bold mb-4">Rally History</h3>
              <AnswerHistory
                answers={answers}
                currentUserId={user.userId}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="card bg-court-red/20 border-court-red">
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
