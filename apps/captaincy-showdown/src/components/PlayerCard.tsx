import React from 'react';
import type { CaptainCandidate } from '../types';

interface PlayerCardProps {
  player: CaptainCandidate;
  side?: 'left' | 'right';
  size?: 'small' | 'medium' | 'large';
  onClick?: (player: CaptainCandidate) => void;
  isSelected?: boolean;
  className?: string;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  side = 'left',
  size = 'medium',
  onClick,
  isSelected = false,
  className = '',
}) => {
  const formatPrice = (price: number): string => {
    return `£${price.toFixed(1)}m`;
  };

  const formatOwnership = (ownership: number): string => {
    return `${ownership.toFixed(1)}%`;
  };

  const formatScore = (score: number): string => {
    return score.toFixed(1);
  };

  const getStatusChip = () => {
    if (player.captain_score >= 80) return { text: 'TOP PICK', color: 'from-emerald-400 to-cyan-400' };
    if (player.ownership < 20) return { text: 'DIFFERENTIAL', color: 'from-orange-400 to-red-400' };
    if (player.ownership > 50) return { text: 'TEMPLATE', color: 'from-blue-400 to-purple-400' };
    return null;
  };

  const getRiskIndicator = () => {
    if (player.minutes_risk <= 20) return { color: 'bg-emerald-400', text: 'Low Risk', textColor: 'text-emerald-400' };
    if (player.minutes_risk <= 60) return { color: 'bg-amber-400', text: 'Medium Risk', textColor: 'text-amber-400' };
    return { color: 'bg-red-400', text: 'High Risk', textColor: 'text-red-400' };
  };

  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'GKP': return 'bg-yellow-400/20 text-yellow-400';
      case 'DEF': return 'bg-emerald-400/20 text-emerald-400';
      case 'MID': return 'bg-blue-400/20 text-blue-400';
      case 'FWD': return 'bg-red-400/20 text-red-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          card: 'p-4',
          name: 'text-lg',
          score: 'text-3xl',
          grid: 'grid-cols-2 gap-2',
          metric: 'text-sm',
        };
      case 'large':
        return {
          card: 'p-8',
          name: 'text-2xl',
          score: 'text-6xl',
          grid: 'grid-cols-2 gap-4',
          metric: 'text-lg',
        };
      default: // medium
        return {
          card: 'p-6',
          name: 'text-xl',
          score: 'text-4xl',
          grid: 'grid-cols-2 gap-3',
          metric: 'text-base',
        };
    }
  };

  const statusChip = getStatusChip();
  const riskIndicator = getRiskIndicator();
  const sizeClasses = getSizeClasses();

  const handleClick = () => {
    onClick?.(player);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl backdrop-blur-2xl
        cursor-pointer
        transition-all duration-300 transform hover:-translate-y-2 
        hover:shadow-2xl hover:shadow-black/20
        ${isSelected ? 'ring-2 ring-brand-coral bg-white/15' : ''}
        ${sizeClasses.card}
        ${className}
      `}
      data-side={side}
      style={{
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)'
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Select ${player.name} as captain candidate`}
      aria-pressed={isSelected}
    >
      {/* Top gradient border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-coral to-brand-golden" />
      
      {/* Status chip */}
      {statusChip && (
        <div className="absolute top-4 right-4">
          <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${statusChip.color} bg-opacity-20 backdrop-blur-sm`}>
            <span className="text-xs font-semibold text-white">{statusChip.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className={`${sizeClasses.name} font-bold text-white mb-2 truncate`}>
          {player.name}
        </h3>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center">
            <span className="text-xs font-bold text-brand-dark">{player.team}</span>
          </div>
          <span className={`px-3 py-1 rounded-xl text-sm font-semibold ${getPositionColor(player.position)}`}>
            {player.position}
          </span>
        </div>
      </div>

      {/* Captain Score - Hero Element */}
      <div className="text-center my-6">
        <div 
          className={`${sizeClasses.score} font-black bg-gradient-to-br from-brand-green to-brand-golden bg-clip-text text-transparent leading-none`}
          style={{ 
            filter: 'drop-shadow(0 0 8px rgba(2, 235, 174, 0.3))'
          }}
        >
          {formatScore(player.captain_score)}
        </div>
        <div className="text-gray-400 text-sm font-semibold mt-1">Captain Score</div>
      </div>

      {/* Metrics Grid */}
      <div className={`grid ${sizeClasses.grid} mb-4`}>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-gray-400 text-xs font-medium mb-1">Price</div>
          <div className={`text-white ${sizeClasses.metric} font-bold`}>{formatPrice(player.price)}</div>
        </div>
        
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-gray-400 text-xs font-medium mb-1">Ownership</div>
          <div className={`text-white ${sizeClasses.metric} font-bold`}>{formatOwnership(player.ownership)}</div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-gray-400 text-xs font-medium mb-1">Form</div>
          <div className={`text-white ${sizeClasses.metric} font-bold`}>{formatScore(player.form_score)}</div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
            <div 
              className="bg-gradient-to-r from-brand-coral to-brand-green h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((player.form_score / 15) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-gray-400 text-xs font-medium mb-1">Fixture</div>
          <div className="text-white text-sm font-bold mb-1">Diff: {player.fixture_difficulty}</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className={`w-2.5 h-2.5 rounded-full ${
                  star <= player.fixture_difficulty ? 'bg-brand-coral' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-gray-400 text-xs font-medium mb-1">xGI/90</div>
          <div className={`text-white ${sizeClasses.metric} font-bold`}>{formatScore(player.xgi_per_90)}</div>
        </div>

        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-gray-400 text-xs font-medium mb-1">Minutes Risk</div>
          <div className={`text-white ${sizeClasses.metric} font-bold`}>{player.minutes_risk.toFixed(0)}%</div>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${riskIndicator.color}`} />
            <span className={`text-xs font-medium ${riskIndicator.textColor}`}>
              {riskIndicator.text}
            </span>
          </div>
        </div>
      </div>

      {/* Ownership vs Expected Bar */}
      {player.expected_ownership && (
        <div className="bg-white/5 rounded-xl p-3 mb-4">
          <div className="text-gray-400 text-xs font-medium mb-2">Ownership vs Expected</div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div 
              className="bg-brand-green h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(player.ownership, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute inset-0 bg-brand-coral/10 rounded-2xl border-2 border-brand-coral pointer-events-none" />
      )}
    </div>
  );
};

export default PlayerCard;
