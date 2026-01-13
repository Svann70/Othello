/**
 * Othello Game Logic
 * Core game mechanics, validation, and AI implementation
 * Uses Minimax with Alpha-Beta Pruning and Fuzzy Logic for AI decisions
 */

export type Player = 'black' | 'white';
export type CellState = Player | null;
export type Board = CellState[][];

export interface Position {
  row: number;
  col: number;
}

export interface Move extends Position {
  flips: Position[];
}

export interface GameState {
  board: Board;
  currentPlayer: Player;
  blackScore: number;
  whiteScore: number;
  validMoves: Move[];
  lastMove: Position | null;
  isGameOver: boolean;
  winner: Player | 'tie' | null;
  isAiThinking: boolean;
}

// Direction vectors for checking valid moves
const DIRECTIONS: Position[] = [
  { row: -1, col: 0 },  // Up
  { row: 1, col: 0 },   // Down
  { row: 0, col: -1 },  // Left
  { row: 0, col: 1 },   // Right
  { row: -1, col: -1 }, // Up-Left
  { row: -1, col: 1 },  // Up-Right
  { row: 1, col: -1 },  // Down-Left
  { row: 1, col: 1 },   // Down-Right
];

// Position weights for AI evaluation (corners and edges are valuable)
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

/**
 * Creates an initial game board with starting pieces
 */
export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set up initial four pieces in the center
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  
  return board;
}

/**
 * Checks if a position is within board boundaries
 */
function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

/**
 * Gets the opponent player
 */
export function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black';
}

/**
 * Finds pieces that would be flipped for a move in a specific direction
 */
function getFlipsInDirection(
  board: Board,
  row: number,
  col: number,
  direction: Position,
  player: Player
): Position[] {
  const flips: Position[] = [];
  const opponent = getOpponent(player);
  
  let currentRow = row + direction.row;
  let currentCol = col + direction.col;
  
  // Collect opponent pieces in this direction
  while (isValidPosition(currentRow, currentCol) && board[currentRow][currentCol] === opponent) {
    flips.push({ row: currentRow, col: currentCol });
    currentRow += direction.row;
    currentCol += direction.col;
  }
  
  // Valid only if we end on our own piece
  if (flips.length > 0 && isValidPosition(currentRow, currentCol) && board[currentRow][currentCol] === player) {
    return flips;
  }
  
  return [];
}

/**
 * Calculates all valid moves for a player
 */
export function getValidMoves(board: Board, player: Player): Move[] {
  const moves: Move[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      // Skip non-empty cells
      if (board[row][col] !== null) continue;
      
      const allFlips: Position[] = [];
      
      // Check all directions for flippable pieces
      for (const direction of DIRECTIONS) {
        const flips = getFlipsInDirection(board, row, col, direction, player);
        allFlips.push(...flips);
      }
      
      // Valid move if at least one piece can be flipped
      if (allFlips.length > 0) {
        moves.push({ row, col, flips: allFlips });
      }
    }
  }
  
  return moves;
}

/**
 * Applies a move to the board and returns the new board state
 */
export function applyMove(board: Board, move: Move, player: Player): Board {
  const newBoard = board.map(row => [...row]);
  
  // Place the piece
  newBoard[move.row][move.col] = player;
  
  // Flip captured pieces
  for (const flip of move.flips) {
    newBoard[flip.row][flip.col] = player;
  }
  
  return newBoard;
}

/**
 * Counts pieces for each player
 */
export function countPieces(board: Board): { black: number; white: number } {
  let black = 0;
  let white = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === 'black') black++;
      else if (board[row][col] === 'white') white++;
    }
  }
  
  return { black, white };
}

/**
 * Evaluates the board state for AI decision making
 * Uses enhanced fuzzy logic system with multiple membership functions
 */
function evaluateBoard(board: Board, player: Player): number {
  // Import fuzzy evaluation dynamically to avoid circular deps
  const { fuzzyEvaluateBoard } = require('./fuzzyLogic');
  const result = fuzzyEvaluateBoard(board, player);
  return result.finalScore;
}

/**
 * Get detailed AI evaluation for visualization
 */
export function getAiEvaluation(board: Board, player: Player) {
  const { fuzzyEvaluateBoard } = require('./fuzzyLogic');
  return fuzzyEvaluateBoard(board, player);
}

/**
 * Get evaluations for all valid moves (for AI visualization)
 */
export function evaluateAllMoves(board: Board, player: Player, depth: number = 3) {
  const validMoves = getValidMoves(board, player);
  const evaluations: { row: number; col: number; score: number }[] = [];
  
  for (const move of validMoves) {
    const newBoard = applyMove(board, move, player);
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, player);
    evaluations.push({ row: move.row, col: move.col, score });
  }
  
  // Sort by score descending
  evaluations.sort((a, b) => b.score - a.score);
  
  return evaluations;
}

/**
 * Minimax algorithm with Alpha-Beta pruning for AI move selection
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  aiPlayer: Player
): number {
  const currentPlayer = maximizingPlayer ? aiPlayer : getOpponent(aiPlayer);
  const validMoves = getValidMoves(board, currentPlayer);
  
  // Terminal conditions
  if (depth === 0 || validMoves.length === 0) {
    return evaluateBoard(board, aiPlayer);
  }
  
  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      const newBoard = applyMove(board, move, currentPlayer);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, aiPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break; // Alpha-Beta pruning
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      const newBoard = applyMove(board, move, currentPlayer);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, aiPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break; // Alpha-Beta pruning
    }
    return minEval;
  }
}

/**
 * Selects the best move for the AI player
 */
export function getAiMove(board: Board, player: Player, difficulty: number = 4): Move | null {
  const validMoves = getValidMoves(board, player);
  
  if (validMoves.length === 0) return null;
  
  let bestMove = validMoves[0];
  let bestScore = -Infinity;
  
  for (const move of validMoves) {
    const newBoard = applyMove(board, move, player);
    const score = minimax(newBoard, difficulty, -Infinity, Infinity, false, player);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}

/**
 * Creates the initial game state
 */
export function createInitialGameState(): GameState {
  const board = createInitialBoard();
  const validMoves = getValidMoves(board, 'black');
  
  return {
    board,
    currentPlayer: 'black',
    blackScore: 2,
    whiteScore: 2,
    validMoves,
    lastMove: null,
    isGameOver: false,
    winner: null,
    isAiThinking: false,
  };
}
