function Scoreboard({ match, rally, currentUserId }) {
  const isPlayer1 = match.player1 === currentUserId;

  const formatPoints = (points) => {
    if (points === 'AD') return 'Advantage';
    if (points === 0) return 'Love';
    return points.toString();
  };

  return (
    <div className="card">
      <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-4 text-center">
        Match Score
      </h3>

      {/* Game Score (Sets) */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`text-center p-4 rounded-lg ${isPlayer1 ? 'bg-court-blue/20' : 'bg-slate-700'}`}>
          <div className="text-sm text-slate-400 mb-1">
            {match.player1_info?.username || 'Player 1'}
            {isPlayer1 && ' (You)'}
          </div>
          <div className="game-score">{match.score_p1}</div>
        </div>

        <div className={`text-center p-4 rounded-lg ${!isPlayer1 ? 'bg-court-blue/20' : 'bg-slate-700'}`}>
          <div className="text-sm text-slate-400 mb-1">
            {match.player2_info?.username || 'Player 2'}
            {!isPlayer1 && ' (You)'}
          </div>
          <div className="game-score">{match.score_p2}</div>
        </div>
      </div>

      {/* Point Score (Current Game) */}
      {rally && (
        <>
          <div className="border-t border-slate-700 pt-4 mb-4">
            <h4 className="text-xs uppercase tracking-wide text-slate-400 mb-3 text-center">
              Current Game
            </h4>

            {rally.deuce ? (
              <div className="text-center">
                <div className="score-display animate-pulse-slow">Deuce</div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div className="text-center flex-1">
                  <div className="score-display">
                    {formatPoints(isPlayer1 ? rally.p1Points : rally.p2Points)}
                  </div>
                </div>

                <div className="text-2xl text-slate-500 px-4">-</div>

                <div className="text-center flex-1">
                  <div className="score-display">
                    {formatPoints(isPlayer1 ? rally.p2Points : rally.p1Points)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Turn Indicator */}
          <div className="bg-slate-700 rounded-lg p-3 text-center">
            <div className="text-sm">
              {rally.current_turn === currentUserId ? (
                <span className="text-tennis-green font-bold">
                  🎯 Your Turn
                </span>
              ) : (
                <span className="text-slate-400">
                  ⏳ Opponent's Turn
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Player ELO */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="text-slate-400">ELO</div>
            <div className="font-bold">{match.player1_info?.elo || 1200}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">ELO</div>
            <div className="font-bold">{match.player2_info?.elo || 1200}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Scoreboard;
