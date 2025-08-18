import React from 'react';
import type { CaptainCandidate } from '../types';

interface ScoreDeltaBadgeProps {
  a?: CaptainCandidate | null;
  b?: CaptainCandidate | null;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Compact badge showing the captain_score delta between candidates A and B.
 */
const ScoreDeltaBadge: React.FC<ScoreDeltaBadgeProps> = ({ a, b, size = 'medium', className = '' }) => {
  if (!a || !b) return null;
  const raw = (a.captain_score ?? 0) - (b.captain_score ?? 0);
  const abs = Math.abs(raw);
  const leader = raw === 0 ? 'Tie' : raw > 0 ? a.name : b.name;
  const sign = raw > 0 ? '+' : raw < 0 ? '−' : '';

  const sizeClasses = (() => {
    switch (size) {
      case 'small':
        return 'text-xs px-2 py-1';
      case 'large':
        return 'text-sm md:text-base px-3 py-1.5';
      default:
        return 'text-sm px-3 py-1';
    }
  })();

  const colorClasses = raw === 0
    ? 'bg-gray-100 text-gray-700 border-gray-200'
    : raw > 0
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-indigo-100 text-indigo-800 border-indigo-200';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${colorClasses} ${sizeClasses} ${className}`}
      role="status"
      aria-label="score delta"
    >
      <span className="font-medium">Score Δ</span>
      <span className="font-bold tabular-nums">{sign}{abs.toFixed(1)}</span>
      <span className="hidden sm:inline text-xs">{leader}</span>
    </div>
  );
};

export default ScoreDeltaBadge;
