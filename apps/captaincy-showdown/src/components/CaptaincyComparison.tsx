import React from 'react';

export interface Player {
  name: string;
  team: string;
  position: 'FWD' | 'MID' | 'DEF' | 'GK' | 'GKP';
  price: number;
  ownership: number;
  form: number;
  captainScore: number;
  status: 'TOP PICK' | 'DIFFERENTIAL' | 'TEMPLATE' | 'NONE';
  xGI90: number;
  minutesRisk: number;
  fixtureDifficulty: Array<'green' | 'red' | 'gray'>;
}

export interface ComparisonProps {
  player1: Player;
  player2: Player;
  winner: 'player1' | 'player2';
  className?: string;
}

const GlassCard: React.FC<{ player: Player; winner: boolean }> = ({ player, winner }) => {
  const accentClasses = winner
    ? 'bg-green-500/10 border-green-500/20'
    : 'bg-orange-500/10 border-orange-500/20';

  const statusColor = player.status === 'TOP PICK'
    ? 'from-emerald-400 to-cyan-400'
    : player.status === 'DIFFERENTIAL'
      ? 'from-orange-400 to-red-400'
      : 'from-slate-400 to-slate-500';

  return (
    <div
      className="relative rounded-2xl p-5 md:p-6 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(55, 65, 81, 0.8)', // slate-700/80
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(156, 163, 175, 0.2)', // gray-400/20
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}
    >
      {/* bottom accent bar */}
      <div className={`absolute left-0 right-0 bottom-0 h-1.5 ${winner ? 'bg-green-500' : 'bg-orange-500'}`} />

      {/* header badges */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-400/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
            {player.team}
          </div>
          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
            player.position === 'FWD' ? 'bg-red-400/20 text-red-300' :
            player.position === 'MID' ? 'bg-blue-400/20 text-blue-300' :
            player.position === 'DEF' ? 'bg-emerald-400/20 text-emerald-300' :
            'bg-yellow-400/20 text-yellow-300'
          }`}>
            {player.position === 'GKP' ? 'GK' : player.position}
          </span>
        </div>
        {player.status !== 'NONE' && (
          <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${statusColor} bg-opacity-20 backdrop-blur-sm`}>
            <span className="text-[10px] font-semibold text-white">{player.status}</span>
          </div>
        )}
      </div>

      {/* name */}
      <h3 className="text-white font-bold text-xl md:text-2xl mb-3 truncate">{player.name}</h3>

      {/* captain score highlight */}
      <div className={`rounded-xl border ${accentClasses} px-4 py-3 mb-4`}>
        <div className="text-gray-300 text-xs font-medium">Captain Score</div>
        <div className="text-3xl md:text-4xl font-black text-white leading-none mt-1">
          {player.captainScore.toFixed(1)}
        </div>
      </div>

      {/* stats grid */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="text-gray-400 text-xs">Price</div>
          <div className="text-white font-semibold">£{player.price.toFixed(1)}m</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="text-gray-400 text-xs">Ownership</div>
          <div className="text-white font-semibold">{player.ownership.toFixed(1)}%</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="text-gray-400 text-xs">Form</div>
          <div className="text-white font-semibold">{player.form.toFixed(1)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="text-gray-400 text-xs mb-1">Fixture</div>
          <div className="flex gap-1">
            {player.fixtureDifficulty.slice(0,5).map((c, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full ${c === 'green' ? 'bg-emerald-400' : c === 'red' ? 'bg-rose-400' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* enhanced stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="text-gray-400 text-xs">xGI/90</div>
          <div className="text-white font-semibold">{player.xGI90.toFixed(1)}</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="text-gray-400 text-xs">Minutes Risk</div>
          <div className="text-white font-semibold">{player.minutesRisk.toFixed(0)}%</div>
        </div>
      </div>
    </div>
  );
};

const VsIndicator: React.FC<{ a: Player; b: Player; winner: 'player1' | 'player2' }>
  = ({ a, b, winner }) => {
  const diff = Math.abs(a.captainScore - b.captainScore);
  const leader = winner === 'player1' ? a.name : b.name;
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
        style={{
          background: 'rgba(79, 70, 229, 0.15)', // purple-600/15
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(168, 85, 247, 0.6)' // purple accent
        }}
        role="separator"
        aria-label="versus"
      >
        VS
      </div>
      <div className="rounded-full px-3 py-1 text-sm text-white"
        style={{
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.15)',
          backdropFilter: 'blur(8px)'
        }}
        role="status"
        aria-label="advantage"
      >
        Advantage +{diff.toFixed(1)} • {leader}
      </div>
    </div>
  );
};

export const CaptaincyComparison: React.FC<ComparisonProps> = ({ player1, player2, winner, className = '' }) => {
  return (
    <div className={`w-full mx-auto p-4 rounded-2xl ${className} bg-gradient-to-br from-gray-800 to-gray-900`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        <GlassCard player={player1} winner={winner === 'player1'} />
        <div className="flex items-center justify-center">
          <VsIndicator a={player1} b={player2} winner={winner} />
        </div>
        <GlassCard player={player2} winner={winner === 'player2'} />
      </div>
    </div>
  );
};

export default CaptaincyComparison;
