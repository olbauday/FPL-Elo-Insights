import React from 'react';
import type { CaptainCandidate } from '../types';

interface EnhancedPlayerCardProps {
  player: CaptainCandidate;
  onClick?: (player: CaptainCandidate) => void;
  isSelected?: boolean;
  showFloatingStats?: boolean;
  className?: string;
}

/**
 * Enhanced PlayerCard component with glassmorphism design and brand colors
 * Based on the mockup design with modern visual elements
 */
export const EnhancedPlayerCard: React.FC<EnhancedPlayerCardProps> = ({
  player,
  onClick,
  isSelected = false,
  showFloatingStats = true,
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

  const getPositionColor = (position: string): string => {
    switch (position) {
      case 'GKP': return 'bg-yellow-500 bg-opacity-20 text-yellow-300 border-yellow-500 border-opacity-30';
      case 'DEF': return 'bg-green-500 bg-opacity-20 text-green-300 border-green-500 border-opacity-30';
      case 'MID': return 'bg-blue-500 bg-opacity-20 text-blue-300 border-blue-500 border-opacity-30';
      case 'FWD': return 'bg-red-500 bg-opacity-20 text-red-300 border-red-500 border-opacity-30';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-300 border-gray-500 border-opacity-30';
    }
  };

  const getTeamBadge = (team: string): string => {
    // Return team initials for now - can be enhanced with actual badges later
    return team.substring(0, 3).toUpperCase();
  };

  const getRiskColor = (risk: number): { dot: string; text: string; label: string } => {
    if (risk <= 20) return { 
      dot: 'w-2 h-2 rounded-full', 
      text: 'text-xs font-semibold', 
      label: 'Low Risk' 
    };
    if (risk <= 60) return { 
      dot: 'w-2 h-2 rounded-full', 
      text: 'text-xs font-semibold', 
      label: 'Medium Risk' 
    };
    return { 
      dot: 'w-2 h-2 rounded-full', 
      text: 'text-xs font-semibold', 
      label: 'High Risk' 
    };
  };

  const getFloatingStatLabel = (player: CaptainCandidate): string | null => {
    if (player.captain_score >= 80) return 'TOP PICK';
    if (player.ownership < 30) return 'DIFFERENTIAL';
    if (player.ownership > 60) return 'TEMPLATE';
    return null;
  };

  const renderFixtureDifficulty = (difficulty: number[]): JSX.Element => {
    return (
      <div className="flex gap-1 mt-2">
        {difficulty.slice(0, 5).map((diff, index) => {
          let bgColor = '#02EBAE'; // Low difficulty - green
          if (diff > 3) bgColor = '#FF6A4D'; // High difficulty - coral
          else if (diff > 2) bgColor = '#F2C572'; // Medium difficulty - golden
          
          return (
            <div
              key={index}
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: bgColor }}
            />
          );
        })}
      </div>
    );
  };

  const renderFormBar = (form_score: number): JSX.Element => {
    const formPercentage = Math.min((form_score / 15) * 100, 100); // Assuming max form is ~15
    return (
      <div 
        className="w-full h-2 rounded-full overflow-hidden mt-2"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${formPercentage}%`,
            background: 'linear-gradient(to right, #FF6A4D, #02EBAE)'
          }}
        />
      </div>
    );
  };

  const riskData = getRiskColor(player.minutes_risk);
  const floatingLabel = getFloatingStatLabel(player);
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(player);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Glassmorphism Card */}
      <div
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer
          bg-white bg-opacity-10 backdrop-blur-xl border border-white border-opacity-20
          hover:bg-opacity-15 hover:shadow-2xl hover:shadow-black hover:shadow-opacity-20
          transition-all duration-300 hover:-translate-y-2
          ${isSelected ? 'ring-2 ring-brand-coral shadow-lg' : ''}
          p-6
        `}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(255, 255, 255, 0.12)'
        }}
        onClick={() => onClick?.(player)}
  onKeyDown={handleKeyDown}
  tabIndex={0}
  role="button"
  aria-label={`Select ${player.name} as captain candidate`}
  aria-pressed={isSelected}
      >
        {/* Top accent gradient bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(to right, #FF6A4D, #F2C572)'
          }}
        />

        {/* Floating Stats */}
        {showFloatingStats && floatingLabel && (
          <div className="absolute top-5 right-5">
            <div 
              className="text-brand-green px-3 py-1 rounded-xl text-xs font-bold border border-brand-green border-opacity-30"
              style={{
                backgroundColor: 'rgba(2, 235, 174, 0.2)',
                borderColor: 'rgba(2, 235, 174, 0.3)'
              }}
            >
              {floatingLabel}
            </div>
          </div>
        )}

        {/* Player Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-xl truncate flex-1">
            {player.name}
          </h3>
        </div>

        {/* Team Info */}
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: '#02EBAE', color: '#211F29' }}
          >
            {getTeamBadge(player.team)}
          </div>
          <div className={`px-3 py-1 rounded-xl text-sm font-semibold border ${getPositionColor(player.position)}`}>
            {player.position === 'GKP' ? 'Goalkeeper' :
             player.position === 'DEF' ? 'Defender' :
             player.position === 'MID' ? 'Midfielder' : 'Forward'}
          </div>
        </div>

        {/* Captain Score - Most Prominent */}
        <div className="text-center mb-6">
          <div 
            className="text-6xl font-black leading-none mb-2"
            style={{
              background: 'linear-gradient(135deg, #02EBAE, #F2C572)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {formatScore(player.captain_score)}
          </div>
          <div className="text-white text-opacity-60 text-sm font-semibold uppercase tracking-wide">
            Captain Score
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Price */}
          <div 
            className="rounded-xl p-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="text-white text-opacity-60 text-xs font-medium mb-1">Price</div>
            <div className="text-white font-bold text-lg">{formatPrice(player.price)}</div>
          </div>

          {/* Ownership */}
          <div 
            className="rounded-xl p-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="text-white text-opacity-60 text-xs font-medium mb-1">Ownership</div>
            <div className="text-white font-bold text-lg">{formatOwnership(player.ownership)}</div>
          </div>

          {/* Form with progress bar */}
          <div 
            className="rounded-xl p-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="text-white text-opacity-60 text-xs font-medium mb-1">Form</div>
            <div className="text-white font-bold text-lg mb-1">{formatScore(player.form_score)}</div>
            {renderFormBar(player.form_score)}
          </div>

          {/* Fixture */}
          <div 
            className="rounded-xl p-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="text-white text-opacity-60 text-xs font-medium mb-1">Fixture</div>
            <div className="text-white font-bold text-sm">Difficulty: {player.fixture_difficulty}/5</div>
            {renderFixtureDifficulty([player.fixture_difficulty, player.fixture_difficulty, player.fixture_difficulty, player.fixture_difficulty, player.fixture_difficulty])}
          </div>

          {/* xGI/90 */}
          <div 
            className="rounded-xl p-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="text-white text-opacity-60 text-xs font-medium mb-1">xGI/90</div>
            <div className="text-white font-bold text-lg">{formatScore(player.xgi_per_90)}</div>
          </div>

          {/* Minutes Risk */}
          <div 
            className="rounded-xl p-3"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="text-white text-opacity-60 text-xs font-medium mb-1">Minutes Risk</div>
            <div className="text-white font-bold text-lg mb-2">{player.minutes_risk}%</div>
            <div className="flex items-center gap-2">
              <div 
                className={riskData.dot}
                style={{ 
                  backgroundColor: player.minutes_risk <= 20 ? '#02EBAE' : 
                                 player.minutes_risk <= 60 ? '#F2C572' : '#FF6A4D'
                }}
              />
              <span 
                className={riskData.text}
                style={{ 
                  color: player.minutes_risk <= 20 ? '#02EBAE' : 
                        player.minutes_risk <= 60 ? '#F2C572' : '#FF6A4D'
                }}
              >
                {riskData.label}
              </span>
            </div>
          </div>
        </div>

        {/* Ownership vs Expected Bar */}
        <div 
          className="rounded-xl p-3"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <div className="text-white text-opacity-60 text-xs font-medium mb-2">Ownership vs Expected</div>
          <div 
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(player.ownership, 100)}%`,
                backgroundColor: '#02EBAE'
              }}
            />
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div 
              className="text-white px-4 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: '#FF6A4D' }}
            >
              SELECTED
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPlayerCard;
