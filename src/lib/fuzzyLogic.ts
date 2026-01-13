/**
 * Enhanced Fuzzy Logic System for Othello AI
 * Implements membership functions and fuzzy rules for game evaluation
 */

import { Board, Player, getOpponent, getValidMoves, countPieces } from './gameLogic';

// Fuzzy membership function types
export type FuzzyValue = number; // 0.0 to 1.0

export interface FuzzyGameState {
  gamePhase: {
    early: FuzzyValue;
    mid: FuzzyValue;
    late: FuzzyValue;
  };
  mobility: {
    low: FuzzyValue;
    medium: FuzzyValue;
    high: FuzzyValue;
  };
  cornerControl: {
    weak: FuzzyValue;
    moderate: FuzzyValue;
    strong: FuzzyValue;
  };
  stability: {
    unstable: FuzzyValue;
    neutral: FuzzyValue;
    stable: FuzzyValue;
  };
  pieceAdvantage: {
    losing: FuzzyValue;
    even: FuzzyValue;
    winning: FuzzyValue;
  };
}

export interface FuzzyEvaluationResult {
  finalScore: number;
  fuzzyState: FuzzyGameState;
  weights: {
    position: number;
    mobility: number;
    corner: number;
    stability: number;
    pieces: number;
  };
}

/**
 * Triangular membership function
 */
function triangular(x: number, a: number, b: number, c: number): FuzzyValue {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

/**
 * Trapezoidal membership function
 */
function trapezoidal(x: number, a: number, b: number, c: number, d: number): FuzzyValue {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

/**
 * Calculate game phase membership values
 * Based on total pieces on board (4-64)
 */
function calculateGamePhase(totalPieces: number): FuzzyGameState['gamePhase'] {
  const normalized = (totalPieces - 4) / 60; // 0 to 1
  
  return {
    early: trapezoidal(normalized, -0.1, 0, 0.2, 0.35),
    mid: triangular(normalized, 0.2, 0.5, 0.75),
    late: trapezoidal(normalized, 0.6, 0.8, 1.0, 1.1),
  };
}

/**
 * Calculate mobility membership values
 * Based on ratio of valid moves
 */
function calculateMobility(
  playerMoves: number, 
  opponentMoves: number
): FuzzyGameState['mobility'] {
  const total = playerMoves + opponentMoves;
  if (total === 0) return { low: 1, medium: 0, high: 0 };
  
  const ratio = playerMoves / Math.max(total, 1);
  
  return {
    low: trapezoidal(ratio, -0.1, 0, 0.25, 0.4),
    medium: triangular(ratio, 0.3, 0.5, 0.7),
    high: trapezoidal(ratio, 0.6, 0.75, 1.0, 1.1),
  };
}

/**
 * Calculate corner control membership values
 */
function calculateCornerControl(
  board: Board, 
  player: Player
): FuzzyGameState['cornerControl'] {
  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: 7 },
    { row: 7, col: 0 },
    { row: 7, col: 7 },
  ];
  
  const opponent = getOpponent(player);
  let playerCorners = 0;
  let opponentCorners = 0;
  
  for (const corner of corners) {
    if (board[corner.row][corner.col] === player) playerCorners++;
    else if (board[corner.row][corner.col] === opponent) opponentCorners++;
  }
  
  const advantage = (playerCorners - opponentCorners + 4) / 8; // 0 to 1
  
  return {
    weak: trapezoidal(advantage, -0.1, 0, 0.3, 0.45),
    moderate: triangular(advantage, 0.35, 0.5, 0.65),
    strong: trapezoidal(advantage, 0.55, 0.7, 1.0, 1.1),
  };
}

/**
 * Calculate piece stability (pieces that cannot be flipped)
 */
function calculateStability(board: Board, player: Player): FuzzyGameState['stability'] {
  let stablePieces = 0;
  let totalPlayerPieces = 0;
  
  // Corner pieces are always stable
  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: 7 },
    { row: 7, col: 0 },
    { row: 7, col: 7 },
  ];
  
  for (const corner of corners) {
    if (board[corner.row][corner.col] === player) stablePieces++;
  }
  
  // Count edge pieces adjacent to corners
  const edges = [
    { row: 0, cols: [1, 2, 5, 6] },
    { row: 7, cols: [1, 2, 5, 6] },
  ];
  
  for (const edge of edges) {
    for (const col of edge.cols) {
      if (board[edge.row][col] === player) {
        // Check if connected to a corner
        if (col < 3 && board[edge.row][0] === player) stablePieces += 0.5;
        if (col > 4 && board[edge.row][7] === player) stablePieces += 0.5;
      }
    }
  }
  
  // Count total player pieces
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === player) totalPlayerPieces++;
    }
  }
  
  const ratio = totalPlayerPieces > 0 ? stablePieces / totalPlayerPieces : 0;
  
  return {
    unstable: trapezoidal(ratio, -0.1, 0, 0.15, 0.3),
    neutral: triangular(ratio, 0.2, 0.4, 0.6),
    stable: trapezoidal(ratio, 0.5, 0.7, 1.0, 1.1),
  };
}

/**
 * Calculate piece advantage membership
 */
function calculatePieceAdvantage(
  playerPieces: number, 
  opponentPieces: number
): FuzzyGameState['pieceAdvantage'] {
  const total = playerPieces + opponentPieces;
  if (total === 0) return { losing: 0, even: 1, winning: 0 };
  
  const ratio = playerPieces / total;
  
  return {
    losing: trapezoidal(ratio, -0.1, 0, 0.35, 0.45),
    even: triangular(ratio, 0.4, 0.5, 0.6),
    winning: trapezoidal(ratio, 0.55, 0.65, 1.0, 1.1),
  };
}

/**
 * Apply fuzzy rules to determine evaluation weights
 */
function applyFuzzyRules(state: FuzzyGameState): FuzzyEvaluationResult['weights'] {
  // Rule 1: Early game - prioritize mobility and corners
  const earlyWeight = state.gamePhase.early;
  
  // Rule 2: Mid game - balance all factors
  const midWeight = state.gamePhase.mid;
  
  // Rule 3: Late game - prioritize piece count
  const lateWeight = state.gamePhase.late;
  
  // Rule 4: If corner control is strong, increase position weight
  const cornerBonus = state.cornerControl.strong * 0.3;
  
  // Rule 5: If mobility is low, increase mobility importance
  const mobilityBonus = state.mobility.low * 0.2;
  
  // Calculate weighted factors using fuzzy inference
  const positionWeight = 
    earlyWeight * 1.2 + 
    midWeight * 1.0 + 
    lateWeight * 0.5 + 
    cornerBonus;
  
  const mobilityWeight = 
    earlyWeight * 1.3 + 
    midWeight * 1.0 + 
    lateWeight * 0.3 + 
    mobilityBonus;
  
  const cornerWeight = 
    earlyWeight * 1.5 + 
    midWeight * 1.2 + 
    lateWeight * 0.8;
  
  const stabilityWeight = 
    earlyWeight * 0.5 + 
    midWeight * 1.0 + 
    lateWeight * 1.3;
  
  const piecesWeight = 
    earlyWeight * 0.2 + 
    midWeight * 0.5 + 
    lateWeight * 1.5;
  
  // Normalize weights
  const total = positionWeight + mobilityWeight + cornerWeight + stabilityWeight + piecesWeight;
  
  return {
    position: positionWeight / total,
    mobility: mobilityWeight / total,
    corner: cornerWeight / total,
    stability: stabilityWeight / total,
    pieces: piecesWeight / total,
  };
}

/**
 * Main fuzzy evaluation function
 */
export function fuzzyEvaluateBoard(board: Board, player: Player): FuzzyEvaluationResult {
  const opponent = getOpponent(player);
  const pieces = countPieces(board);
  const playerPieces = player === 'black' ? pieces.black : pieces.white;
  const opponentPieces = player === 'black' ? pieces.white : pieces.black;
  const totalPieces = pieces.black + pieces.white;
  
  const playerMoves = getValidMoves(board, player).length;
  const opponentMoves = getValidMoves(board, opponent).length;
  
  // Calculate fuzzy membership values
  const fuzzyState: FuzzyGameState = {
    gamePhase: calculateGamePhase(totalPieces),
    mobility: calculateMobility(playerMoves, opponentMoves),
    cornerControl: calculateCornerControl(board, player),
    stability: calculateStability(board, player),
    pieceAdvantage: calculatePieceAdvantage(playerPieces, opponentPieces),
  };
  
  // Apply fuzzy rules
  const weights = applyFuzzyRules(fuzzyState);
  
  // Calculate component scores
  const positionScore = calculatePositionScore(board, player);
  const mobilityScore = (playerMoves - opponentMoves) * 10;
  const cornerScore = calculateCornerScore(board, player);
  const stabilityScore = calculateStabilityScore(fuzzyState.stability);
  const pieceScore = (playerPieces - opponentPieces) * 10;
  
  // Weighted final score using fuzzy weights
  const finalScore = 
    weights.position * positionScore +
    weights.mobility * mobilityScore +
    weights.corner * cornerScore +
    weights.stability * stabilityScore +
    weights.pieces * pieceScore;
  
  return {
    finalScore,
    fuzzyState,
    weights,
  };
}

// Position weights for evaluation
const POSITION_WEIGHTS: number[][] = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [5, -2, 1, 0, 0, 1, -2, 5],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

function calculatePositionScore(board: Board, player: Player): number {
  const opponent = getOpponent(player);
  let score = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === player) {
        score += POSITION_WEIGHTS[row][col];
      } else if (board[row][col] === opponent) {
        score -= POSITION_WEIGHTS[row][col];
      }
    }
  }
  
  return score;
}

function calculateCornerScore(board: Board, player: Player): number {
  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: 7 },
    { row: 7, col: 0 },
    { row: 7, col: 7 },
  ];
  
  const opponent = getOpponent(player);
  let score = 0;
  
  for (const corner of corners) {
    if (board[corner.row][corner.col] === player) score += 25;
    else if (board[corner.row][corner.col] === opponent) score -= 25;
  }
  
  return score;
}

function calculateStabilityScore(stability: FuzzyGameState['stability']): number {
  return stability.stable * 30 + stability.neutral * 10 - stability.unstable * 20;
}
