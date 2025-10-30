/**
 * Tennis Scoring System
 *
 * Implements tennis-style point and game scoring:
 * - Points: 0, 15, 30, 40, Deuce, Advantage
 * - Games: First to 6 games wins the set (with 2-game margin)
 */

/**
 * Tennis point values
 */
export const POINTS = {
  LOVE: 0,
  FIFTEEN: 15,
  THIRTY: 30,
  FORTY: 40,
  ADVANTAGE: 'AD',
  GAME: 'GAME'
};

/**
 * Point progression
 */
const POINT_PROGRESSION = [0, 15, 30, 40];

/**
 * Calculate next point state after a player wins a point
 *
 * @param {number} p1Points - Player 1's current points (0, 15, 30, 40)
 * @param {number} p2Points - Player 2's current points
 * @param {1|2} winner - Which player won the point (1 or 2)
 * @returns {object} - New game state
 */
export function calculateNextPoint(p1Points, p2Points, winner) {
  let newP1Points = p1Points;
  let newP2Points = p2Points;
  let deuce = false;
  let gameWinner = null;

  // Handle deuce scenarios
  if (p1Points === 40 && p2Points === 40) {
    deuce = true;
    if (winner === 1) {
      newP1Points = 'AD';
      newP2Points = 40;
      deuce = false;
    } else {
      newP1Points = 40;
      newP2Points = 'AD';
      deuce = false;
    }
  }
  // Handle advantage scenarios
  else if (p1Points === 'AD' || p2Points === 'AD') {
    if (p1Points === 'AD' && winner === 1) {
      // P1 wins the game
      gameWinner = 1;
    } else if (p2Points === 'AD' && winner === 2) {
      // P2 wins the game
      gameWinner = 2;
    } else {
      // Back to deuce
      newP1Points = 40;
      newP2Points = 40;
      deuce = true;
    }
  }
  // Normal point progression
  else {
    if (winner === 1) {
      if (p1Points === 40) {
        // P1 wins the game
        gameWinner = 1;
      } else {
        const currentIndex = POINT_PROGRESSION.indexOf(p1Points);
        newP1Points = POINT_PROGRESSION[currentIndex + 1];
      }
    } else {
      if (p2Points === 40) {
        // P2 wins the game
        gameWinner = 2;
      } else {
        const currentIndex = POINT_PROGRESSION.indexOf(p2Points);
        newP2Points = POINT_PROGRESSION[currentIndex + 1];
      }
    }

    // Check for deuce
    if (newP1Points === 40 && newP2Points === 40) {
      deuce = true;
    }
  }

  return {
    p1Points: newP1Points,
    p2Points: newP2Points,
    deuce,
    gameWinner
  };
}

/**
 * Reset points for a new game
 */
export function resetPoints() {
  return {
    p1Points: 0,
    p2Points: 0,
    deuce: false
  };
}

/**
 * Check if match is complete
 *
 * @param {number} p1Games - Number of games won by player 1
 * @param {number} p2Games - Number of games won by player 2
 * @returns {number|null} - Winner (1 or 2) or null if match continues
 */
export function checkMatchWinner(p1Games, p2Games) {
  // In MVP, we play a single set
  // Winner needs 6 games with at least 2-game margin
  // Or 7-6 in a tiebreak scenario (simplified for MVP)

  if (p1Games >= 6 && p1Games - p2Games >= 2) {
    return 1;
  }
  if (p2Games >= 6 && p2Games - p1Games >= 2) {
    return 2;
  }

  // Simplified: first to 6 games wins in MVP
  // TODO: Add tiebreak logic for future versions
  if (p1Games >= 6 && p1Games > p2Games) {
    return 1;
  }
  if (p2Games >= 6 && p2Games > p1Games) {
    return 2;
  }

  return null;
}

/**
 * Format score for display
 *
 * @param {number|string} p1Points - Player 1 points
 * @param {number|string} p2Points - Player 2 points
 * @param {boolean} deuce - Is it deuce?
 * @returns {string} - Formatted score like "30-15" or "Deuce" or "Advantage Player 1"
 */
export function formatScore(p1Points, p2Points, deuce = false) {
  if (deuce) {
    return 'Deuce';
  }

  if (p1Points === 'AD') {
    return 'Advantage Player 1';
  }

  if (p2Points === 'AD') {
    return 'Advantage Player 2';
  }

  // Convert 0 to "Love" for display
  const p1Display = p1Points === 0 ? 'Love' : p1Points;
  const p2Display = p2Points === 0 ? 'Love' : p2Points;

  return `${p1Display}-${p2Display}`;
}

/**
 * Calculate ELO rating change
 *
 * @param {number} winnerElo - Winner's current ELO
 * @param {number} loserElo - Loser's current ELO
 * @param {number} K - K-factor (default 24)
 * @returns {object} - { winnerNewElo, loserNewElo, change }
 */
export function calculateEloChange(winnerElo, loserElo, K = 24) {
  // Expected scores
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 - expectedWinner;

  // Calculate changes
  const winnerChange = Math.round(K * (1 - expectedWinner));
  const loserChange = Math.round(K * (0 - expectedLoser));

  return {
    winnerNewElo: winnerElo + winnerChange,
    loserNewElo: loserElo + loserChange,
    change: winnerChange
  };
}

/**
 * Get game state summary
 */
export function getGameStateSummary(rally, match) {
  return {
    score: formatScore(rally.p1_points, rally.p2_points, rally.deuce),
    games: {
      player1: match.score_p1,
      player2: match.score_p2
    },
    currentTurn: rally.current_turn,
    category: rally.category?.title || 'Unknown',
    answersGiven: rally.answers?.length || 0
  };
}

export default {
  calculateNextPoint,
  resetPoints,
  checkMatchWinner,
  formatScore,
  calculateEloChange,
  getGameStateSummary,
  POINTS
};
