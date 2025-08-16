import React from 'react';

interface VersusIndicatorProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  className?: string;
}

/**
 * VersusIndicator component displays the "VS" element between two player cards
 * Responsive and supports different sizes and animations
 */
export const VersusIndicator: React.FC<VersusIndicatorProps> = ({
  size = 'medium',
  animated = true,
  className = '',
}) => {
  const getSizeClasses = (size: string): string => {
    switch (size) {
      case 'small': return 'w-12 h-12 text-xl';
      case 'large': return 'w-20 h-20 text-4xl';
      default: return 'w-16 h-16 text-2xl md:text-3xl';
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          bg-gradient-to-br from-blue-500 to-purple-600 
          text-white font-bold rounded-full 
          flex items-center justify-center 
          shadow-lg border-4 border-white
          ${getSizeClasses(size)}
          ${animated ? 'transform hover:scale-110 transition-transform duration-200' : ''}
        `}
        role="separator"
        aria-label="versus"
      >
        <span className="transform -translate-y-0.5">VS</span>
      </div>
    </div>
  );
};

export default VersusIndicator;
