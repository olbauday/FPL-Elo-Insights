/**
 * Socket.IO Handler for Real-time Gameplay
 *
 * Manages WebSocket connections and game state updates
 */

import { validateAnswer, createVerifiedFact } from './validation-engine.js';
import {
  calculateNextPoint,
  resetPoints,
  checkMatchWinner,
  calculateEloChange,
  getGameStateSummary
} from './tennis-scoring.js';

// Track active games and player connections
const activeGames = new Map();
const playerSockets = new Map();

/**
 * Setup Socket.IO event handlers
 */
export function setupSocketHandlers(io, supabase) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Player authentication
    socket.on('authenticate', async (data) => {
      const { userId, username } = data;
      socket.userId = userId;
      socket.username = username;
      playerSockets.set(userId, socket.id);

      console.log(`✅ User authenticated: ${username} (${userId})`);
      socket.emit('authenticated', { success: true, userId, username });
    });

    // Create or join match
    socket.on('join_match', async (data) => {
      const { matchId, userId } = data;

      try {
        // Fetch match from database
        const { data: match, error } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();

        if (error || !match) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }

        // Join socket room
        socket.join(matchId);
        socket.matchId = matchId;

        // Update match if player2 is joining
        if (!match.player2 && match.player1 !== userId) {
          await supabase
            .from('matches')
            .update({ player2: userId, status: 'active' })
            .eq('id', matchId);

          // Start first rally
          await startNewRally(matchId, supabase, io);
        }

        // Emit match state to both players
        const updatedMatch = await getMatchState(matchId, supabase);
        io.to(matchId).emit('match_update', updatedMatch);

      } catch (error) {
        console.error('Error joining match:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Submit answer
    socket.on('submit_answer', async (data) => {
      const { matchId, rallyId, userId, answer } = data;
      const startTime = Date.now();

      try {
        // Fetch current rally
        const { data: rally, error: rallyError } = await supabase
          .from('rallies')
          .select('*, category:category_id(*)')
          .eq('id', rallyId)
          .single();

        if (rallyError || !rally) {
          socket.emit('error', { message: 'Rally not found' });
          return;
        }

        // Check if it's this player's turn
        if (rally.current_turn !== userId) {
          socket.emit('error', { message: 'Not your turn' });
          return;
        }

        // Get used answers
        const usedAnswers = rally.answers || [];

        // Validate answer
        const validation = await validateAnswer(
          answer,
          rally.category,
          usedAnswers,
          supabase
        );

        const timeTaken = Date.now() - startTime;

        // Record answer submission
        await supabase.from('answer_submissions').insert({
          rally_id: rallyId,
          user_id: userId,
          answer: answer,
          valid: validation.valid,
          reason: validation.reason,
          entity_id: validation.entity?.id || null,
          verification_method: validation.method,
          time_taken: `${timeTaken}ms`
        });

        // Update rally answers array
        const updatedAnswers = [
          ...usedAnswers,
          {
            userId,
            answer,
            valid: validation.valid,
            reason: validation.reason,
            timestamp: new Date().toISOString()
          }
        ];

        await supabase
          .from('rallies')
          .update({ answers: updatedAnswers })
          .eq('id', rallyId);

        // If LLM verified a new fact, create it
        if (validation.needsFactCreation && validation.entity) {
          await createVerifiedFact(validation.entity, rally.category, supabase);
        }

        // Emit validation result
        io.to(matchId).emit('answer_result', {
          userId,
          answer,
          valid: validation.valid,
          reason: validation.reason,
          entity: validation.entity
        });

        // Handle point scoring
        if (validation.valid) {
          // Valid answer - switch turn
          const { data: match } = await supabase
            .from('matches')
            .select('*')
            .eq('id', matchId)
            .single();

          const nextTurn = userId === match.player1 ? match.player2 : match.player1;

          await supabase
            .from('rallies')
            .update({ current_turn: nextTurn })
            .eq('id', rallyId);

          io.to(matchId).emit('turn_change', { nextTurn });
        } else {
          // Invalid answer - opponent wins the point
          await handlePointWon(matchId, rallyId, userId, false, supabase, io);
        }

      } catch (error) {
        console.error('Error submitting answer:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Timeout (player ran out of time)
    socket.on('timeout', async (data) => {
      const { matchId, rallyId, userId } = data;

      try {
        // Opponent wins the point
        await handlePointWon(matchId, rallyId, userId, false, supabase, io);
      } catch (error) {
        console.error('Error handling timeout:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`👋 Client disconnected: ${socket.id}`);

      if (socket.userId) {
        playerSockets.delete(socket.userId);
      }

      // Handle match abandonment if needed
      // TODO: Implement abandonment logic
    });
  });
}

/**
 * Handle point won
 */
async function handlePointWon(matchId, rallyId, losingUserId, supabase, io) {
  // Fetch match and rally
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  const { data: rally } = await supabase
    .from('rallies')
    .select('*')
    .eq('id', rallyId)
    .single();

  // Determine winner of this point
  const pointWinner = losingUserId === match.player1 ? 2 : 1;

  // Calculate new point state
  const pointState = calculateNextPoint(
    rally.p1_points,
    rally.p2_points,
    pointWinner
  );

  // Update rally
  await supabase
    .from('rallies')
    .update({
      p1_points: pointState.p1Points,
      p2_points: pointState.p2Points,
      deuce: pointState.deuce
    })
    .eq('id', rallyId);

  // Emit point update
  io.to(matchId).emit('point_update', {
    p1Points: pointState.p1Points,
    p2Points: pointState.p2Points,
    deuce: pointState.deuce
  });

  // Check if game is won
  if (pointState.gameWinner) {
    await handleGameWon(matchId, rallyId, pointState.gameWinner, supabase, io);
  }
}

/**
 * Handle game won (tennis "game")
 */
async function handleGameWon(matchId, rallyId, gameWinner, supabase, io) {
  // Update match score
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  const newP1Score = gameWinner === 1 ? match.score_p1 + 1 : match.score_p1;
  const newP2Score = gameWinner === 2 ? match.score_p2 + 1 : match.score_p2;

  await supabase
    .from('matches')
    .update({
      score_p1: newP1Score,
      score_p2: newP2Score
    })
    .eq('id', matchId);

  // Complete current rally
  const winnerUserId = gameWinner === 1 ? match.player1 : match.player2;

  await supabase
    .from('rallies')
    .update({
      status: 'completed',
      winner: winnerUserId,
      completed_at: new Date().toISOString()
    })
    .eq('id', rallyId);

  io.to(matchId).emit('game_won', {
    winner: gameWinner,
    score: { p1: newP1Score, p2: newP2Score }
  });

  // Check for match winner
  const matchWinner = checkMatchWinner(newP1Score, newP2Score);

  if (matchWinner) {
    await handleMatchWon(matchId, matchWinner, supabase, io);
  } else {
    // Start new rally
    await startNewRally(matchId, supabase, io);
  }
}

/**
 * Handle match won
 */
async function handleMatchWon(matchId, matchWinner, supabase, io) {
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  const winnerUserId = matchWinner === 1 ? match.player1 : match.player2;
  const loserUserId = matchWinner === 1 ? match.player2 : match.player1;

  // Get player stats
  const { data: winnerStats } = await supabase
    .from('user_stats')
    .select('elo')
    .eq('user_id', winnerUserId)
    .single();

  const { data: loserStats } = await supabase
    .from('user_stats')
    .select('elo')
    .eq('user_id', loserUserId)
    .single();

  // Calculate ELO changes
  const eloChange = calculateEloChange(
    winnerStats.elo,
    loserStats.elo
  );

  // Update match
  await supabase
    .from('matches')
    .update({
      status: 'completed',
      winner: winnerUserId,
      completed_at: new Date().toISOString()
    })
    .eq('id', matchId);

  // Update user stats (trigger will handle most of this)
  await supabase
    .from('user_stats')
    .update({ elo: eloChange.winnerNewElo })
    .eq('user_id', winnerUserId);

  await supabase
    .from('user_stats')
    .update({ elo: eloChange.loserNewElo })
    .eq('user_id', loserUserId);

  // Emit match result
  io.to(matchId).emit('match_complete', {
    winner: matchWinner,
    winnerUserId,
    eloChange: eloChange.change,
    finalScore: {
      p1: match.score_p1,
      p2: match.score_p2
    }
  });
}

/**
 * Start a new rally
 */
async function startNewRally(matchId, supabase, io) {
  // Get random category
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('active', true);

  const randomCategory = categories[Math.floor(Math.random() * categories.length)];

  // Get match
  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  // Create new rally
  const { data: rally } = await supabase
    .from('rallies')
    .insert({
      match_id: matchId,
      category_id: randomCategory.id,
      status: 'active',
      current_turn: match.player1, // Player 1 starts
      p1_points: 0,
      p2_points: 0,
      deuce: false,
      answers: []
    })
    .select('*, category:category_id(*)')
    .single();

  // Update match with current rally
  await supabase
    .from('matches')
    .update({ current_rally: rally.id })
    .eq('id', matchId);

  // Emit new rally to players
  io.to(matchId).emit('new_rally', {
    rallyId: rally.id,
    category: rally.category,
    currentTurn: rally.current_turn
  });
}

/**
 * Get current match state
 */
async function getMatchState(matchId, supabase) {
  const { data: match } = await supabase
    .from('matches')
    .select(`
      *,
      player1:player1(username),
      player2:player2(username),
      current_rally(*, category:category_id(*))
    `)
    .eq('id', matchId)
    .single();

  return match;
}

export { setupSocketHandlers, activeGames, playerSockets };
