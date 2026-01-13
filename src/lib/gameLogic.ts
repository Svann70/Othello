/**
 * Game Logic for Othello
 * Optimized for web performance with reduced depth
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

// Direction vectors for checking moves
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],          [0, 1],
  [1, -1],  [1, 0], [1, 1]
] as const;

// Position weights for evaluation (corners are most valuable)
const POSITION_WEIGHTS = [
  [100, -20, 10,  5,  5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [ 10,  -2,  1,  1,  1,  1,  -2,  10],
  [  5,  -2,  1,  0,  0,  1,  -2,   5],
  [  5,  -2,  1,  0,  0,  1,  -2,   5],
  [ 10,  -2,  1,  1,  1,  1,  -2,  10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10,  5,  5, 10, -20, 100],
];

// Create initial game state
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

// Create initial board with starting pieces
export function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set initial 4 pieces in center
  board[3][3] = 'white';
  board[3][4] = 'black';
  board[4][3] = 'black';
  board[4][4] = 'white';
  
  return board;
}

// Deep clone board
function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

// Check if position is within board bounds
function isValidPosition(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

// Get opponent player
export function getOpponent(player: Player): Player {
  return player === 'black' ? 'white' : 'black';
}

// Get all pieces that would be flipped for a move
function getFlips(board: Board, row: number, col: number, player: Player): Position[] {
  if (board[row][col] !== null) return [];
  
  const opponent = getOpponent(player);
  const allFlips: Position[] = [];
  
  for (const [dr, dc] of DIRECTIONS) {
    const lineFlips: Position[] = [];
    let r = row + dr;
    let c = col + dc;
    
    // Follow the line of opponent pieces
    while (isValidPosition(r, c) && board[r][c] === opponent) {
      lineFlips.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
    
    // If line ends with player's piece, add all flips
    if (lineFlips.length > 0 && isValidPosition(r, c) && board[r][c] === player) {
      allFlips.push(...lineFlips);
    }
  }
  
  return allFlips;
}

// Get all valid moves for a player
export function getValidMoves(board: Board, player: Player): Move[] {
  const moves: Move[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const flips = getFlips(board, row, col, player);
      if (flips.length > 0) {
        moves.push({ row, col, flips });
      }
    }
  }
  
  return moves;
}

// Apply a move to the board
export function applyMove(board: Board, move: Move, player: Player): Board {
  const newBoard = cloneBoard(board);
  
  // Place the piece
  newBoard[move.row][move.col] = player;
  
  // Flip captured pieces
  for (const flip of move.flips) {
    newBoard[flip.row][flip.col] = player;
  }
  
  return newBoard;
}

// Count pieces on the board
export function countPieces(board: Board): { black: number; white: number } {
  let black = 0;
  let white = 0;
  
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'black') black++;
      else if (cell === 'white') white++;
    }
  }
  
  return { black, white };
}

// Count corners controlled by each player
function countCorners(board: Board): { black: number; white: number } {
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  let black = 0;
  let white = 0;
  
  for (const [row, col] of corners) {
    if (board[row][col] === 'black') black++;
    else if (board[row][col] === 'white') white++;
  }
  
  return { black, white };
}

// Simplified evaluation function for fast performance
function evaluateBoard(board: Board, player: Player): number {
  const opponent = getOpponent(player);
  const pieces = countPieces(board);
  const corners = countCorners(board);
  const totalPieces = pieces.black + pieces.white;
  
  // Position score
  let positionScore = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === player) {
        positionScore += POSITION_WEIGHTS[row][col];
      } else if (board[row][col] === opponent) {
        positionScore -= POSITION_WEIGHTS[row][col];
      }
    }
  }
  
  // Mobility score
  const playerMoves = getValidMoves(board, player).length;
  const opponentMoves = getValidMoves(board, opponent).length;
  const mobilityScore = (playerMoves - opponentMoves) * 5;
  
  // Corner score (very important)
  const cornerScore = (
    (player === 'black' ? corners.black : corners.white) -
    (player === 'black' ? corners.white : corners.black)
  ) * 25;
  
  // Piece count becomes more important in late game
  const pieceWeight = totalPieces > 50 ? 2 : 0.5;
  const pieceScore = (
    (player === 'black' ? pieces.black : pieces.white) -
    (player === 'black' ? pieces.white : pieces.black)
  ) * pieceWeight;
  
  return positionScore + mobilityScore + cornerScore + pieceScore;
}

// Minimax with alpha-beta pruning - Optimized with reduced depth
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  player: Player,
  maxDepth: number
): number {
  const currentPlayer = isMaximizing ? player : getOpponent(player);
  const moves = getValidMoves(board, currentPlayer);
  
  // Terminal conditions
  if (depth >= maxDepth || moves.length === 0) {
    if (moves.length === 0) {
      const opponentMoves = getValidMoves(board, getOpponent(currentPlayer));
      if (opponentMoves.length === 0) {
        // Game over
        const pieces = countPieces(board);
        const playerPieces = player === 'black' ? pieces.black : pieces.white;
        const opponentPieces = player === 'black' ? pieces.white : pieces.black;
        
        if (playerPieces > opponentPieces) return 10000;
        if (playerPieces < opponentPieces) return -10000;
        return 0;
      }
    }
    return evaluateBoard(board, player);
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move, currentPlayer);
      const eval_ = minimax(newBoard, depth + 1, alpha, beta, false, player, maxDepth);
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move, currentPlayer);
      const eval_ = minimax(newBoard, depth + 1, alpha, beta, true, player, maxDepth);
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Get the best AI move - Ultra-optimized for web
export function getAiMove(board: Board, player: Player, difficulty: number): Move | null {
  const moves = getValidMoves(board, player);
  if (moves.length === 0) return null;
  
  // Ultra-reduced depth: Easy=1, Medium=1, Hard=2 (max)
  const maxDepth = difficulty >= 5 ? 2 : 1;
  
  // For very fast response, limit evaluated moves
  const maxMovesToEvaluate = difficulty >= 5 ? 8 : 5;
  
  // Quick sort by position weight to prioritize good moves
  const sortedMoves = moves
    .map(m => ({ move: m, weight: POSITION_WEIGHTS[m.row][m.col] }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxMovesToEvaluate)
    .map(m => m.move);
  
  let bestMove = sortedMoves[0];
  let bestScore = -Infinity;
  
  for (const move of sortedMoves) {
    const newBoard = applyMove(board, move, player);
    const score = minimax(newBoard, 0, -Infinity, Infinity, false, player, maxDepth);
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  
  return bestMove;
}

// Simplified AI evaluation for visualization
export function getAiEvaluation(board: Board, player: Player): {
  finalScore: number;
  weights: {
    position: number;
    mobility: number;
    corner: number;
    stability: number;
    pieces: number;
  };
} {
  const opponent = getOpponent(player);
  const pieces = countPieces(board);
  const corners = countCorners(board);
  const totalPieces = pieces.black + pieces.white;
  
  // Calculate individual scores
  let positionScore = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === player) {
        positionScore += POSITION_WEIGHTS[row][col];
      } else if (board[row][col] === opponent) {
        positionScore -= POSITION_WEIGHTS[row][col];
      }
    }
  }
  
  const playerMoves = getValidMoves(board, player).length;
  const opponentMoves = getValidMoves(board, opponent).length;
  const mobilityScore = playerMoves - opponentMoves;
  
  const playerCorners = player === 'black' ? corners.black : corners.white;
  const opponentCorners = player === 'black' ? corners.white : corners.black;
  const cornerScore = playerCorners - opponentCorners;
  
  const playerPieces = player === 'black' ? pieces.black : pieces.white;
  const opponentPieces = player === 'black' ? pieces.white : pieces.black;
  const pieceScore = playerPieces - opponentPieces;
  
  // Normalize weights based on game phase
  const gameProgress = totalPieces / 64;
  
  return {
    finalScore: positionScore * 0.3 + mobilityScore * 5 + cornerScore * 25 + pieceScore * (gameProgress > 0.7 ? 2 : 0.5),
    weights: {
      position: Math.min(1, Math.abs(positionScore) / 200),
      mobility: Math.min(1, Math.abs(mobilityScore) / 10),
      corner: Math.min(1, playerCorners / 4),
      stability: gameProgress,
      pieces: Math.min(1, playerPieces / 32),
    }
  };
}

// Evaluate all moves for visualization - Simplified version
export function evaluateAllMoves(board: Board, player: Player, depth: number = 1): {
  row: number;
  col: number;
  score: number;
}[] {
  const moves = getValidMoves(board, player);
  
  return moves.map(move => {
    const newBoard = applyMove(board, move, player);
    const score = evaluateBoard(newBoard, player);
    return {
      row: move.row,
      col: move.col,
      score,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}
