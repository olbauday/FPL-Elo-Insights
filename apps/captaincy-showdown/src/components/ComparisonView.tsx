import React from 'react';
import type { CaptainCandidate } from '../types';
import PlayerCard from './PlayerCard';
import VersusIndicator from './VersusIndicator';
import ScoreDeltaBadge from './ScoreDeltaBadge';

interface ComparisonViewProps {
  candidateA: CaptainCandidate | null;
  candidateB: CaptainCandidate | null;
  onSelectPlayerA?: (player: CaptainCandidate) => void;
  onSelectPlayerB?: (player: CaptainCandidate) => void;
  size?: 'small' | 'medium' | 'large';
  layout?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * ComparisonView component displays two captain candidates side by side
 * Responsive layout that adapts to different screen sizes
 */
export const ComparisonView: React.FC<ComparisonViewProps> = ({
  candidateA,
  candidateB,
  onSelectPlayerA,
  onSelectPlayerB,
  size = 'medium',
  layout = 'horizontal',
  className = '',
}) => {
  const getLayoutClasses = (): string => {
    if (layout === 'vertical') {
      return 'flex flex-col space-y-4';
    }
    
    // Responsive horizontal layout
    return `
      flex flex-col lg:flex-row 
      space-y-4 lg:space-y-0 lg:space-x-4 
      items-center lg:items-stretch
    `;
  };

  const getCardContainerClasses = (): string => {
    return 'flex-1 w-full max-w-sm lg:max-w-none';
  };

  const getVersusContainerClasses = (): string => {
    if (layout === 'vertical') {
      return 'flex flex-col items-center justify-center gap-2 py-2';
    }
    return 'flex flex-col lg:flex-col items-center justify-center gap-2 lg:px-4';
  };

  // Placeholder component for empty slots
  const EmptyPlayerSlot: React.FC<{ 
    side: 'left' | 'right';
    onSelect?: (player: CaptainCandidate) => void;
  }> = ({ side }) => (
    <div
      className={`
        ${getCardContainerClasses()}
        border-2 border-dashed border-gray-300 
        rounded-lg p-8 
        flex flex-col items-center justify-center 
        text-gray-500 
        hover:border-gray-400 hover:bg-gray-50 
        transition-colors duration-200
        cursor-pointer
        min-h-[300px]
      `}
      onClick={() => {
        // This would trigger a player selection modal/dropdown
        console.log(`Select player for ${side} side`);
      }}
      role="button"
      tabIndex={0}
      aria-label={`Select captain candidate for ${side} side`}
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
        </div>
        <p className="font-medium">Select Player {side === 'left' ? 'A' : 'B'}</p>
        <p className="text-sm mt-1">Click to choose a captain candidate</p>
      </div>
    </div>
  );

  return (
    <div 
      className={`
        w-full max-w-6xl mx-auto p-4
        ${getLayoutClasses()}
        ${className}
      `}
      role="region"
      aria-label="Captain candidate comparison"
    >
      {/* Player A */}
      <div className={getCardContainerClasses()}>
        {candidateA ? (
          <PlayerCard
            player={candidateA}
            side="left"
            size={size}
            onClick={onSelectPlayerA}
            isSelected={!!candidateA}
          />
        ) : (
          <EmptyPlayerSlot side="left" onSelect={onSelectPlayerA} />
        )}
      </div>

      {/* Versus Indicator + optional delta badge */}
      <div className={getVersusContainerClasses()}>
        <VersusIndicator size={size} />
        <ScoreDeltaBadge a={candidateA ?? undefined} b={candidateB ?? undefined} size={size} />
      </div>

      {/* Player B */}
      <div className={getCardContainerClasses()}>
        {candidateB ? (
          <PlayerCard
            player={candidateB}
            side="right"
            size={size}
            onClick={onSelectPlayerB}
            isSelected={!!candidateB}
          />
        ) : (
          <EmptyPlayerSlot side="right" onSelect={onSelectPlayerB} />
        )}
      </div>

      {/* Comparison Summary (optional) */}
      {candidateA && candidateB && (
        <div className="w-full mt-6 lg:mt-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
              Quick Comparison
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-600">Better Score</div>
                <div className="text-lg font-bold mt-1">
                  {candidateA.captain_score > candidateB.captain_score ? (
                    <span className="text-green-600">{candidateA.name}</span>
                  ) : candidateA.captain_score < candidateB.captain_score ? (
                    <span className="text-green-600">{candidateB.name}</span>
                  ) : (
                    <span className="text-gray-500">Tie</span>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-gray-600">Price Diff</div>
                <div className="text-lg font-bold mt-1">
                  £{Math.abs(candidateA.price - candidateB.price).toFixed(1)}m
                </div>
              </div>
              
              <div className="text-center">
                <div className="font-medium text-gray-600">Ownership Diff</div>
                <div className="text-lg font-bold mt-1">
                  {Math.abs(candidateA.ownership - candidateB.ownership).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonView;
