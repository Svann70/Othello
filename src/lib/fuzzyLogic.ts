/**
 * Simplified Fuzzy Logic for AI Visualization
 * Lightweight version for web performance
 */

import type { Board, Player } from './gameLogic';
import { getValidMoves, countPieces } from './gameLogic';

export interface FuzzyGameState {
  gamePhase: {
    early: number;
    mid: number;
    late: number;
  };
  mobility: {
    low: number;
    medium: number;
    high: number;
  };
  cornerControl: {
    weak: number;
    moderate: number;
    strong: number;
  };
  stability: {
    unstable: number;
    neutral: number;
    stable: number;
  };
}

// Simple triangular membership function
function triangular(x: number, a: number, b: number, c: number): number {
  if (x <= a || x >= c) return 0;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

// Trapezoidal membership for edge cases
function trapezoidal(x: number, a: number, b: number, c: number, d: number): number {
  if (x <= a || x >= d) return 0;
  if (x < b) return (x - a) / (b - a);
  if (x <= c) return 1;
  return (d - x) / (d - c);
}

// Calculate fuzzy game state
export function calculateFuzzyState(board: Board, player: Player): FuzzyGameState {
  const pieces = countPieces(board);
  const totalPieces = pieces.black + pieces.white;
  const progress = totalPieces / 64;
  
  // Count corners
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  let playerCorners = 0;
  for (const [row, col] of corners) {
    if (board[row][col] === player) playerCorners++;
  }
  
  // Mobility
  const moves = getValidMoves(board, player).length;
  const maxMoves = 12; // Approximate max possible moves
  
  // Game phase fuzzy sets
  const gamePhase = {
    early: trapezoidal(progress, -0.1, 0, 0.2, 0.35),
    mid: triangular(progress, 0.2, 0.5, 0.8),
    late: trapezoidal(progress, 0.65, 0.8, 1, 1.1),
  };
  
  // Normalize
  const phaseSum = gamePhase.early + gamePhase.mid + gamePhase.late || 1;
  gamePhase.early /= phaseSum;
  gamePhase.mid /= phaseSum;
  gamePhase.late /= phaseSum;
  
  // Mobility fuzzy sets
  const mobilityNorm = moves / maxMoves;
  const mobility = {
    low: trapezoidal(mobilityNorm, -0.1, 0, 0.2, 0.4),
    medium: triangular(mobilityNorm, 0.2, 0.5, 0.8),
    high: trapezoidal(mobilityNorm, 0.6, 0.8, 1, 1.1),
  };
  
  const mobSum = mobility.low + mobility.medium + mobility.high || 1;
  mobility.low /= mobSum;
  mobility.medium /= mobSum;
  mobility.high /= mobSum;
  
  // Corner control fuzzy sets
  const cornerNorm = playerCorners / 4;
  const cornerControl = {
    weak: trapezoidal(cornerNorm, -0.1, 0, 0.1, 0.3),
    moderate: triangular(cornerNorm, 0.1, 0.5, 0.8),
    strong: trapezoidal(cornerNorm, 0.5, 0.75, 1, 1.1),
  };
  
  const cornerSum = cornerControl.weak + cornerControl.moderate + cornerControl.strong || 1;
  cornerControl.weak /= cornerSum;
  cornerControl.moderate /= cornerSum;
  cornerControl.strong /= cornerSum;
  
  // Stability (simplified - based on corners and edges)
  const playerPieces = player === 'black' ? pieces.black : pieces.white;
  const stableRatio = (playerCorners * 8 + playerPieces) / (64 + 32);
  
  const stability = {
    unstable: trapezoidal(stableRatio, -0.1, 0, 0.2, 0.4),
    neutral: triangular(stableRatio, 0.2, 0.5, 0.8),
    stable: trapezoidal(stableRatio, 0.6, 0.8, 1, 1.1),
  };
  
  const stabSum = stability.unstable + stability.neutral + stability.stable || 1;
  stability.unstable /= stabSum;
  stability.neutral /= stabSum;
  stability.stable /= stabSum;
  
  return {
    gamePhase,
    mobility,
    cornerControl,
    stability,
  };
}
