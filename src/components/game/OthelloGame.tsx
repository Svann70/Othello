/**
 * OthelloGame Component
 * Main game container managing state and game flow
 * Supports both PvE (vs AI) and PvP (local 2-player) modes
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  GameState,
  Player,
  Move,
  Position,
  createInitialGameState,
  applyMove,
  getValidMoves,
  countPieces,
  getOpponent,
  getAiMove,
  getAiEvaluation,
  evaluateAllMoves,
} from '@/lib/gameLogic';
import { FuzzyGameState } from '@/lib/fuzzyLogic';
import MainMenu, { GameMode } from './MainMenu';
import GameBoard from './GameBoard';
import ScorePanel from './ScorePanel';
import GameOverlay from './GameOverlay';
import CreditsFooter from './CreditsFooter';
import AIVisualization, { MoveEvaluation } from './AIVisualization';

type GamePhase = 'menu' | 'playing' | 'gameover';

const OthelloGame = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [playerColor, setPlayerColor] = useState<Player>('black');
  const [difficulty, setDifficulty] = useState(4);
  const [recentlyPlaced, setRecentlyPlaced] = useState<Position | null>(null);
  const [recentlyFlipped, setRecentlyFlipped] = useState<Position[]>([]);
  
  // AI Visualization state
  const [showAiViz, setShowAiViz] = useState(true);
  const [fuzzyState, setFuzzyState] = useState<FuzzyGameState | null>(null);
  const [evalWeights, setEvalWeights] = useState<{
    position: number;
    mobility: number;
    corner: number;
    stability: number;
    pieces: number;
  } | null>(null);
  const [topMoves, setTopMoves] = useState<MoveEvaluation[]>([]);
  const [currentEval, setCurrentEval] = useState(0);
  
  const aiTimeoutRef = useRef<number | null>(null);

  // Update AI visualization when board changes
  useEffect(() => {
    if (gamePhase === 'playing' && gameMode === 'pve' && !gameState.isGameOver) {
      try {
        const aiPlayer = getOpponent(playerColor);
        const evaluation = getAiEvaluation(gameState.board, aiPlayer);
        setFuzzyState(evaluation.fuzzyState);
        setEvalWeights(evaluation.weights);
        setCurrentEval(evaluation.finalScore);
        
        // Get top moves for visualization
        const moves = evaluateAllMoves(gameState.board, aiPlayer, Math.min(difficulty, 3));
        setTopMoves(moves);
      } catch {
        // Ignore errors during evaluation
      }
    }
  }, [gameState.board, gamePhase, gameMode, playerColor, difficulty, gameState.isGameOver]);

  // Start a new game with selected options
  const handleStartGame = useCallback((color: Player, diff: number, mode: GameMode) => {
    setPlayerColor(color);
    setDifficulty(diff);
    setGameMode(mode);
    setGameState(createInitialGameState());
    setGamePhase('playing');
    setRecentlyPlaced(null);
    setRecentlyFlipped([]);
    setFuzzyState(null);
    setEvalWeights(null);
    setTopMoves([]);
    setCurrentEval(0);
  }, []);

  // Handle player making a move (works for both PvE and PvP)
  const handleCellClick = useCallback((move: Move) => {
    // In PvE mode, only allow moves when it's player's turn and AI isn't thinking
    if (gameMode === 'pve') {
      if (gameState.isAiThinking || gameState.currentPlayer !== playerColor) {
        return;
      }
    }

    // Apply the move
    const newBoard = applyMove(gameState.board, move, gameState.currentPlayer);
    const pieces = countPieces(newBoard);
    const nextPlayer = getOpponent(gameState.currentPlayer);
    const nextValidMoves = getValidMoves(newBoard, nextPlayer);

    // Set animation states
    setRecentlyPlaced({ row: move.row, col: move.col });
    setRecentlyFlipped(move.flips);

    // Clear animation states after animation completes
    setTimeout(() => {
      setRecentlyPlaced(null);
      setRecentlyFlipped([]);
    }, 500);

    // Check if next player can move
    let finalNextPlayer = nextPlayer;
    let finalValidMoves = nextValidMoves;

    if (nextValidMoves.length === 0) {
      // Next player has no moves, check if current player can continue
      const currentPlayerMoves = getValidMoves(newBoard, gameState.currentPlayer);
      if (currentPlayerMoves.length === 0) {
        // Game over - no one can move
        const winner = pieces.black > pieces.white 
          ? 'black' 
          : pieces.white > pieces.black 
            ? 'white' 
            : 'tie';
        
        setGameState(prev => ({
          ...prev,
          board: newBoard,
          blackScore: pieces.black,
          whiteScore: pieces.white,
          validMoves: [],
          lastMove: { row: move.row, col: move.col },
          isGameOver: true,
          winner,
        }));
        setGamePhase('gameover');
        return;
      }
      // Skip next player's turn
      finalNextPlayer = gameState.currentPlayer;
      finalValidMoves = currentPlayerMoves;
    }

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: finalNextPlayer,
      blackScore: pieces.black,
      whiteScore: pieces.white,
      validMoves: finalValidMoves,
      lastMove: { row: move.row, col: move.col },
    }));
  }, [gameState, playerColor, gameMode]);

  // AI move logic - only active in PvE mode
  useEffect(() => {
    // Skip AI logic in PvP mode
    if (gameMode === 'pvp') return;

    if (
      gamePhase !== 'playing' ||
      gameState.isGameOver ||
      gameState.currentPlayer === playerColor
    ) {
      return;
    }

    // Set AI thinking state
    setGameState(prev => ({ ...prev, isAiThinking: true }));

    // Delay AI move for better UX
    aiTimeoutRef.current = window.setTimeout(() => {
      const aiMove = getAiMove(gameState.board, gameState.currentPlayer, difficulty);

      if (!aiMove) {
        // AI has no moves, pass turn back to player
        const playerMoves = getValidMoves(gameState.board, playerColor);
        if (playerMoves.length === 0) {
          // Game over
          const pieces = countPieces(gameState.board);
          const winner = pieces.black > pieces.white 
            ? 'black' 
            : pieces.white > pieces.black 
              ? 'white' 
              : 'tie';
          
          setGameState(prev => ({
            ...prev,
            isAiThinking: false,
            isGameOver: true,
            winner,
            validMoves: [],
          }));
          setGamePhase('gameover');
        } else {
          setGameState(prev => ({
            ...prev,
            isAiThinking: false,
            currentPlayer: playerColor,
            validMoves: playerMoves,
          }));
        }
        return;
      }

      // Apply AI move
      const newBoard = applyMove(gameState.board, aiMove, gameState.currentPlayer);
      const pieces = countPieces(newBoard);
      const playerMoves = getValidMoves(newBoard, playerColor);

      // Set animation states
      setRecentlyPlaced({ row: aiMove.row, col: aiMove.col });
      setRecentlyFlipped(aiMove.flips);

      setTimeout(() => {
        setRecentlyPlaced(null);
        setRecentlyFlipped([]);
      }, 500);

      // Check if player can move
      if (playerMoves.length === 0) {
        const aiMoves = getValidMoves(newBoard, gameState.currentPlayer);
        if (aiMoves.length === 0) {
          // Game over
          const winner = pieces.black > pieces.white 
            ? 'black' 
            : pieces.white > pieces.black 
              ? 'white' 
              : 'tie';
          
          setGameState(prev => ({
            ...prev,
            board: newBoard,
            blackScore: pieces.black,
            whiteScore: pieces.white,
            lastMove: { row: aiMove.row, col: aiMove.col },
            isAiThinking: false,
            isGameOver: true,
            winner,
            validMoves: [],
          }));
          setGamePhase('gameover');
        } else {
          // AI plays again
          setGameState(prev => ({
            ...prev,
            board: newBoard,
            blackScore: pieces.black,
            whiteScore: pieces.white,
            lastMove: { row: aiMove.row, col: aiMove.col },
            isAiThinking: false,
            validMoves: aiMoves,
          }));
        }
      } else {
        setGameState(prev => ({
          ...prev,
          board: newBoard,
          currentPlayer: playerColor,
          blackScore: pieces.black,
          whiteScore: pieces.white,
          validMoves: playerMoves,
          lastMove: { row: aiMove.row, col: aiMove.col },
          isAiThinking: false,
        }));
      }
    }, 800);

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [gamePhase, gameMode, gameState.currentPlayer, gameState.isGameOver, gameState.board, playerColor, difficulty]);

  // Restart game
  const handleRestart = useCallback(() => {
    setGamePhase('menu');
    setGameState(createInitialGameState());
    setRecentlyPlaced(null);
    setRecentlyFlipped([]);
    setFuzzyState(null);
    setEvalWeights(null);
    setTopMoves([]);
    setCurrentEval(0);
  }, []);

  // Render menu screen
  if (gamePhase === 'menu') {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  // Determine if the board should be disabled
  const isBoardDisabled = gameMode === 'pve' 
    ? gameState.isAiThinking || gameState.currentPlayer !== playerColor
    : false; // In PvP, board is never disabled

  // Render game screen
  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center gap-6 p-4 sm:p-8">
      {/* Main board area */}
      <div className="w-full max-w-[min(90vw,500px)] lg:max-w-[500px]">
        <GameBoard
          board={gameState.board}
          validMoves={gameState.validMoves}
          lastMove={gameState.lastMove}
          onCellClick={handleCellClick}
          disabled={isBoardDisabled}
          recentlyPlaced={recentlyPlaced}
          recentlyFlipped={recentlyFlipped}
        />
      </div>

      {/* Side panel */}
      <div className="w-full max-w-[min(90vw,300px)] lg:max-w-[280px] flex flex-col gap-4">
        <ScorePanel
          blackScore={gameState.blackScore}
          whiteScore={gameState.whiteScore}
          currentPlayer={gameState.currentPlayer}
          isAiThinking={gameState.isAiThinking}
          isGameOver={gameState.isGameOver}
          playerColor={playerColor}
          gameMode={gameMode}
        />

        {/* AI Visualization - only in PvE mode */}
        {gameMode === 'pve' && (
          <>
            <button
              type="button"
              onClick={() => setShowAiViz(!showAiViz)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              {showAiViz ? 'Hide' : 'Show'} AI Analysis
            </button>
            <AIVisualization
              isVisible={showAiViz}
              isThinking={gameState.isAiThinking}
              fuzzyState={fuzzyState}
              weights={evalWeights}
              topMoves={topMoves}
              currentEvaluation={currentEval}
            />
          </>
        )}

        {/* Game controls */}
        <div className="game-panel rounded-xl p-4">
          <button
            type="button"
            onClick={handleRestart}
            className="w-full py-2 px-4 rounded-lg border border-border text-sm font-medium transition-colors duration-200 hover:bg-secondary/50"
          >
            Return to Menu
          </button>
        </div>

        {/* Credits */}
        <div className="game-panel rounded-xl p-4">
          <CreditsFooter />
        </div>
      </div>

      {/* Game over overlay */}
      <GameOverlay
        isVisible={gamePhase === 'gameover'}
        winner={gameState.winner}
        blackScore={gameState.blackScore}
        whiteScore={gameState.whiteScore}
        playerColor={playerColor}
        onRestart={handleRestart}
        gameMode={gameMode}
      />
    </div>
  );
};

export default OthelloGame;
